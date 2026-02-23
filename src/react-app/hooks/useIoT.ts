import { useCallback } from "react";
import { IoTDeviceData } from "@/react-app/types/iot";
import iotService from "@/react-app/services/iotService";

/**
 * Hook for direct IoT service access in components
 * Provides methods to interact with IoT devices
 */
export function useIoT() {
  const getLiveBins = useCallback((): IoTDeviceData[] => {
    return iotService.getLiveBins();
  }, []);

  const getDevice = useCallback((deviceId: string): IoTDeviceData | undefined => {
    return iotService.getDevice(deviceId);
  }, []);

  const subscribeToUpdates = useCallback((callback: (device: IoTDeviceData) => void) => {
    return iotService.subscribeToDeviceUpdates(callback);
  }, []);

  const updateDevice = useCallback((deviceId: string, data: Partial<IoTDeviceData>) => {
    iotService.updateDevice(deviceId, data);
  }, []);

  const getMode = useCallback(() => {
    return iotService.getMode();
  }, []);

  const isRunning = useCallback(() => {
    return iotService.isRunning();
  }, []);

  return {
    getLiveBins,
    getDevice,
    subscribeToUpdates,
    updateDevice,
    getMode,
    isRunning,
  };
}
