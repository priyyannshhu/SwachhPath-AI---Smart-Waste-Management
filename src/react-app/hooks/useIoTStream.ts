import { useState, useEffect } from "react";
import type { IoTDevicePayload } from "@/react-app/types";
import {
  subscribeToDeviceUpdates,
  fetchSimulatedData,
  type IoTMode,
  getMode,
} from "@/services/iotService";

interface UseIoTStreamReturn {
  /** Current live bin data from stream */
  liveBins: IoTDevicePayload[];
  /** Whether stream is active (demo or live mode) */
  isStreaming: boolean;
  /** Current IoT mode */
  mode: IoTMode;
  /** Latest update timestamp */
  lastUpdate: Date | null;
  /** Error state */
  error: Error | null;
}

/**
 * useIoTStream() — Smart ESP32 Simulation Layer Hook
 *
 * Responsibilities:
 * - Load dummy JSON (via fetchSimulatedData)
 * - Update live state automatically
 * - Emit updates like real streaming (via subscribeToDeviceUpdates)
 *
 * Usage:
 * ```tsx
 * const { liveBins, isStreaming, lastUpdate } = useIoTStream();
 * ```
 */
export function useIoTStream(): UseIoTStreamReturn {
  const [liveBins, setLiveBins] = useState<IoTDevicePayload[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState<IoTMode>("off");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Load initial data
  useEffect(() => {
    fetchSimulatedData()
      .then((devices) => {
        setLiveBins(devices);
        setLastUpdate(new Date());
        setMode(getMode());
        setIsStreaming(getMode() !== "off");
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
      });
  }, []);

  // Subscribe to live updates
  useEffect(() => {
    const unsubscribe = subscribeToDeviceUpdates((payload) => {
      setLiveBins((prev) => {
        const updated = prev.filter((b) => b.deviceId !== payload.deviceId);
        return [...updated, payload];
      });
      setLastUpdate(new Date());
      setMode(getMode());
      setIsStreaming(getMode() !== "off");
    });

    // Poll for mode changes (in case mode changes externally)
    const modeCheckInterval = setInterval(() => {
      const currentMode = getMode();
      setMode(currentMode);
      setIsStreaming(currentMode !== "off");
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(modeCheckInterval);
    };
  }, []);

  return {
    liveBins,
    isStreaming,
    mode,
    lastUpdate,
    error,
  };
}
