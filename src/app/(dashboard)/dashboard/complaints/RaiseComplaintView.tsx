/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Loader2, Send } from "lucide-react";
import { useAuth } from "@/hooks/queries/useAuth";
import { useCitizenComplaints } from "@/hooks/queries/useComplaints";
import { Input } from "@/components/ui/input";
import { StatusChip } from "./page";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function RaiseComplaintView() {
  const { user }    = useAuth();
  const {
    raiseComplaint, isRaising,
    useGetMyComplaints,
    useGetMyComplaint:useGetComplaintById,
    addResponseAsync, isAddingResponse,
  } = useCitizenComplaints();

  const { data: myComplaintsData, refetch } = useGetMyComplaints({ limit: 10 });
  const myComplaints = myComplaintsData ?? [];

  const [sending, setSending]                   = useState(false);
  const [errors, setErrors]                     = useState<{ title?: string; description?: string }>({});
  const [formData, setFormData]                 = useState({ title: "", description: "", category: "General" });
  const [selectedComplaintId, setSelectedId]    = useState<string | null>(null);
  const [newMessage, setNewMessage]             = useState("");

  // Fetch full complaint with responses when one is selected
  const { data: activeComplaint, isLoading: loadingThread, refetch: refetchThread } =
    useGetComplaintById(selectedComplaintId ?? "");

  const validateForm = () => {
    const errs: { title?: string; description?: string } = {};
    if (!formData.title.trim() || formData.title.length < 5)       errs.title = "Title must be at least 5 characters";
    if (!formData.description.trim() || formData.description.length < 20) errs.description = "Please provide more detail (minimum 20 characters)";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) { toast.error("Please fix the errors"); return; }
    setSending(true);
    await raiseComplaint({ title: formData.title, description: formData.description, category: formData.category });
    setSending(false);
    setFormData({ title: "", description: "", category: "General" });
    setErrors({});
    refetch();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field as keyof typeof errors]) setErrors({ ...errors, [field]: undefined });
  };

  const handleSendReply = async () => {
    if (!newMessage.trim() || !selectedComplaintId) return;
    await addResponseAsync({ id: selectedComplaintId, data: { message: newMessage } });
    setNewMessage("");
    refetchThread();
    refetch();
  };

  const isThreadOpen   = !!selectedComplaintId;
  const isClosed       = activeComplaint?.status === "closed" || activeComplaint?.status === "resolved";
  const canReply       = isThreadOpen && !isClosed;

  // Shape messages  -  original complaint + all responses
  const messages = activeComplaint ? [
    {
      id:   "original",
      from: "user" as const,
      text: activeComplaint.description,
      time: new Date(activeComplaint.createdAt).toLocaleString(),
    },
    ...(activeComplaint.responses ?? []).map((r: any) => ({
      id:   r.id,
      from: r.responderId === activeComplaint.raisedById ? "user" as const : "admin" as const,
      text: r.message,
      time: new Date(r.createdAt).toLocaleString(),
    })),
  ] : [];

  return (
    <div>
      <PageHeader title="Raise Complaint" subtitle="Submit and track your complaints" />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card className="lg:col-span-2 p-6 bg-gradient-card border-border/40">
          <h3 className="font-semibold mb-4">Raise a complaint</h3>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Subject <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={`mt-1.5 ${errors.title ? "border-red-500" : ""}`}
                  placeholder="Enter complaint subject"
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                <p className="text-xs text-muted-foreground mt-1">{formData.title.length}/5 characters minimum</p>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Payments">Payments</SelectItem>
                    <SelectItem value="Sanitation">Sanitation</SelectItem>
                    <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description <span className="text-red-500">*</span></Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={5}
                className={`mt-1.5 ${errors.description ? "border-red-500" : ""}`}
                placeholder="Please provide detailed information about your complaint..."
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              <p className="text-xs text-muted-foreground mt-1">{formData.description.length}/20 characters minimum</p>
            </div>
            <Button type="submit" disabled={sending || isRaising} className="bg-gradient-hero shadow-elegant">
              {(sending || isRaising) && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {sending || isRaising ? "Submitting..." : "Submit complaint"}
            </Button>
          </form>
        </Card>

        {/* Complaint History */}
        <Card className="p-5 bg-gradient-card border-border/40">
          <h3 className="font-semibold mb-3">Complaint History</h3>
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
            {myComplaints.length === 0 && (
              <p className="text-sm text-muted-foreground">No complaints raised yet.</p>
            )}
            {myComplaints.map((c: any) => (
              <div
                key={c.id}
                className="p-3 rounded-lg border border-border/60 bg-background cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setSelectedId(c.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-muted-foreground">{c.ticketNumber}</div>
                  <StatusChip status={c.status} />
                </div>
                <div className="font-medium text-sm mt-1">{c.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {c.category || "General"} • {new Date(c.createdAt).toLocaleDateString()}
                </div>
                {c.responses?.length > 0 && (
                  <div className="mt-1.5 text-xs text-primary font-medium">
                    {c.responses.length} response{c.responses.length > 1 ? "s" : ""} â†’
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Thread Modal */}
      <Dialog open={isThreadOpen} onOpenChange={(o) => { if (!o) { setSelectedId(null); setNewMessage(""); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0">

          {/* Header */}
          <DialogHeader className="p-5 border-b shrink-0">
            {loadingThread ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : activeComplaint && (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <DialogTitle className="text-base font-semibold leading-tight">
                    {activeComplaint.title}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeComplaint.ticketNumber} · {activeComplaint.category || "General"}
                    {activeComplaint.assignedTo && (
                      <> · Assigned to <span className="font-medium text-foreground">
                        {activeComplaint.assignedTo.firstName} {activeComplaint.assignedTo.lastName}
                      </span></>
                    )}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                  activeComplaint.status === "open"        ? "bg-warning/15 text-warning-foreground" :
                  activeComplaint.status === "assigned"    ? "bg-info/15 text-info" :
                  activeComplaint.status === "in_progress" ? "bg-primary/15 text-primary" :
                  activeComplaint.status === "resolved"    ? "bg-success/15 text-success" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {activeComplaint.status.replace("_", " ")}
                </span>
              </div>
            )}
          </DialogHeader>

          {/* Message thread */}
          <div className="flex-1 overflow-y-auto divide-y divide-border min-h-0">
            {loadingThread ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`p-4 ${msg.from === "admin" ? "bg-primary/5" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${msg.from === "admin" ? "text-primary" : "text-foreground"}`}>
                        {msg.from === "admin" ? "Support Officer" : "You"}
                      </span>
                      <span className="text-xs text-muted-foreground">{msg.time}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{msg.text}</p>
                  </div>
                ))}

                {messages.length === 1 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No responses yet. We&apos;ll get back to you shortly.
                  </div>
                )}

                {activeComplaint?.resolutionNote && (
                  <div className="p-4 bg-success/5 border-t border-success/20">
                    <p className="text-xs font-semibold text-success mb-1">Resolution</p>
                    <p className="text-sm">{activeComplaint.resolutionNote}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Reply box */}
          {canReply && (
            <div className="p-4 border-t flex gap-2 shrink-0">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your reply..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />
              <Button
                onClick={handleSendReply}
                disabled={isAddingResponse || !newMessage.trim()}
                className="bg-gradient-hero shrink-0"
              >
                {isAddingResponse
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}

          {/* Closed notice */}
          {isClosed && (
            <div className="p-3 border-t text-center text-xs text-muted-foreground shrink-0">
              This ticket is {activeComplaint?.status}. Open a new complaint if needed.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RaiseComplaintView;

