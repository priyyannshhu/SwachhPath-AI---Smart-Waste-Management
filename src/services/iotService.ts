import type { IoTDevicePayload, IoTStreamData } from "@/react-app/types";

export type IoTMode = "off" | "demo" | "live";

export type DeviceUpdateCallback = (payload: IoTDevicePayload) => void;

const DEMO_INTERVAL_MS_MIN = 3000;
const DEMO_INTERVAL_MS_MAX = 5000;
const GPS_DRIFT_DEG = 0.0001;
const FILL_DELTA_MIN = -2;
const FILL_DELTA_MAX = 5;

let mode: IoTMode = "off";
const subscribers = new Set<DeviceUpdateCallback>();
let demoTimerId: ReturnType<typeof setTimeout> | null = null;
let offlineSimTimerId: ReturnType<typeof setTimeout> | null = null;
/** Live state: deviceId -> latest payload (for getLiveBins and for demo current state). */
const liveState = new Map<string, IoTDevicePayload>();
/** Track which devices are temporarily offline (deviceId -> timeout to restore). */
const offlineDevices = new Map<string, ReturnType<typeof setTimeout>>();

/** Load initial demo state from JSON (in Vite this is bundled). */
async function loadDemoStream(): Promise<IoTDevicePayload[]> {
	const data = (await import("@/react-app/data/iot_stream.json")) as IoTStreamData;
	return (data.devices ?? []).map((d) => ({
		deviceId: d.deviceId,
		lat: d.lat,
		lng: d.lng,
		fillLevel: d.fillLevel,
		battery: d.battery,
		status: d.status,
	}));
}

function clampFill(level: number): number {
	return Math.max(0, Math.min(100, Math.round(level)));
}

function clampBattery(level: number): number {
	return Math.max(0, Math.min(100, Math.round(level)));
}

/** Notify all subscribers of an update. */
function notifySubscribers(payload: IoTDevicePayload): void {
	liveState.set(payload.deviceId, { ...payload });
	subscribers.forEach((cb) => cb(payload));
}

/** One demo tick: random fill change + small GPS drift for each device. */
function runDemoTick(devices: IoTDevicePayload[]): void {
	devices.forEach((d) => {
		const fillDelta = Math.floor(
			Math.random() * (FILL_DELTA_MAX - FILL_DELTA_MIN + 1)
		) + FILL_DELTA_MIN;
		const newFill = clampFill(d.fillLevel + fillDelta);
		const latDrift = (Math.random() - 0.5) * 2 * GPS_DRIFT_DEG;
		const lngDrift = (Math.random() - 0.5) * 2 * GPS_DRIFT_DEG;
		const batterySlight = Math.random() > 0.7 ? -1 : 0;
		const newBattery = clampBattery(d.battery + batterySlight);

		const payload: IoTDevicePayload = {
			deviceId: d.deviceId,
			lat: d.lat + latDrift,
			lng: d.lng + lngDrift,
			fillLevel: newFill,
			battery: newBattery,
			status: d.status,
		};
		notifySubscribers(payload);
	});
}

function getNextDemoIntervalMs(): number {
	return (
		DEMO_INTERVAL_MS_MIN +
		Math.random() * (DEMO_INTERVAL_MS_MAX - DEMO_INTERVAL_MS_MIN)
	);
}

function scheduleNextDemoTick(devices: IoTDevicePayload[]): void {
	if (mode !== "demo" || !devices.length) return;
	demoTimerId = setTimeout(() => {
		runDemoTick(devices);
		scheduleNextDemoTick(
			devices.map((d) => liveState.get(d.deviceId) ?? d)
		);
	}, getNextDemoIntervalMs());
}

/** Simulate random device going offline every 2-4 minutes (demo realism). */
function startOfflineSimulation(): void {
	if (offlineSimTimerId) return;
	const scheduleNextOffline = () => {
		if (mode !== "demo") return;
		const devices = Array.from(liveState.values());
		if (devices.length === 0) {
			offlineSimTimerId = setTimeout(scheduleNextOffline, 60000);
			return;
		}
		// Pick a random online device
		const onlineDevices = devices.filter((d) => d.status === "online");
		if (onlineDevices.length === 0) {
			offlineSimTimerId = setTimeout(scheduleNextOffline, 30000);
			return;
		}
		const randomDevice = onlineDevices[Math.floor(Math.random() * onlineDevices.length)];
		// Set offline
		const offlinePayload: IoTDevicePayload = {
			...randomDevice,
			status: "offline",
		};
		notifySubscribers(offlinePayload);
		// Restore online after 60-90 seconds
		const restoreDelay = 60000 + Math.random() * 30000;
		const restoreTimeout = setTimeout(() => {
			offlineDevices.delete(randomDevice.deviceId);
			const restoredPayload: IoTDevicePayload = {
				...randomDevice,
				status: "online",
			};
			notifySubscribers(restoredPayload);
		}, restoreDelay);
		offlineDevices.set(randomDevice.deviceId, restoreTimeout);
		// Schedule next offline event in 2-4 minutes
		const nextInterval = 120000 + Math.random() * 120000;
		offlineSimTimerId = setTimeout(scheduleNextOffline, nextInterval);
	};
	scheduleNextOffline();
}

