# SwachhPath AI - IoT Service Layer

## Overview

The IoT Service Layer provides an abstraction between the frontend and various data sources (demo simulation or live ESP32 devices). This architecture enables seamless switching between development/demo mode and real hardware integration without changing the UI code.

## Architecture

```
┌─────────────────────────────────────┐
│      React UI Components            │
│   (Dashboard, Dustbins, Cards)      │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│      DataContext + useData Hook      │
│   (State Management & Data Sync)    │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│      IoT Service Layer              │
│   (Abstraction & Mode Switching)    │
└────────────┬────────────────────────┘
             │
        ┌────┴──────────────┬──────────────┬──────────┐
        │                   │              │          │
    ┌───▼───────┐   ┌──────▼────┐  ┌─────▼──┐  ┌────▼─────┐
    │Demo Mode  │   │HTTP POST  │  │WebSocket│  │MQTT Bridge│
    │(Local JSON)   │(Future)   │  │(Future) │  │(Future)   │
    └───────────┘   └───────────┘  └─────────┘  └───────────┘
```

## File Structure

```
src/react-app/
├── services/
│   └── iotService.ts          # Core IoT Service Layer
├── types/
│   ├── index.ts               # Extended Dustbin interface
│   └── iot.ts                 # IoT-specific types & interfaces
├── hooks/
│   └── useIoT.ts              # Custom hook for IoT access
├── context/
│   └── DataContext.tsx        # Enhanced with IoT integration
├── data/
│   └── iot_stream.json        # Demo simulation data
└── pages/
    └── Dashboard.tsx          # Uses synced IoT data
```

## Usage Guide

### 1. Basic Setup (Already Done)

The IoT Service is automatically initialized in `DataContext.tsx`:

```typescript
const DataProvider = ({ children }) => {
  useEffect(() => {
    iotService.initialize({ mode: "demo" });
    return () => iotService.stop();
  }, []);
  
  // ...
};
```

### 2. Accessing IoT Data in Components

#### Via DataContext (Recommended for most components):

```typescript
import { useData } from "@/react-app/context/DataContext";

export function MyComponent() {
  const { postcodes, iotDevices } = useData();
  
  // iotDevices contains live IoT data
  return (
    <div>
      {iotDevices.map((device) => (
        <div key={device.deviceId}>
          <p>Device: {device.deviceId}</p>
          <p>Fill: {device.fillLevel}%</p>
          <p>Battery: {device.battery}%</p>
          <p>Status: {device.status}</p>
        </div>
      ))}
    </div>
  );
}
```

#### Via useIoT Hook (Direct service access):

```typescript
import { useIoT } from "@/react-app/hooks/useIoT";

export function AdvancedComponent() {
  const { getLiveBins, subscribeToUpdates, getDevice } = useIoT();
  
  // Get all devices
  const allDevices = getLiveBins();
  
  // Subscribe to specific device updates
  useEffect(() => {
    const unsubscribe = subscribeToUpdates((device) => {
      console.log(`Device ${device.deviceId} updated:`, device);
    });
    
    return unsubscribe;
  }, [subscribeToUpdates]);
  
  // Get specific device
  const device = getDevice("GB01");
  
  return <div>{/* ... */}</div>;
}
```

### 3. IoT Device Data Structure

```typescript
interface IoTDeviceData {
  deviceId: string;      // Unique device identifier (e.g., "GB01")
  lat: number;          // Latitude for mapping
  lng: number;          // Longitude for mapping
  fillLevel: number;    // 0-100 (percentage)
  battery: number;      // 0-100 (percentage)
  status: "online" | "offline" | "error";
  timestamp?: number;   // When data was received
}
```

## Demo Mode Features

The demo mode simulates realistic IoT behavior:

### Fill Level Changes
- Random updates between -5% and +8% per cycle
- Realistic waste accumulation patterns
- Range: 0-100%

### GPS Drift
- Small positional variations (±0.0005 degrees)
- Simulates sensor noise and triangulation variance
- Precision: 6 decimal places

### Battery Drain
- Linear drain of 0.1-0.5% per update cycle
- Represents typical lithium battery consumption
- Triggers "low battery" alerts near 20%

### Offline Events
- 5% chance per update to go offline
- Simulates network connectivity issues
- Critical for testing error handling

### Update Frequency
- Default: 3-5 seconds between updates
- Configurable via `updateInterval`

## Integration Points for Future ESP32

### HTTP POST Integration

```typescript
// Future implementation in iotService.ts
private handleHttpPost(payload: IoTDeviceData) {
  this.updateDevice(payload.deviceId, payload);
}
```

Expected endpoint: `POST /api/iot/device-update`

