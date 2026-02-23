import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "@/react-app/context/AuthContext";
import { DataProvider } from "@/react-app/context/DataContext";
import LoginPage from "@/react-app/pages/Login";
import SignupPage from "@/react-app/pages/Signup";
import DashboardPage from "@/react-app/pages/Dashboard";
import LocalitiesPage from "@/react-app/pages/Localities";
import DustbinsPage from "@/react-app/pages/Dustbins";
import ComplaintsPage from "@/react-app/pages/Complaints";
import MapPage from "@/react-app/pages/Map";
import AddDustbinPage from "@/react-app/pages/AddDustbin";
import FileComplaintPage from "@/react-app/pages/FileComplaint";
import RequestDustbinPage from "@/react-app/pages/RequestDustbin";
import AIChatboxPage from "@/react-app/pages/AIChatbox";

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/localities" element={<LocalitiesPage />} />
            <Route path="/dustbins" element={<DustbinsPage />} />
            <Route path="/dustbins/add" element={<AddDustbinPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/complaints" element={<ComplaintsPage />} />
            <Route path="/complaints/file" element={<FileComplaintPage />} />
            <Route path="/requests/dustbin" element={<RequestDustbinPage />} />
            <Route path="/ai-assistant" element={<AIChatboxPage />} />
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}
