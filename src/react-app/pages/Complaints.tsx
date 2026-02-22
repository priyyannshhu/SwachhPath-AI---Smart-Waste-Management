import { useState, useMemo } from "react";
import { useAuth } from "@/react-app/context/AuthContext";
import { useData } from "@/react-app/context/DataContext";
import { Complaint } from "@/react-app/types";
import DashboardLayout from "@/react-app/components/layout/DashboardLayout";
import { Button } from "@/react-app/components/ui/button";
import { Textarea } from "@/react-app/components/ui/textarea";
import {
  MessageSquareWarning,
  Plus,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/react-app/lib/utils";

export default function ComplaintsPage() {
  const { user } = useAuth();
  const { postcodes, complaints, addComplaint, updateComplaintStatus } = useData();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    issue: "",
  });

  // Filter complaints for regular users
  const filteredComplaints = useMemo(() => {
    if (user?.role === "admin") return complaints;
    return complaints.filter((c) => c.pin === user?.pin);
  }, [complaints, user]);

  // Get user's area info
  const userArea = useMemo(() => {
    if (user?.role === "admin") return null;
    return postcodes.find((p) => p.pin === user?.pin);
  }, [postcodes, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.issue.trim() || !user) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    addComplaint({
      user: user.name,
      pin: user.pin || "",
      area: userArea?.area || "",
      issue: formData.issue,
      status: "Pending",
    });

    setFormData({ issue: "" });
    setShowForm(false);
    setIsSubmitting(false);
  };

  const handleStatusUpdate = (id: number, status: Complaint["status"]) => {
    updateComplaintStatus(id, status);
  };

  const getStatusIcon = (status: Complaint["status"]) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-4 h-4" />;
      case "In Progress":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "Resolved":
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const getStatusStyle = (status: Complaint["status"]) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "In Progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Resolved":
        return "bg-green-500/20 text-green-400 border-green-500/30";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Complaints</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.role === "admin"
                ? "View and manage all complaints"
                : "Raise and track your complaints"}
            </p>
          </div>
          {user?.role === "user" && (
            <Button
              onClick={() => setShowForm(true)}
              className="gap-2 bg-primary hover:bg-primary/90 neon-glow-sm"
            >
              <Plus className="w-4 h-4" />
              Raise Complaint
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <MessageSquareWarning className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {filteredComplaints.length}
                </p>
                <p className="text-xs text-muted-foreground">Total Complaints</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {filteredComplaints.filter((c) => c.status === "Pending").length}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {filteredComplaints.filter((c) => c.status === "Resolved").length}
                </p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </div>
        </div>

        {/* New Complaint Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Raise a Complaint
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/30 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Area:</span>
                    <span className="font-medium text-foreground">
                      {userArea?.area}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">PIN:</span>
                    <span className="font-medium text-foreground">
                      {user?.pin}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Describe the Issue
                  </label>
                  <Textarea
                    value={formData.issue}
                    onChange={(e) =>
                      setFormData({ ...formData, issue: e.target.value })
                    }
                    placeholder="e.g., Dustbin overflowing near market area..."
                    className="min-h-[120px] bg-muted/50 border-border focus:border-primary"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Submit"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Complaints List */}
        <div className="space-y-4">
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-12 glass rounded-2xl">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No complaints found</p>
            </div>
          ) : (
            filteredComplaints.map((complaint) => (
              <div
                key={complaint.id}
                className="glass glass-hover rounded-2xl p-5 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <MessageSquareWarning className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">
                          {complaint.issue}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>By {complaint.user}</span>
                          <span>•</span>
                          <span>{complaint.area}</span>
                          <span>•</span>
                          <span>PIN: {complaint.pin}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border",
                        getStatusStyle(complaint.status)
                      )}
                    >
                      {getStatusIcon(complaint.status)}
                      {complaint.status}
                    </span>

                    {user?.role === "admin" && complaint.status !== "Resolved" && (
                      <div className="flex gap-2">
                        {complaint.status === "Pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleStatusUpdate(complaint.id, "In Progress")
                            }
                            className="text-xs h-8"
                          >
                            Start
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() =>
                            handleStatusUpdate(complaint.id, "Resolved")
                          }
                          className="text-xs h-8 bg-green-600 hover:bg-green-700"
                        >
                          Resolve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