```json
{
  "deviceId": "GB01",
  "lat": 26.7606,
  "lng": 83.3732,
  "fillLevel": 75,
  "battery": 82,
  "status": "online"
}
```

### WebSocket Integration

```typescript
// Future implementation
private setupWebSocket() {
  const ws = new WebSocket("ws://your-server/iot-stream");
  
  ws.onmessage = (event) => {
    const devices: IoTDeviceData[] = JSON.parse(event.data);
    this.bulkUpdateDevices(
      devices.map(d => ({ deviceId: d.deviceId, data: d }))
    );
  };
}
```

### MQTT Bridge

```typescript
// Future implementation
private setupMQTT() {
  const client = mqtt.connect("mqtt://your-broker");
  
  client.subscribe("swachpath/devices/+/telemetry");
  
  client.on("message", (topic, payload) => {
    const data = JSON.parse(payload.toString());
    this.updateDevice(data.deviceId, data);
  });
}
```

## Configuration

### Initialize with Custom Settings

```typescript
import iotService from "@/react-app/services/iotService";

// Demo mode with custom update interval
await iotService.initialize({
  mode: "demo",
  updateInterval: 5000  // 5 seconds
});

// Switch to live mode (when backend is ready)
// await iotService.initialize({
//   mode: "live",
//   updateInterval: 2000
// });
```

### Modify Data Sync Frequency

The default DataContext syncs data when IoT service broadcasts updates. For custom sync logic:

```typescript
const { syncIoTData } = useData();

// Manually trigger sync
syncIoTData();
```

## API Reference

### iotService

```typescript
// Initialize service
await iotService.initialize(config?: IoTServiceConfig)

// Get all live devices
getLiveBins(): IoTDeviceData[]

// Get specific device
getDevice(deviceId: string): IoTDeviceData | undefined

// Subscribe to individual updates
subscribeToDeviceUpdates(callback): () => void

// Subscribe to bulk updates
subscribeToBulkUpdates(callback): () => void

// Update device (manual or from external source)
updateDevice(deviceId: string, data: Partial<IoTDeviceData>): void

// Bulk update
bulkUpdateDevices(updates[]): void

// Stop all updates
stop(): void

// Get current mode
getMode(): DataMode

// Check if running
isRunning(): boolean
```

## Testing Demo Mode

### Check Console Logs
```
[IoT] Loaded 5 demo devices
[DataContext] IoT Service initialized
```

### Monitor Updates
Open browser DevTools → Network tab, then watch timestamps update in Console.

### Simulate Offline Event
```typescript
import iotService from "@/react-app/services/iotService";

const device = iotService.getDevice("GB01");
iotService.updateDevice("GB01", { status: "offline" });
```

### Check Current State
```typescript
import iotService from "@/react-app/services/iotService";

console.log(iotService.getLiveBins());
console.log(iotService.getMode()); // "demo" or "live"
console.log(iotService.isRunning()); // true/false
```

## Performance Considerations

- **Update Frequency**: Default 3-5 seconds balances responsiveness with performance
- **Memory**: Stores only latest device state (no history)
- **Callbacks**: Minimal overhead; uses Set for efficient subscription management
- **Sync**: DataContext syncs only on bulk updates to reduce re-renders

## Future Roadmap

1. **Real ESP32 Integration**
   - HTTP POST endpoint receiver
   - WebSocket listener setup
   - MQTT subscriber configuration

2. **Data Persistence**
   - Historical data logging
   - Trend analysis
   - Predictive maintenance alerts

3. **Advanced Features**
   - Device grouping/zones
   - Maintenance schedules
   - Hardware diagnostics

4. **Optimization**
   - Differential updates (send only changed fields)
   - Compression for large datasets
   - IndexedDB for offline capability

## Troubleshooting

### No Data Updates
```typescript
// Check if service is running
console.log(iotService.isRunning()); // Should be true

// Verify callbacks are registered
const unsubscribe = iotService.subscribeToBulkUpdates((devices) => {
  console.log("Update received:", devices);
});
```

### Demo Data Not Loading
- Check `/public/data/iot_stream.json` exists
- Verify file path in fetch call
- Check browser console for errors
- Fallback to default devices will be used

### State Not Syncing to UI
- Ensure component is wrapped with `DataProvider`
- Verify `useData()` hook is used correctly
- Check if component is listening to `iotDevices` or `postcodes`

## Security Notes

- Frontend receives read-only device telemetry
- Real implementations should validate JWT tokens
- Implement rate limiting on backend HTTP/WebSocket endpoints
- MQTT should use TLS with client certificates
- Never expose device credentials in frontend code
