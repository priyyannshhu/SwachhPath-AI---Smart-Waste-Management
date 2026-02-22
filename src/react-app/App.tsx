import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "@/react-app/context/AuthContext";
import { DataProvider } from "@/react-app/context/DataContext";
import LoginPage from "@/react-app/pages/Login";
import DashboardPage from "@/react-app/pages/Dashboard";
import LocalitiesPage from "@/react-app/pages/Localities";
import DustbinsPage from "@/react-app/pages/Dustbins";
import ComplaintsPage from "@/react-app/pages/Complaints";

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/localities" element={<LocalitiesPage />} />
            <Route path="/dustbins" element={<DustbinsPage />} />
            <Route path="/complaints" element={<ComplaintsPage />} />
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}
