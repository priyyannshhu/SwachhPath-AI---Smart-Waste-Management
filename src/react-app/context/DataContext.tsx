import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { Postcode, Complaint, Dustbin, IoTDevicePayload } from "@/react-app/types";
import postcodesData from "@/react-app/data/postcodes.json";
import complaintsData from "@/react-app/data/complaints.json";
import {
  startDemoMode,
  stopDemoMode,
  setLiveMode,
  subscribeToDeviceUpdates,
  type IoTMode,
} from "@/services/iotService";

interface DataContextType {
  postcodes: Postcode[];
  complaints: Complaint[];
  iotMode: IoTMode;
  setIotMode: (mode: IoTMode) => void;
  updateDustbinLevel: (postcodePin: string, dustbinId: string, newLevel: number) => void;
  updateDustbinFromIoT: (payload: IoTDevicePayload) => void;
  addDustbin: (dustbin: Dustbin) => void;
  addComplaint: (complaint: Omit<Complaint, "id">) => void;
  updateComplaintStatus: (id: number, status: Complaint["status"]) => void;
  markDustbinEmptied: (postcodePin: string, dustbinId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [postcodes, setPostcodes] = useState<Postcode[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [iotMode, setIotModeState] = useState<IoTMode>("demo");
  const postcodesRef = useRef<Postcode[]>([]);
  postcodesRef.current = postcodes;

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

  const updateDustbinFromIoT = useCallback((payload: IoTDevicePayload) => {
    setPostcodes((prev) =>
      prev.map((postcode) =>
        postcode.dustbins.some((d) => d.id === payload.deviceId)
          ? {
              ...postcode,
              dustbins: postcode.dustbins.map((dustbin) =>
                dustbin.id === payload.deviceId
                  ? {
                      ...dustbin,
                      fillLevel: Math.min(100, Math.max(0, payload.fillLevel)),
                      lat: payload.lat,
                      lng: payload.lng,
                      battery: payload.battery,
                      status: payload.status,
                    }
                  : dustbin
              ),
            }
          : postcode
      )
    );
  }, []);

  const setIotMode = useCallback((mode: IoTMode) => {
    setIotModeState(mode);
  }, []);

  // IoT: subscribe to device updates (demo or live) and merge into postcodes
  useEffect(() => {
    if (iotMode === "off") {
      stopDemoMode();
      return;
    }
    if (iotMode === "demo") {
      startDemoMode();
    } else {
      setLiveMode();
    }
    const unsub = subscribeToDeviceUpdates((payload) => {
      const current = postcodesRef.current;
      const hasDevice = current.some((p) =>
        p.dustbins.some((d) => d.id === payload.deviceId)
      );
      if (hasDevice) updateDustbinFromIoT(payload);
    });
    return () => {
      unsub();
      stopDemoMode();
    };
  }, [iotMode, updateDustbinFromIoT]);

  const addDustbin = useCallback((dustbin: Dustbin) => {
    // Find or create postcode entry for locality
    setPostcodes((prev) => {
      const localityPostcode = prev.find((p) => p.area === dustbin.locality);
      
      if (localityPostcode) {
        // Add to existing locality
        return prev.map((p) =>
          p.area === dustbin.locality
            ? { ...p, dustbins: [...p.dustbins, dustbin] }
            : p
        );
      } else {
        // Create new postcode entry for this locality
        const newPostcode: Postcode = {
          pin: `PIN_${Date.now()}`,
          area: dustbin.locality,
          dustbins: [dustbin],
        };
        return [...prev, newPostcode];
      }
    });
  }, []);

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

  return (
    <DataContext.Provider
      value={{
        postcodes,
        complaints,
        iotMode,
        setIotMode,
        updateDustbinLevel,
        updateDustbinFromIoT,
        addDustbin,
        addComplaint,
        updateComplaintStatus,
        markDustbinEmptied,
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
