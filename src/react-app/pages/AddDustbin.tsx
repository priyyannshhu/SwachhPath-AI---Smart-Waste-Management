import { useState } from "react";
import { useAuth } from "@/react-app/context/AuthContext";
import { useData } from "@/react-app/context/DataContext";
import { useNavigate } from "react-router";
import {
  Plus,
  MapPin,
  Wifi,
  Cpu,
  AlertCircle,
  Check,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Card } from "@/react-app/components/ui/card";
import DashboardLayout from "@/react-app/components/layout/DashboardLayout";

export default function AddDustbinPage() {
  const { user } = useAuth();
  const { postcodes, addDustbin } = useData();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [esp32Enabled, setEsp32Enabled] = useState(false);

  const [formData, setFormData] = useState({
    location: "",
    locality: "",
    lat: 26.1633,
    lng: 83.3589,
    esp32Enabled: false,
    deviceId: "",
    wifiSSID: "",
    wifiPassword: "",
  });

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "lat" || name === "lng") {
      setFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value),
      }));
    } else if (name === "esp32Enabled") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        esp32Enabled: checked,
      }));
      setEsp32Enabled(checked);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = (): boolean => {
    setError("");

    if (!formData.location.trim()) {
      setError("Location is required");
      return false;
    }

    if (!formData.locality.trim()) {
      setError("Locality is required");
      return false;
    }

    if (formData.lat < -90 || formData.lat > 90) {
      setError("Latitude must be between -90 and 90");
      return false;
    }

    if (formData.lng < -180 || formData.lng > 180) {
      setError("Longitude must be between -180 and 180");
      return false;
    }

    if (formData.esp32Enabled) {
      if (!formData.deviceId.trim()) {
        setError("Device ID is required for ESP32");
        return false;
      }
      if (!formData.wifiSSID.trim()) {
        setError("WiFi SSID is required for ESP32");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Create new dustbin entry
      const newDustbin = {
        id: `DB_${Date.now()}`,
        location: formData.location.trim(),
        locality: formData.locality.trim(),
        fillLevel: 0,
        battery: 100,
        status: "online" as const,
        lat: formData.lat,
        lng: formData.lng,
        addedByUserId: String(user.id),
        esp32Enabled: formData.esp32Enabled,
        deviceId: formData.esp32Enabled ? formData.deviceId.trim() : null,
        wifiSSID: formData.esp32Enabled ? formData.wifiSSID.trim() : null,
        createdAt: new Date().toISOString(),
      };

      // Add to data context (simulates backend save)
      addDustbin(newDustbin);

      // Save to localStorage for persistence
      const existingDustbins = localStorage.getItem("swachhpath_dustbins");
      const dustbins = existingDustbins ? JSON.parse(existingDustbins) : [];
      dustbins.push(newDustbin);
      localStorage.setItem("swachhpath_dustbins", JSON.stringify(dustbins));

      setSuccess(true);

      // Reset form
      setFormData({
        location: "",
        locality: "",
        lat: 26.1633,
        lng: 83.3589,
        esp32Enabled: false,
        deviceId: "",
        wifiSSID: "",
        wifiPassword: "",
      });

      // Redirect after 1.5s
      setTimeout(() => {
        navigate("/dustbins", { replace: true });
      }, 1500);
    } catch (err) {
      setError("Failed to add dustbin. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const localities = [...new Set(postcodes.map((p) => p.area))];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Plus className="w-8 h-8 text-primary" />
                Add New Dustbin
              </h1>
              <p className="text-muted-foreground mt-1">
                Register a waste collection bin in your locality
              </p>
            </div>
          </div>

          {/* Form Card */}
          <Card className="p-8 glass">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Location Details Section */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Location Details
                </h2>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Location / Address
                  </label>
                  <Input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Market Street, near Old Hospital"
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Locality / Zone
                  </label>
                  <select
                    name="locality"
                    value={formData.locality}
                    onChange={handleChange}
                    className="w-full h-11 rounded-lg bg-muted/50 border border-border px-3 text-foreground"
                  >
                    <option value="">Select Locality</option>
                    {localities.map((locality) => (
                      <option key={locality} value={locality}>
                        {locality}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Latitude
                    </label>
                    <Input
                      type="number"
                      name="lat"
                      value={formData.lat}
                      onChange={handleChange}
                      step="0.0001"
                      min="-90"
                      max="90"
                      className="h-11 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Longitude
                    </label>
                    <Input
                      type="number"
                      name="lng"
                      value={formData.lng}
                      onChange={handleChange}
                      step="0.0001"
                      min="-180"
                      max="180"
                      className="h-11 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* ESP32 Configuration Section */}
              <div className="border-t border-border pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-primary" />
                    ESP32 Configuration (Optional)
                  </h2>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={esp32Enabled}
                      onChange={handleChange}
                      name="esp32Enabled"
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="text-sm font-medium">Enable ESP32</span>
                  </label>
                </div>

                {esp32Enabled && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Device ID
                      </label>
                      <Input
                        type="text"
                        name="deviceId"
                        value={formData.deviceId}
                        onChange={handleChange}
                        placeholder="e.g., ESP32_001"
                        className="h-11 rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground">
                        Unique identifier for your ESP32 device
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-primary" />
                        WiFi SSID
                      </label>
                      <Input
                        type="text"
                        name="wifiSSID"
                        value={formData.wifiSSID}
                        onChange={handleChange}
                        placeholder="e.g., SwachhPath_Zone_A"
                        className="h-11 rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground">
                        Network name for device communication
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-700 dark:text-amber-300">
                        <p className="font-semibold mb-1">Security Note:</p>
                        <p>WiFi passwords are never stored permanently. Configure them directly on the device for maximum security.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-green-500">Dustbin added successfully! Redirecting...</p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1 h-11 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-11 rounded-lg bg-primary hover:bg-primary/90 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Add Dustbin
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* Info Card */}
          <Card className="mt-8 p-6 glass border-primary/20 bg-primary/5">
            <h3 className="font-semibold text-foreground mb-3">Added by User</h3>
            <p className="text-sm text-muted-foreground mb-2">
              <span className="font-medium text-foreground">{user.name}</span> ({user.email})
            </p>
            <p className="text-sm text-muted-foreground">
              Locality: <span className="font-medium text-foreground">{user.locality}</span>
            </p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
