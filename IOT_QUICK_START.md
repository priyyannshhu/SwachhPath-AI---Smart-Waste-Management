# SwachhPath AI - IoT Quick Start Guide

## 🎯 Current Status: ✅ READY TO USE

The app is running with **live simulated IoT data**. No backend needed.

## 📦 What You Have

- ✅ 5 simulated ESP32 devices (GB01-GB05)
- ✅ Real-time data updates every 3-5 seconds
- ✅ Dashboard shows live fill levels, battery, status
- ✅ Data syncs automatically to UI

## 🚀 Quick Start (3 steps)

### 1. Run the App
```bash
npm run dev
```

### 2. Open Dashboard
Visit `http://localhost:5173` → Dashboard shows live data

### 3. Watch Real-Time Updates
- Fill levels changing
- Battery draining
- GPS coordinates drifting
- Occasional offline events

## 📊 Data Structure

Each IoT device has:
```
{
  deviceId: "GB01",          // Device ID
  fillLevel: 45,             // 0-100%
  battery: 85,               // 0-100%
  status: "online",          // online/offline/error
  lat: 26.7606,              // Latitude
  lng: 83.3732               // Longitude
}
```

## 🔍 Check Live Data

### In Browser Console

```javascript
// See all devices
import iotService from "@/react-app/services/iotService";
console.log(iotService.getLiveBins());

// Watch updates in real-time
iotService.subscribeToBulkUpdates((devices) => {
  console.log("Updated:", devices);
});
```

### In React Component

```tsx
import { useData } from "@/react-app/context/DataContext";

export function MyComponent() {
  const { iotDevices } = useData();
  
  return (
    <div>
      {iotDevices.map(device => (
        <div key={device.deviceId}>
          {device.deviceId}: {device.fillLevel}%
        </div>
      ))}
    </div>
  );
}
```

## 🧪 Test Scenarios

### Simulate Device Offline
```javascript
import iotService from "@/react-app/services/iotService";
iotService.updateDevice("GB01", { status: "offline" });
```

### Set Low Battery Alert
```javascript
iotService.updateDevice("GB02", { battery: 15 });
```

### Max Out Fill Level
```javascript
iotService.updateDevice("GB03", { fillLevel: 99 });
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/react-app/services/iotService.ts` | Core IoT engine |
| `src/react-app/data/iot_stream.json` | Demo device data |
| `src/react-app/context/DataContext.tsx` | Data integration |
| `src/react-app/hooks/useIoT.ts` | Component hook |
| `src/react-app/components/IoTDeviceMonitor.tsx` | Example component |

## 🔌 When You Have Real ESP32 Devices

Change 1 line in `src/react-app/context/DataContext.tsx`:

```typescript
// From:
await iotService.initialize({ mode: "demo" });

// To:
await iotService.initialize({ mode: "live" });
```

Then add your data source (HTTP/WebSocket/MQTT) to `iotService.ts`.

## 📚 More Info

- **Full Architecture**: See `IOT_SERVICE_README.md`
- **Implementation Details**: See `IOT_IMPLEMENTATION_GUIDE.md`
- **Component Examples**: See `src/react-app/components/IoTDeviceMonitor.tsx`

## ❓ Common Questions

**Q: How do I add a new device?**
```javascript
iotService.updateDevice("GB06", {
  deviceId: "GB06",
  fillLevel: 50,
  battery: 80,
  status: "online",
  lat: 26.76,
  lng: 83.37
});
```

**Q: How often do devices update?**
- Demo: Every 3-5 seconds
- Can be changed in `iotService.initialize({ updateInterval: 2000 })`

**Q: Do I need a backend?**
- For demo mode: No
- For real devices: Yes, implement HTTP/WebSocket/MQTT endpoint

**Q: How do I show device data in a component?**
```tsx
import { useData } from "@/react-app/context/DataContext";
const { iotDevices } = useData();
```

**Q: How do I stop the simulation?**
```javascript
import iotService from "@/react-app/services/iotService";
iotService.stop();
```

## 🎓 Demo Files to Review

1. **IoTDeviceMonitor.tsx** - Shows how to display device data
2. **iotService.ts** - Shows how service works internally
3. **DataContext.tsx** - Shows how to integrate with React state

## ✅ Verification Checklist

- [ ] App runs: `npm run dev`
- [ ] Dashboard loads with data
- [ ] Fill levels change every few seconds
- [ ] Battery decreases over time
- [ ] Can see 5 devices in browser console
- [ ] No console errors

## 🆘 Troubleshooting

**No data showing?**
- Check browser console for `[IoT]` logs
- Verify `/public/data/iot_stream.json` exists
- Try: `iotService.getLiveBins().length`

**Data not updating?**
- Check `iotService.isRunning()` is true
- Verify subscriptions with `subscribeToBulkUpdates()`
- Check update interval isn't too high

**Want real data instead of demo?**
- Check `IOT_IMPLEMENTATION_GUIDE.md` for integration steps

---

**Ready to build?** Start with `IoTDeviceMonitor.tsx` as a reference! 🚀
