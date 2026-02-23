import { useState } from "react";
import { useAuth } from "@/react-app/context/AuthContext";
import { useData } from "@/react-app/context/DataContext";
import { useNavigate } from "react-router";
import {
  AlertCircle,
  MapPin,
  FileText,
  Check,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Card } from "@/react-app/components/ui/card";
import DashboardLayout from "@/react-app/components/layout/DashboardLayout";
import type { Complaint } from "@/react-app/types";

export default function FileComplaintPage() {
  const { user } = useAuth();
  const { postcodes, addComplaint } = useData();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    locality: "",
    lat: 26.1633,
    lng: 83.3589,
    dustbinId: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
  });

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "lat" || name === "lng") {
      setFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = (): boolean => {
    setError("");

    if (!formData.title.trim()) {
      setError("Title is required");
      return false;
    }

    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }

    if (formData.description.length < 10) {
      setError("Description must be at least 10 characters");
      return false;
    }

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
      const complaint: Omit<Complaint, "id"> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        createdBy: String(user.id),
        createdByName: user.name,
        location: formData.location.trim(),
        locality: formData.locality.trim(),
        lat: formData.lat,
        lng: formData.lng,
        dustbinId: formData.dustbinId || null,
        status: "pending",
        priority: formData.priority,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addComplaint(complaint);

      // Save to localStorage for persistence
      const existingComplaints = localStorage.getItem("swachhpath_complaints_user");
      const complaints = existingComplaints ? JSON.parse(existingComplaints) : [];
      complaints.push(complaint);
      localStorage.setItem("swachhpath_complaints_user", JSON.stringify(complaints));

      setSuccess(true);

      // Reset form
      setFormData({
        title: "",
        description: "",
        location: "",
        locality: "",
        lat: 26.1633,
        lng: 83.3589,
        dustbinId: "",
        priority: "medium",
      });

      // Redirect after 1.5s
      setTimeout(() => {
        navigate("/complaints", { replace: true });
      }, 1500);
    } catch (err) {
      setError("Failed to file complaint. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const localities = [...new Set(postcodes.map((p) => p.area))];
  const allDustbins = postcodes.flatMap((p) =>
    p.dustbins.map((d) => ({
      id: d.id,
      location: d.location,
      locality: p.area,
    }))
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-red-500/30 bg-red-500/5";
      case "high":
        return "border-orange-500/30 bg-orange-500/5";
      case "medium":
        return "border-yellow-500/30 bg-yellow-500/5";
      default:
        return "border-green-500/30 bg-green-500/5";
    }
  };

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
                <AlertCircle className="w-8 h-8 text-primary" />
                File a Complaint
              </h1>
              <p className="text-muted-foreground mt-1">
                Report waste management issues in your area
              </p>
            </div>
          </div>

          {/* Form Card */}
          <Card className="p-8 glass">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Issue Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Issue Title
                </label>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Dustbin overflowing near market"
                  className="h-11 rounded-lg"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide detailed information about the issue..."
                  rows={5}
                  className="w-full p-3 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 10 characters required
                </p>
              </div>

              {/* Location Details */}
              <div className="border-t border-border pt-6 space-y-4">
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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Related Dustbin (Optional)
                  </label>
                  <select
                    name="dustbinId"
                    value={formData.dustbinId}
                    onChange={handleChange}
                    className="w-full h-11 rounded-lg bg-muted/50 border border-border px-3 text-foreground"
                  >
                    <option value="">Select Dustbin</option>
                    {allDustbins.map((bin) => (
                      <option key={bin.id} value={bin.id}>
                        {bin.id} - {bin.location}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority */}
              <div className="border-t border-border pt-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Priority Level
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["low", "medium", "high", "critical"].map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          priority: priority as any,
                        }))
                      }
                      className={`p-3 rounded-lg border-2 transition-all font-medium capitalize ${
                        formData.priority === priority
                          ? "border-primary bg-primary/10"
                          : getPriorityColor(priority)
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
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
                  <p className="text-sm text-green-500">
                    Complaint filed successfully! Redirecting...
                  </p>
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
                      Filing...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      File Complaint
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* Info Card */}
          <Card className="mt-8 p-6 glass border-primary/20 bg-primary/5">
            <h3 className="font-semibold text-foreground mb-3">Your Information</h3>
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
