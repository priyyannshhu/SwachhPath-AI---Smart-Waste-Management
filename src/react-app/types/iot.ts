/**
 * IoT Device Types and Interfaces
 * Supports ESP32 and future IoT integrations
 */

export interface IoTDeviceData {
  deviceId: string;
  lat: number;
  lng: number;
  fillLevel: number;
  battery: number;
  status: "online" | "offline" | "error";
  timestamp?: number;
}

export interface IoTDeviceUpdate {
  deviceId: string;
  fillLevel?: number;
  battery?: number;
  status?: "online" | "offline" | "error";
  lat?: number;
  lng?: number;
}

export interface IoTStreamData {
  devices: IoTDeviceData[];
}

export type DataMode = "demo" | "live";

export interface IoTServiceConfig {
  mode: DataMode;
  updateInterval?: number; // milliseconds
}

export type DeviceUpdateCallback = (device: IoTDeviceData) => void;
export type BulkUpdateCallback = (devices: IoTDeviceData[]) => void;