function stopOfflineSimulation(): void {
	if (offlineSimTimerId) {
		clearTimeout(offlineSimTimerId);
		offlineSimTimerId = null;
	}
	offlineDevices.forEach((timeout) => clearTimeout(timeout));
	offlineDevices.clear();
}

/** Start demo mode: load iot_stream.json and run simulated updates every 3–5s. */
export async function startDemoMode(): Promise<void> {
	if (mode === "demo") return;
	stopDemoMode();
	mode = "demo";
	const devices = await loadDemoStream();
	devices.forEach((d) => liveState.set(d.deviceId, { ...d }));
	devices.forEach((d) => notifySubscribers(d));
	scheduleNextDemoTick(devices);
	startOfflineSimulation();
}

/** Stop demo mode and clear timer. */
export function stopDemoMode(): void {
	if (demoTimerId) {
		clearTimeout(demoTimerId);
		demoTimerId = null;
	}
	stopOfflineSimulation();
	if (mode === "demo") {
		mode = "off";
	}
}

/** Switch to live mode (ready for real ESP32 updates via pushDeviceUpdate). */
export function setLiveMode(): void {
	stopDemoMode();
	mode = "live";
}

/** Current mode. */
export function getMode(): IoTMode {
	return mode;
}

/**
 * Get current live bin state (from demo simulation or from pushed live updates).
 * Returns array of latest payloads per device.
 */
export function getLiveBins(): IoTDevicePayload[] {
	return Array.from(liveState.values());
}

/**
 * Subscribe to device updates (demo or live).
 * Callback is invoked whenever any device reports an update.
 */
export function subscribeToDeviceUpdates(callback: DeviceUpdateCallback): () => void {
	subscribers.add(callback);
	// send current state immediately
	Array.from(liveState.values()).forEach((d) => callback(d));
	// start demo mode automatically if nothing running
	if (mode === "off") {
		// fire-and-forget
		void startDemoMode();
	}
	return () => subscribers.delete(callback);
}

/**
 * Push a device update (for Live mode).
 * Call this when the frontend receives data from:
 * - HTTP POST handler (e.g. serverless/proxy that forwards ESP32 payload to the app),
 * - WebSocket message,
 * - MQTT bridge.
 *
 * Example payload:
 * { deviceId: "GB01", lat: 26.7606, lng: 83.3732, fillLevel: 75, battery: 82, status: "online" }
 */
export function pushDeviceUpdate(payload: IoTDevicePayload): void {
	const normalized: IoTDevicePayload = {
		deviceId: payload.deviceId,
		lat: payload.lat,
		lng: payload.lng,
		fillLevel: clampFill(payload.fillLevel),
		battery: clampBattery(payload.battery ?? 100),
		status: payload.status ?? "online",
	};
	liveState.set(normalized.deviceId, normalized);
	subscribers.forEach((cb) => cb(normalized));
}

/** Dev-only: simulate ESP32 POST from browser console. Usage: window.__swachhpathPushDeviceUpdate({ deviceId: "GB01", lat: 26.76, lng: 83.37, fillLevel: 80, battery: 90, status: "online" }) */
declare global {
	interface Window {
		__swachhpathPushDeviceUpdate?: (payload: IoTDevicePayload) => void;
	}
}
if (typeof window !== "undefined") {
	window.__swachhpathPushDeviceUpdate = pushDeviceUpdate;
}

/**
 * Fetch simulated data (for UI that wants to load once without subscribing).
 * In demo mode this returns current live state; otherwise returns initial devices from JSON.
 */
export async function fetchSimulatedData(): Promise<IoTDevicePayload[]> {
	if (mode === "demo" || liveState.size > 0) {
		return getLiveBins();
	}
	// Start demo mode as default (loads JSON and begins ticks)
	await startDemoMode();
	return getLiveBins();
}


