# SwachhPath AI - IoT API Reference

## Quick Access

- **Service Instance**: `iotService` (singleton)
- **React Hook**: `useIoT()` (for components)
- **React Context**: `useData()` (recommended)
- **Type Definitions**: `IoTDeviceData`, `IoTServiceConfig`

---

## IoT Service API

### `initialize(config?: IoTServiceConfig): Promise<void>`

Initialize the IoT service.

**Parameters:**
```typescript
{
  mode?: "demo" | "live",        // Default: "demo"
  updateInterval?: number        // Milliseconds between updates (default: 3000)
}
```

**Usage:**
```typescript
import iotService from "@/react-app/services/iotService";

// Demo mode (default)
await iotService.initialize({ mode: "demo" });

// Custom update interval
await iotService.initialize({ 
  mode: "demo", 
  updateInterval: 5000  // 5 seconds
});

// Live mode (future)
await iotService.initialize({ mode: "live" });
```

**Returns:** Promise that resolves when service is ready

---

### `getLiveBins(): IoTDeviceData[]`

Get all currently active devices.

**Usage:**
```typescript
const devices = iotService.getLiveBins();
console.log(`Found ${devices.length} devices`);

devices.forEach(device => {
  console.log(`${device.deviceId}: ${device.fillLevel}% full`);
});
```

**Returns:** Array of `IoTDeviceData` objects (current state)

**Time Complexity:** O(1) - returns internal map values

---

### `getDevice(deviceId: string): IoTDeviceData | undefined`

Get specific device by ID.

**Usage:**
```typescript
const device = iotService.getDevice("GB01");

if (device) {
  console.log(`Device ${device.deviceId}:`);
  console.log(`  Fill: ${device.fillLevel}%`);
  console.log(`  Battery: ${device.battery}%`);
  console.log(`  Status: ${device.status}`);
} else {
  console.log("Device not found");
}
```

**Returns:** `IoTDeviceData` or `undefined`

---

### `subscribeToDeviceUpdates(callback: DeviceUpdateCallback): () => void`

Subscribe to individual device updates.

**Parameters:**
```typescript
callback: (device: IoTDeviceData) => void
```

**Usage:**
```typescript
import iotService from "@/react-app/services/iotService";

const unsubscribe = iotService.subscribeToDeviceUpdates((device) => {
  console.log(`Device updated: ${device.deviceId}`);
  console.log(`New fill level: ${device.fillLevel}%`);
});

// Later, to stop listening:
unsubscribe();
```

**Returns:** Unsubscribe function

**Notes:**
- Called once per device per update cycle
- Multiple callbacks can be registered
- Use for real-time, device-specific monitoring

---

### `subscribeToBulkUpdates(callback: BulkUpdateCallback): () => void`

Subscribe to all device updates at once.

**Parameters:**
```typescript
callback: (devices: IoTDeviceData[]) => void
```

**Usage:**
```typescript
const unsubscribe = iotService.subscribeToBulkUpdates((devices) => {
  console.log(`${devices.length} devices updated`);
  
  devices.forEach(device => {
    if (device.fillLevel > 80) {
      console.log(`🚨 High fill: ${device.deviceId}`);
    }
  });
});

// Later:
unsubscribe();
```

**Returns:** Unsubscribe function

**Notes:**
- Called once per update cycle with all changed devices
- More efficient for batch processing
- Use for analytics, alerts, syncing

---

### `updateDevice(deviceId: string, data: Partial<IoTDeviceData>): void`

Update a device manually (demo mode testing or real API data).

**Parameters:**
```typescript
deviceId: string                           // Device identifier
data: {
  fillLevel?: number                      // 0-100
  battery?: number                        // 0-100
  status?: "online" | "offline" | "error"
  lat?: number
  lng?: number
}
```

**Usage:**
```typescript
// Simulate device going offline
iotService.updateDevice("GB01", { status: "offline" });

// Update fill level
iotService.updateDevice("GB02", { fillLevel: 95 });

// Multiple fields
iotService.updateDevice("GB03", {
  fillLevel: 50,
  battery: 45,
  lat: 26.76055,
  lng: 83.37325
});
```

**Returns:** void

**Triggers:** All registered callbacks

---

### `bulkUpdateDevices(updates: Array<{deviceId: string, data: Partial<IoTDeviceData>}>): void`

Update multiple devices in batch.

**Parameters:**
```typescript
updates: Array<{
  deviceId: string
  data: Partial<IoTDeviceData>
}>
```

