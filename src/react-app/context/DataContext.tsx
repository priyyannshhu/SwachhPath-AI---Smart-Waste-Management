import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Postcode, Complaint } from "@/react-app/types";
import { IoTDeviceData } from "@/react-app/types/iot";
import postcodesData from "@/react-app/data/postcodes.json";
import complaintsData from "@/react-app/data/complaints.json";
import iotService from "@/react-app/services/iotService";

interface DataContextType {
  postcodes: Postcode[];
  complaints: Complaint[];
  iotDevices: IoTDeviceData[];
  updateDustbinLevel: (postcodePin: string, dustbinId: string, newLevel: number) => void;
  addComplaint: (complaint: Omit<Complaint, "id">) => void;
  updateComplaintStatus: (id: number, status: Complaint["status"]) => void;
  markDustbinEmptied: (postcodePin: string, dustbinId: string) => void;
  syncIoTData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [postcodes, setPostcodes] = useState<Postcode[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [iotDevices, setIotDevices] = useState<IoTDeviceData[]>([]);

  // Initialize IoT Service and set up subscriptions
  useEffect(() => {
    const initializeIoT = async () => {
      try {
        await iotService.initialize({ mode: "demo" });
        console.log("[DataContext] IoT Service initialized");

        // Subscribe to bulk device updates
        const unsubscribe = iotService.subscribeToBulkUpdates((devices) => {
          setIotDevices(devices);

          // Automatically sync IoT data to dustbins
          syncIoTData();
        });

        return unsubscribe;
      } catch (error) {
        console.error("[DataContext] Failed to initialize IoT Service:", error);
      }
    };

    initializeIoT();

    // Cleanup on unmount
    return () => {
      iotService.stop();
    };
  }, []);

  useEffect(() => {
    // Load postcodes
    const storedPostcodes = localStorage.getItem("swachhpath_postcodes");
    if (storedPostcodes) {
      setPostcodes(JSON.parse(storedPostcodes));
    } else {
      setPostcodes(postcodesData.postcodes as Postcode[]);
    }

    // Load complaints
    const storedComplaints = localStorage.getItem("swachhpath_complaints");
    if (storedComplaints) {
      setComplaints(JSON.parse(storedComplaints));
    } else {
      setComplaints(complaintsData.complaints as Complaint[]);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (postcodes.length > 0) {
      localStorage.setItem("swachhpath_postcodes", JSON.stringify(postcodes));
    }
  }, [postcodes]);

  useEffect(() => {
    if (complaints.length > 0) {
      localStorage.setItem("swachhpath_complaints", JSON.stringify(complaints));
    }
  }, [complaints]);

  const updateDustbinLevel = useCallback((postcodePin: string, dustbinId: string, newLevel: number) => {
    setPostcodes((prev) =>
      prev.map((postcode) =>
        postcode.pin === postcodePin
          ? {
              ...postcode,
              dustbins: postcode.dustbins.map((dustbin) =>
                dustbin.id === dustbinId
                  ? { ...dustbin, fillLevel: Math.min(100, Math.max(0, newLevel)) }
                  : dustbin
              ),
            }
          : postcode
      )
    );
  }, []);

  const markDustbinEmptied = useCallback((postcodePin: string, dustbinId: string) => {
    updateDustbinLevel(postcodePin, dustbinId, 0);
  }, [updateDustbinLevel]);

  const addComplaint = useCallback((complaint: Omit<Complaint, "id">) => {
    const newComplaint: Complaint = {
      ...complaint,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    setComplaints((prev) => [...prev, newComplaint]);
  }, []);

  const updateComplaintStatus = useCallback((id: number, status: Complaint["status"]) => {
    setComplaints((prev) =>
      prev.map((complaint) =>
        complaint.id === id ? { ...complaint, status } : complaint
      )
    );
  }, []);

  // Sync IoT data to dustbins in postcodes
  const syncIoTData = useCallback(() => {
    setPostcodes((prev) =>
      prev.map((postcode) => ({
        ...postcode,
        dustbins: postcode.dustbins.map((dustbin) => {
          // Find matching IoT device by ID
          const iotDevice = iotDevices.find((d) => d.deviceId === dustbin.id);
          if (iotDevice) {
            return {
              ...dustbin,
              fillLevel: iotDevice.fillLevel,
              lat: iotDevice.lat,
              lng: iotDevice.lng,
              battery: iotDevice.battery,
              status: iotDevice.status,
            };
          }
          return dustbin;
        }),
      }))
    );
  }, [iotDevices]);

  return (
    <DataContext.Provider
      value={{
        postcodes,
        complaints,
        iotDevices,
        updateDustbinLevel,
        addComplaint,
        updateComplaintStatus,
        markDustbinEmptied,
        syncIoTData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
