# SwachhPath AI - Developer Checklist

## ✅ Pre-Launch Verification

Run through this checklist to ensure everything is working correctly.

---

## 🏃 Getting Started (5 minutes)

- [ ] Clone/pull latest code
- [ ] Install dependencies: `npm install`
- [ ] Start dev server: `npm run dev`
- [ ] Open http://localhost:5173
- [ ] Dashboard loads without errors

---

## 📊 Dashboard Verification (5 minutes)

- [ ] Dashboard page loads
- [ ] See "Live Monitoring" indicator
- [ ] See stat cards (Total Dustbins, Full Bins, Active Areas, Alerts)
- [ ] See charts (Area-wise Fill Levels, Daily Fill Trend)
- [ ] Data values are non-zero and realistic

---

## 🔄 Real-Time Updates (5 minutes)

- [ ] Open browser DevTools → Console
- [ ] Refresh page
- [ ] Watch fill levels change every 3-5 seconds
- [ ] Watch battery levels gradually decrease
- [ ] See `[IoT]` log messages in console
- [ ] See `[DataContext]` initialization message

---

## 🧪 IoT Service Verification (5 minutes)

Run these in browser console:

```javascript
import iotService from "@/react-app/services/iotService";

// Check 1: Service initialized
console.log(iotService.isRunning());              // Should be: true
console.log(iotService.getMode());                // Should be: "demo"

// Check 2: Devices loaded
const devices = iotService.getLiveBins();
console.log(devices.length);                      // Should be: 5
console.log(devices[0]);                          // Should see GB01 device

// Check 3: Device details
const device = iotService.getDevice("GB01");
console.log(device);                              // Should show device object

// Check 4: Subscriptions working
let updateCount = 0;
const unsub = iotService.subscribeBulkUpdates((devices) => {
  updateCount++;
});
setTimeout(() => {
  console.log(`Received ${updateCount} updates in 10 seconds`);
  unsub();
}, 10000);
```

- [ ] `isRunning()` returns `true`
- [ ] `getMode()` returns `"demo"`
- [ ] `getLiveBins()` returns array of 5 devices
- [ ] Devices have `deviceId`, `fillLevel`, `battery`, `status`, `lat`, `lng`
- [ ] `getDevice("GB01")` returns device object
- [ ] Subscriptions receive updates

---

## 📁 File Structure Verification (5 minutes)

- [ ] File exists: `src/react-app/services/iotService.ts`
- [ ] File exists: `src/react-app/types/iot.ts`
- [ ] File exists: `src/react-app/hooks/useIoT.ts`
- [ ] File exists: `src/react-app/data/iot_stream.json`
- [ ] File exists: `src/react-app/components/IoTDeviceMonitor.tsx`
- [ ] File updated: `src/react-app/context/DataContext.tsx` (includes IoT)
- [ ] File updated: `src/react-app/types/index.ts` (includes IoT fields)

---

## 🧩 Component Usage (10 minutes)

### Test 1: DataContext Hook
```typescript
// In any component:
import { useData } from "@/react-app/context/DataContext";

export function TestComponent() {
  const { iotDevices } = useData();
  
  return (
    <div>
      {iotDevices.map(d => (
        <div key={d.deviceId}>{d.deviceId}: {d.fillLevel}%</div>
      ))}
    </div>
  );
}
```

- [ ] Import works without errors
- [ ] `useData()` returns object with `iotDevices`
- [ ] `iotDevices` is array of device objects
- [ ] Data updates in real-time

### Test 2: useIoT Hook
```typescript
import { useIoT } from "@/react-app/hooks/useIoT";

export function TestComponent() {
  const { getLiveBins, getDevice } = useIoT();
  
  return <div>{getLiveBins().length} devices</div>;
}
```

- [ ] Import works without errors
- [ ] Methods are callable and return correct types
- [ ] Can retrieve devices successfully

### Test 3: Example Component
- [ ] `src/react-app/components/IoTDeviceMonitor.tsx` has no syntax errors
- [ ] Component renders without crashing
- [ ] Shows grid of 5 devices
- [ ] Displays fill levels with progress bars
- [ ] Shows battery levels with progress bars
- [ ] Updates in real-time

---

## 🎮 Manual Testing (10 minutes)

Run each test in browser console:

