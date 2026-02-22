import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Postcode, Complaint } from "@/react-app/types";
import postcodesData from "@/react-app/data/postcodes.json";
import complaintsData from "@/react-app/data/complaints.json";

interface DataContextType {
  postcodes: Postcode[];
  complaints: Complaint[];
  updateDustbinLevel: (postcodePin: string, dustbinId: string, newLevel: number) => void;
  addComplaint: (complaint: Omit<Complaint, "id">) => void;
  updateComplaintStatus: (id: number, status: Complaint["status"]) => void;
  markDustbinEmptied: (postcodePin: string, dustbinId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [postcodes, setPostcodes] = useState<Postcode[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

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

  return (
    <DataContext.Provider
      value={{
        postcodes,
        complaints,
        updateDustbinLevel,
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
