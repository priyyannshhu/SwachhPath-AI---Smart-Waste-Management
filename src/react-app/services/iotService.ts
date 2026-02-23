/**
 * IoT Service Layer
 * Abstracts data sources (Demo Simulation vs Real ESP32/Future integrations)
 * 
 * Architecture:
 * - Demo Mode: Simulates bin fill levels, GPS drift, battery drain
 * - Live Mode: Ready for HTTP POST, WebSocket, or MQTT bridge implementations
 */

import {
  IoTDeviceData,
  IoTServiceConfig,
  DeviceUpdateCallback,
  BulkUpdateCallback,
  DataMode,
} from "@/react-app/types/iot";

class IoTService {
  private devices: Map<string, IoTDeviceData> = new Map();
  private mode: DataMode = "demo";
  private updateInterval: number = 3000; // 3-5 seconds
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: Set<DeviceUpdateCallback> = new Set();
  private bulkCallbacks: Set<BulkUpdateCallback> = new Set();

  /**
   * Initialize IoT Service with configuration
   */
  async initialize(config: IoTServiceConfig = { mode: "demo" }): Promise<void> {
    this.mode = config.mode;
    this.updateInterval = config.updateInterval || 3000;

    if (this.mode === "demo") {
      await this.loadDemoData();
      this.startDemoSimulation();
    }
    // Live mode setup would go here for future ESP32 integration
  }

  /**
   * Load demo simulation data from iot_stream.json
   */
  private async loadDemoData(): Promise<void> {
    try {
      // Import JSON directly to ensure it's bundled
      const iotStreamModule = await import("@/react-app/data/iot_stream.json", {
        assert: { type: "json" },
      });
      const data = iotStreamModule.default || iotStreamModule;

      if (!data.devices || !Array.isArray(data.devices)) {
        throw new Error("Invalid iot_stream.json format");
      }

      data.devices.forEach((device: IoTDeviceData) => {
        this.devices.set(device.deviceId, { ...device, timestamp: Date.now() });
      });

      console.log(`[IoT] Loaded ${this.devices.size} demo devices`);
    } catch (error) {
      console.error("[IoT] Failed to load demo data:", error);
      // Fallback: create default demo devices
      this.createDefaultDevices();
    }
  }

  /**
   * Create default demo devices if file load fails
   */
  private createDefaultDevices(): void {
    const defaultDevices: IoTDeviceData[] = [
      { deviceId: "GB01", lat: 26.7606, lng: 83.3732, fillLevel: 45, battery: 85, status: "online" },
      { deviceId: "GB02", lat: 26.7615, lng: 83.3725, fillLevel: 62, battery: 78, status: "online" },
      { deviceId: "GB03", lat: 26.7598, lng: 83.3740, fillLevel: 88, battery: 92, status: "online" },
      { deviceId: "GB04", lat: 26.7620, lng: 83.3735, fillLevel: 35, battery: 81, status: "online" },
      { deviceId: "GB05", lat: 26.7610, lng: 83.3745, fillLevel: 71, battery: 88, status: "online" },
    ];

    defaultDevices.forEach((device) => {
      this.devices.set(device.deviceId, { ...device, timestamp: Date.now() });
    });

    console.log("[IoT] Created default demo devices");
  }

  /**
   * Start demo simulation with realistic updates
   */
  private startDemoSimulation(): void {
    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(() => {
      const updates: IoTDeviceData[] = [];

      this.devices.forEach((device) => {
        const updated = this.simulateDeviceUpdate(device);
        this.devices.set(device.deviceId, updated);
        updates.push(updated);

        // Call individual callbacks
        this.callbacks.forEach((callback) => callback(updated));
      });

      // Call bulk callbacks
      this.bulkCallbacks.forEach((callback) => callback(updates));
    }, this.updateInterval);
  }

  /**
   * Simulate realistic device updates (fill level changes, GPS drift, battery drain)
   */
  private simulateDeviceUpdate(device: IoTDeviceData): IoTDeviceData {
    // Random fill level change (-5 to +8%)
    const fillChange = (Math.random() - 0.2) * 5;
    let newFillLevel = Math.max(0, Math.min(100, device.fillLevel + fillChange));

    // Small GPS drift (±0.0005 degrees)
    const latDrift = (Math.random() - 0.5) * 0.001;
    const lngDrift = (Math.random() - 0.5) * 0.001;

    // Battery drain simulation (-0.1 to -0.5% per update)
    const batteryDrain = Math.random() * 0.4 + 0.1;
    let newBattery = Math.max(0, device.battery - batteryDrain);

    // Random offline events (5% chance)
    const randomOffline = Math.random() > 0.95;
    const newStatus = randomOffline ? "offline" : "online";

    return {
      ...device,
      fillLevel: parseFloat(newFillLevel.toFixed(1)),
      lat: parseFloat((device.lat + latDrift).toFixed(6)),
      lng: parseFloat((device.lng + lngDrift).toFixed(6)),
      battery: parseFloat(newBattery.toFixed(1)),
      status: newStatus,
      timestamp: Date.now(),
    };
  }

  /**
   * Get all live bins
   */
  getLiveBins(): IoTDeviceData[] {
    return Array.from(this.devices.values());
  }

  /**
   * Get specific bin by device ID
   */
  getDevice(deviceId: string): IoTDeviceData | undefined {
    return this.devices.get(deviceId);
  }

  /**
   * Subscribe to individual device updates
   */
  subscribeToDeviceUpdates(callback: DeviceUpdateCallback): () => void {
    this.callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Subscribe to bulk updates (all devices in single update)
   */
  subscribeToBulkUpdates(callback: BulkUpdateCallback): () => void {
    this.bulkCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.bulkCallbacks.delete(callback);
    };
  }

  /**
   * Update device (for manual updates or external integrations)
   * Future: Will receive from HTTP POST, WebSocket, or MQTT
   */
  updateDevice(deviceId: string, data: Partial<IoTDeviceData>): void {
    const existing = this.devices.get(deviceId);
    if (!existing) return;

    const updated: IoTDeviceData = {
      ...existing,
      ...data,
      timestamp: Date.now(),
    };

    this.devices.set(deviceId, updated);

    // Notify subscribers
    this.callbacks.forEach((callback) => callback(updated));
  }

  /**
   * Bulk update devices
   * Future: Entry point for WebSocket or MQTT messages
   */
  bulkUpdateDevices(updates: Array<{ deviceId: string; data: Partial<IoTDeviceData> }>): void {
    const updatedDevices: IoTDeviceData[] = [];

    updates.forEach(({ deviceId, data }) => {
      const existing = this.devices.get(deviceId);
      if (!existing) return;

      const updated: IoTDeviceData = {
        ...existing,
        ...data,
        timestamp: Date.now(),
      };

      this.devices.set(deviceId, updated);
      updatedDevices.push(updated);

      // Notify individual subscribers
      this.callbacks.forEach((callback) => callback(updated));
    });

    // Notify bulk subscribers
    this.bulkCallbacks.forEach((callback) => callback(updatedDevices));
  }

  /**
   * Stop simulation or live updates
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.callbacks.clear();
    this.bulkCallbacks.clear();
    console.log("[IoT] Service stopped");
  }

  /**
   * Get current operational mode
   */
  getMode(): DataMode {
    return this.mode;
  }

  /**
   * Check if service is actively running
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }
}

// Singleton instance
export const iotService = new IoTService();

export default iotService;