**Usage:**
```typescript
// Update multiple devices at once
iotService.bulkUpdateDevices([
  { deviceId: "GB01", data: { fillLevel: 60 } },
  { deviceId: "GB02", data: { battery: 30 } },
  { deviceId: "GB03", data: { status: "offline" } }
]);
```

**Returns:** void

**Notes:**
- More efficient than multiple `updateDevice()` calls
- Perfect for webhook/API receiver implementations
- Triggers bulk callbacks

---

### `stop(): void`

Stop the service and clean up resources.

**Usage:**
```typescript
// When app unmounts or switching modes
iotService.stop();
```

**Returns:** void

**Effects:**
- Clears all subscriptions
- Stops update loop
- Cancels timers
- Clears state

---

### `getMode(): DataMode`

Get current operational mode.

**Usage:**
```typescript
const mode = iotService.getMode();
console.log(mode); // "demo" or "live"

if (mode === "demo") {
  console.log("Running in demo mode");
} else {
  console.log("Connected to live devices");
}
```

**Returns:** `"demo" | "live"`

---

### `isRunning(): boolean`

Check if service is actively running.

**Usage:**
```typescript
if (iotService.isRunning()) {
  console.log("Service is updating devices");
} else {
  console.log("Service is stopped");
}
```

**Returns:** `boolean` - true if update loop is active

---

## React Hook: useIoT()

Custom hook for component-level service access.

**Import:**
```typescript
import { useIoT } from "@/react-app/hooks/useIoT";
```

**Usage:**
```typescript
export function MyComponent() {
  const {
    getLiveBins,
    subscribeToUpdates,
    updateDevice,
    getMode,
    isRunning
  } = useIoT();

  // Use methods...
}
```

**Methods:**
- `getLiveBins(): IoTDeviceData[]`
- `subscribeToUpdates(callback): () => void`
- `updateDevice(deviceId, data): void`
- `getMode(): DataMode`
- `isRunning(): boolean`

**Recommendations:**
- Use `useData()` for normal components
- Use `useIoT()` for direct service control
- Most components don't need this hook

---

## React Context: useData()

Recommended way to access IoT data in components.

**Import:**
```typescript
import { useData } from "@/react-app/context/DataContext";
```

**Usage:**
```typescript
export function Dashboard() {
  const { iotDevices, postcodes } = useData();

  return (
    <div>
      {iotDevices.map(device => (
        <DeviceCard key={device.deviceId} device={device} />
      ))}
    </div>
  );
}
```

**Properties:**
- `iotDevices: IoTDeviceData[]` - Live device data
- `postcodes: Postcode[]` - Synced with IoT data
- `complaints: Complaint[]` - User complaints
- `updateDustbinLevel(pin, id, level): void`
- `syncIoTData(): void` - Manual sync trigger

**Advantages:**
- ✅ Automatic updates
- ✅ Integrated with existing data
- ✅ Single source of truth
- ✅ Recommended for most use cases

---

## Data Types

### IoTDeviceData

```typescript
interface IoTDeviceData {
  deviceId: string;           // Unique identifier (e.g., "GB01")
  lat: number;                // Latitude (e.g., 26.7606)
  lng: number;                // Longitude (e.g., 83.3732)
  fillLevel: number;          // 0-100 (percentage full)
  battery: number;            // 0-100 (percentage)
  status: "online" | "offline" | "error";
  timestamp?: number;         // Milliseconds since epoch
}
```

**Example:**
```javascript
{
  deviceId: "GB01",
  lat: 26.7606,
  lng: 83.3732,
  fillLevel: 45.2,
  battery: 85.3,
  status: "online",
  timestamp: 1708901234567
}
```

---

### IoTServiceConfig

```typescript
interface IoTServiceConfig {
  mode?: "demo" | "live";
  updateInterval?: number;    // Milliseconds (default: 3000)
}
```

---

## Common Patterns

### Monitor Single Device

```typescript
useEffect(() => {
  const unsubscribe = iotService.subscribeToDeviceUpdates((device) => {
    if (device.deviceId === "GB01") {
      console.log(`GB01 is now ${device.fillLevel}% full`);
    }
  });

  return unsubscribe;
}, []);
```

### Monitor All Devices

```typescript
useEffect(() => {
  const unsubscribe = iotService.subscribeToBulkUpdates((devices) => {
    const alertBins = devices.filter(d => d.fillLevel > 80);
    console.log(`${alertBins.length} bins need attention`);
  });

  return unsubscribe;
}, []);
```