### Test 1: Simulate Device Offline
```javascript
import iotService from "@/react-app/services/iotService";
iotService.updateDevice("GB01", { status: "offline" });
```
- [ ] Device becomes offline in UI
- [ ] Status shows in dashboard
- [ ] Example component shows offline indicator

### Test 2: Simulate Low Battery
```javascript
iotService.updateDevice("GB02", { battery: 15 });
```
- [ ] Battery shows 15% in console
- [ ] UI might show warning
- [ ] Example component shows battery alert

### Test 3: Simulate High Fill
```javascript
iotService.updateDevice("GB03", { fillLevel: 95 });
```
- [ ] Fill level jumps to 95%
- [ ] Dashboard might highlight
- [ ] Example component shows red progress bar

### Test 4: Bulk Update
```javascript
iotService.bulkUpdateDevices([
  { deviceId: "GB01", data: { fillLevel: 50 } },
  { deviceId: "GB02", data: { battery: 75 } }
]);
```
- [ ] Multiple devices update at once
- [ ] UI reflects all changes
- [ ] No console errors

### Test 5: Reset to Demo Values
```javascript
// Refresh page to reset
location.reload();
```
- [ ] Page reloads successfully
- [ ] Demo data resets to defaults
- [ ] Updates resume

---

## 📚 Documentation Verification (10 minutes)

- [ ] File exists: `README_IOT_SETUP.md`
- [ ] File exists: `IOT_QUICK_START.md`
- [ ] File exists: `IOT_SERVICE_README.md`
- [ ] File exists: `IOT_IMPLEMENTATION_GUIDE.md`
- [ ] File exists: `IOT_INTEGRATION_SUMMARY.md`
- [ ] File exists: `IOT_API_REFERENCE.md`
- [ ] File exists: `DEVELOPER_CHECKLIST.md` (this file)
- [ ] All files are readable and formatted correctly
- [ ] All files contain relevant examples

---

## 🚀 Performance Testing (10 minutes)

### Memory Test
```javascript
// Before
console.memory();

// Wait 1 minute
setTimeout(() => {
  console.memory();
}, 60000);
```
- [ ] Memory usage is stable
- [ ] No memory leaks after 1 minute
- [ ] Memory < 100MB

### CPU Test
- [ ] Open DevTools → Performance
- [ ] Record for 30 seconds
- [ ] CPU usage < 5% during idle
- [ ] No long tasks blocking main thread

### Network Test
- [ ] Open DevTools → Network
- [ ] Zero external API calls in demo mode
- [ ] Only local data loading

---

## 🔐 Security Checklist (5 minutes)

- [ ] No hardcoded API keys in code
- [ ] No sensitive data in console logs
- [ ] Demo data doesn't contain PII
- [ ] Subscriptions properly unsubscribe
- [ ] No XSS vulnerabilities
- [ ] No console errors about security

---

## 🐛 Error Handling (5 minutes)

- [ ] Open DevTools → Console
- [ ] Refresh page
- [ ] No red error messages
- [ ] No warnings about missing props
- [ ] No React warnings
- [ ] All `[IoT]` logs are info, not errors

---

## 📊 Data Validation (5 minutes)

```javascript
import iotService from "@/react-app/services/iotService";

const devices = iotService.getLiveBins();
devices.forEach(device => {
  // Validate structure
  console.assert(device.deviceId, "Missing deviceId");
  console.assert(typeof device.fillLevel === 'number', "Invalid fillLevel");
  console.assert(typeof device.battery === 'number', "Invalid battery");
  console.assert(typeof device.lat === 'number', "Invalid lat");
  console.assert(typeof device.lng === 'number', "Invalid lng");
  console.assert(["online", "offline", "error"].includes(device.status), "Invalid status");
  
  // Validate ranges
  console.assert(device.fillLevel >= 0 && device.fillLevel <= 100, "fillLevel out of range");
  console.assert(device.battery >= 0 && device.battery <= 100, "battery out of range");
  console.assert(device.lat >= -90 && device.lat <= 90, "lat out of range");
  console.assert(device.lng >= -180 && device.lng <= 180, "lng out of range");
});

console.log("All data validation checks passed!");
```

- [ ] All assertions pass
- [ ] No console errors during validation

---

## 🔌 Future Integration Prep (5 minutes)

- [ ] `iotService.initialize()` can accept `mode: "live"`
- [ ] `iotService.updateDevice()` works for manual updates
- [ ] `bulkUpdateDevices()` method exists
- [ ] Callback system is in place
- [ ] Clear entry points for backend integration

