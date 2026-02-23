export interface Dustbin {
  id: string;
  location: string;
  locality: string;
  fillLevel: number;
  /** From IoT: latitude (e.g. ESP32 GPS) */
  lat?: number;
  /** From IoT: longitude */
  lng?: number;
  /** From IoT: battery % (0–100) */
  battery?: number;
  /** From IoT: device status */
  status?: "online" | "offline" | "maintenance";
  /** User ID who added this dustbin */
  addedByUserId?: string;
  /** Whether ESP32 device is enabled */
  esp32Enabled?: boolean;
  /** ESP32 device ID */
  deviceId?: string | null;
  /** WiFi SSID (not permanently stored password) */
  wifiSSID?: string | null;
  /** Timestamp when added */
  createdAt?: string;
}

/** ESP32 / device payload — no backend; frontend accepts via bridge (HTTP POST / WebSocket / MQTT). */
export interface IoTDevicePayload {
  deviceId: string;
  lat: number;
  lng: number;
  fillLevel: number;
  battery: number;
  status: "online" | "offline" | "maintenance";
}

/** Single device snapshot in IoT stream JSON. */
export interface IoTStreamDevice {
  deviceId: string;
  lat: number;
  lng: number;
  fillLevel: number;
  battery: number;
  status: "online" | "offline" | "maintenance";
}

export interface IoTStreamData {
  devices: IoTStreamDevice[];
  updatedAt?: string;
}

export interface Postcode {
  pin: string;
  area: string;
  dustbins: Dustbin[];
}

export interface PostcodesData {
  postcodes: Postcode[];
}

export interface User {
  id: string | number;
  name: string;
  email: string;
  password: string;
  role: "citizen" | "admin" | "user";
  locality?: string;
  phone?: string;
  pin?: string; // backward compatibility
  createdAt?: string;
}

export interface UsersData {
  users: User[];
}

export interface Complaint {
  id: number;
  // New fields for user-generated complaints
  title?: string;
  description?: string;
  createdBy?: string;
  createdByName?: string;
  location?: string;
  locality?: string;
  lat?: number;
  lng?: number;
  dustbinId?: string | null;
  priority?: "low" | "medium" | "high" | "critical";
  createdAt?: string;
  updatedAt?: string;
  // Old fields for backward compatibility
  user?: string;
  pin?: string;
  area?: string;
  issue?: string;
  status: "pending" | "in_progress" | "resolved" | "Pending" | "In Progress" | "Resolved";
}

export interface ComplaintsData {
  complaints: Complaint[];
}

export interface DustbinRequest {
  id: string;
  requestedBy: string;
  location: string;
  locality: string;
  lat?: number;
  lng?: number;
  reason: string;
  status: "pending" | "approved" | "in_progress" | "rejected" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  createdAt?: string;
  updatedAt?: string;
}

export interface RequestsData {
  requests: DustbinRequest[];
}


export type FillStatus = "low" | "medium" | "high";

export function getFillStatus(fillLevel: number): FillStatus {
  if (fillLevel <= 40) return "low";
  if (fillLevel <= 80) return "medium";
  return "high";
}

export function getStatusColor(status: FillStatus): string {
  switch (status) {
    case "low":
      return "text-green-400";
    case "medium":
      return "text-yellow-400";
    case "high":
      return "text-red-400";
  }
}

export function getStatusBgColor(status: FillStatus): string {
  switch (status) {
    case "low":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "medium":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "high":
      return "bg-red-500/20 text-red-400 border-red-500/30";
  }
}

export function getProgressColor(status: FillStatus): string {
  switch (status) {
    case "low":
      return "bg-green-500";
    case "medium":
      return "bg-yellow-500";
    case "high":
      return "bg-red-500";
  }
}