### Display Device in React

```typescript
import { useData } from "@/react-app/context/DataContext";

export function DeviceStatus({ deviceId }) {
  const { iotDevices } = useData();
  const device = iotDevices.find(d => d.deviceId === deviceId);

  if (!device) return <div>Device not found</div>;

  return (
    <div>
      <h3>{device.deviceId}</h3>
      <p>Fill: {device.fillLevel.toFixed(1)}%</p>
      <p>Battery: {device.battery.toFixed(1)}%</p>
      <p>Status: {device.status}</p>
    </div>
  );
}
```

### Test Device Updates

```typescript
import iotService from "@/react-app/services/iotService";

// Simulate device going offline
iotService.updateDevice("GB01", { status: "offline" });

// Simulate low battery alert
iotService.updateDevice("GB02", { battery: 15 });

// Simulate bin nearly full
iotService.updateDevice("GB03", { fillLevel: 95 });
```

---

## Error Handling

### Safe Device Access

```typescript
const device = iotService.getDevice("GB01");

if (device) {
  console.log(`Device status: ${device.status}`);
} else {
  console.log("Device not found");
}
```

### Safe Initialization

```typescript
try {
  await iotService.initialize({ mode: "demo" });
  console.log("Service ready");
} catch (error) {
  console.error("Failed to initialize:", error);
  // Fallback behavior
}
```

### Safe Updates

```typescript
const exists = iotService.getDevice("GB01");
if (exists) {
  iotService.updateDevice("GB01", { fillLevel: 50 });
} else {
  console.warn("Cannot update non-existent device");
}
```

---

## Performance Tips

### Avoid Re-renders

```typescript
// ❌ Bad: Re-subscribes on every render
export function Component() {
  const { getLiveBins } = useIoT();
  
  iotService.subscribeToDeviceUpdates((device) => {
    console.log(device);
  });
}

// ✅ Good: Subscribe once on mount
export function Component() {
  useEffect(() => {
    const unsubscribe = iotService.subscribeToDeviceUpdates((device) => {
      console.log(device);
    });
    return unsubscribe;
  }, []);
}
```

### Use Bulk Updates for Batch Processing

```typescript
// ✅ Efficient: Process all at once
iotService.subscribeToBulkUpdates((devices) => {
  const stats = {
    totalDevices: devices.length,
    avgFill: devices.reduce((a, d) => a + d.fillLevel, 0) / devices.length,
    lowBattery: devices.filter(d => d.battery < 30).length
  };
  updateDashboard(stats);
});
```

### Unsubscribe on Unmount

```typescript
useEffect(() => {
  const unsubscribe = iotService.subscribeToDeviceUpdates((device) => {
    // Handle update
  });

  return unsubscribe;  // Important!
}, []);
```

---

## Debugging Console Commands

```javascript
// Check service status
import iotService from "@/react-app/services/iotService";

// View all devices
iotService.getLiveBins()

// View specific device
iotService.getDevice("GB01")

// Check mode and status
console.log(iotService.getMode(), iotService.isRunning())

// Subscribe to see real-time updates
iotService.subscribeToDeviceUpdates(d => console.log(d))

// Manual update
iotService.updateDevice("GB01", { fillLevel: 99 })

// Stop service
iotService.stop()
```

---

## Troubleshooting

**Service not initialized?**
```javascript
if (!iotService.isRunning()) {
  await iotService.initialize();
}
```

**No data returning?**
```javascript
console.log(iotService.getLiveBins().length) // Should be > 0
```

**Subscriptions not firing?**
```javascript
const unsubscribe = iotService.subscribeToBulkUpdates(devices => {
  console.log("Update fired!", devices);
});
```

**Update not working?**
```javascript
// Verify device exists first
const exists = iotService.getDevice("GB01");
if (exists) {
  iotService.updateDevice("GB01", { fillLevel: 50 });
  console.log(iotService.getDevice("GB01")); // Check result
}
```

---

## Version

- **Service Version**: 1.0.0
- **Last Updated**: 2024
- **TypeScript**: 5.8+
- **React**: 19.0+

---

## See Also

- `IOT_SERVICE_README.md` - Full architecture guide
- `IOT_QUICK_START.md` - Getting started
- `src/react-app/components/IoTDeviceMonitor.tsx` - Example component