---

## 🎯 Demo Readiness (5 minutes)

- [ ] App looks professional
- [ ] No visible bugs or glitches
- [ ] Data updates smoothly
- [ ] Responsive layout works
- [ ] No flashing or flickering
- [ ] Charts render correctly
- [ ] All text is readable
- [ ] Color scheme looks good

---

## 📋 Code Quality (10 minutes)

- [ ] Run TypeScript check: `npm run check`
  - [ ] No type errors
  - [ ] No TypeScript warnings

- [ ] Run linter: `npm run lint`
  - [ ] No ESLint errors
  - [ ] No ESLint warnings

- [ ] Code formatting
  - [ ] Consistent indentation
  - [ ] No trailing whitespace
  - [ ] Proper file endings

---

## 📦 Build Verification (5 minutes)

- [ ] Run build: `npm run build`
  - [ ] Build completes successfully
  - [ ] No build errors
  - [ ] No build warnings
  - [ ] Output is in `dist/` directory

- [ ] Check bundle size
  - [ ] JavaScript bundle is reasonable
  - [ ] No huge files
  - [ ] Gzipped size acceptable

---

## 🧪 Browser Compatibility (10 minutes)

Test in each browser:

- [ ] Chrome/Chromium
  - [ ] All features work
  - [ ] No console errors
  - [ ] Performance good

- [ ] Firefox
  - [ ] All features work
  - [ ] No console errors
  - [ ] Performance good

- [ ] Safari
  - [ ] All features work
  - [ ] No console errors
  - [ ] Performance good

- [ ] Edge
  - [ ] All features work
  - [ ] No console errors
  - [ ] Performance good

---

## 📱 Responsive Design (5 minutes)

- [ ] Desktop view (1920x1080)
  - [ ] Layout looks good
  - [ ] All elements visible
  - [ ] Charts render properly

- [ ] Tablet view (768x1024)
  - [ ] Layout adapts
  - [ ] No overflow
  - [ ] Text readable

- [ ] Mobile view (375x812)
  - [ ] Mobile layout works
  - [ ] Touch-friendly
  - [ ] Readable at small size

---

## ✨ Polish (5 minutes)

- [ ] No typos in UI
- [ ] No placeholder text
- [ ] Proper capitalization
- [ ] Consistent language
- [ ] Professional appearance
- [ ] Accessible colors
- [ ] Good contrast ratios

---

## 📝 Final Review (10 minutes)

Before marking as complete:

- [ ] All above checks passed
- [ ] No known bugs
- [ ] No console errors
- [ ] Performance is good
- [ ] Code is clean
- [ ] Documentation is complete
- [ ] Ready for demo/production

---

## 🚀 Sign-Off

**Verification Date**: _______________

**Verified By**: _______________

**Status**: 
- [ ] ✅ READY FOR DEMO
- [ ] ✅ READY FOR PRODUCTION
- [ ] ⚠️ ISSUES FOUND (List below)

**Issues Found** (if any):
1. _______________
2. _______________
3. _______________

**Notes**:
_______________________________________________
_______________________________________________

---

## 📞 Quick Reference

| Check | Command | Expected |
|-------|---------|----------|
| Service running | `iotService.isRunning()` | `true` |
| Mode | `iotService.getMode()` | `"demo"` |
| Device count | `iotService.getLiveBins().length` | `5` |
| Type check | `npm run check` | No errors |
| Lint | `npm run lint` | No errors |
| Build | `npm run build` | Success |

---

## 🎓 If Checks Fail

1. **Console errors?**
   - Check browser console
   - Look for `[IoT]` messages
   - Review error message

2. **Service not running?**
   - Refresh page
   - Check if `await iotService.initialize()` was called
   - Look for initialization errors in console

3. **No data showing?**
   - Verify `iot_stream.json` exists
   - Check network tab for data loading
   - Try manual update test

4. **Build fails?**
   - Run `npm install` again
   - Clear node_modules and reinstall
   - Check for syntax errors

5. **Tests fail?**
   - Review test output
   - Check relevant documentation
   - Compare against example code

---

**All checks passed?** You're ready to go! 🎉

**Having issues?** Check the documentation files, especially `IOT_QUICK_START.md` and `IOT_API_REFERENCE.md`.
