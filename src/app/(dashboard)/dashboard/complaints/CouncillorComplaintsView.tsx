/* eslint-disable @typescript-eslint/no-explicit-any */



import React from 'react'
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {  MessageSquare,  Loader2, Send } from "lucide-react";
import {
  useCouncillorComplaints,
  useAdminComplaints,
} from "@/hooks/queries/useComplaints";
import { Input } from "@/components/ui/input";
import { StatTile, StatusChip } from './page';

function CouncillorComplaintsView({ readOnly }: { readOnly: boolean }) {
  const {
    useGetWardComplaints,
    respond,
    isResponding,
  } = useCouncillorComplaints();


  const {useGetComplaint:useGetWardComplaint} = useAdminComplaints()

  const { data: complaintsData, isLoading, refetch } = useGetWardComplaints();
  const complaints = complaintsData || [];

  const [selectedComplaintId, setSelectedId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Fetch full thread when a complaint is selected  -  same pattern as the citizen view
  const {
    data: activeComplaint,
    isLoading: loadingThread,
    refetch: refetchThread,
  } = useGetWardComplaint(selectedComplaintId ?? "");

  const stats = {
    open: complaints.filter((c: { status: string }) => c.status === "open").length,
    assigned: complaints.filter((c: { status: string }) => c.status === "assigned").length,
    in_progress: complaints.filter((c: { status: string }) => c.status === "in_progress").length,
    resolved: complaints.filter((c: { status: string }) => c.status === "resolved").length,
  };

  const handleSendReply = async () => {
    if (!newMessage.trim() || !selectedComplaintId) return;
    await respond({ id: selectedComplaintId, data: { message: newMessage } });
    setNewMessage("");
    refetchThread();
    refetch();
  };

  const isThreadOpen = !!selectedComplaintId;
  const isClosed = activeComplaint?.status === "closed" || activeComplaint?.status === "resolved";
  const canReply = isThreadOpen && !isClosed && !readOnly;

  // Shape messages  -  original complaint + all responses.
  // Framing is flipped from the citizen view: the CITIZEN (raisedById) is "them" here,
  // and anyone else who responded (this councillor, an admin) is "you".
  const messages = activeComplaint
    ? [
        {
          id: "original",
          from: "citizen" as const,
          text: activeComplaint.description,
          time: new Date(activeComplaint.createdAt).toLocaleString(),
        },
        ...(activeComplaint.responses ?? []).map((r: any) => ({
          id: r.id,
          from: r.responderId === activeComplaint.raisedById ? ("citizen" as const) : ("you" as const),
          text: r.message,
          time: new Date(r.createdAt).toLocaleString(),
        })),
      ]
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Ward Complaints" subtitle="Complaints from your ward" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Open" value={stats.open} tone="warning" />
        <StatTile label="Assigned" value={stats.assigned} tone="info" />
        <StatTile label="In Progress" value={stats.in_progress} tone="primary" />
        <StatTile label="Resolved" value={stats.resolved} tone="success" />
      </div>

      <Card className="p-0 bg-gradient-card border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-mono text-xs">{complaint.ticketNumber}</TableCell>
                  <TableCell className="font-medium">{complaint.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{complaint.description}</TableCell>
                  <TableCell>
                    {complaint.raisedBy?.firstName} {complaint.raisedBy?.lastName}
                  </TableCell>
                  <TableCell>{new Date(complaint.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <StatusChip status={complaint.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setSelectedId(complaint.id)}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1" />
                      {(complaint.responses?.length ?? 0) > 0 ? "View" : "Respond"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Thread Modal  -  same pattern as the citizen's RaiseComplaintView */}
      <Dialog
        open={isThreadOpen}
        onOpenChange={(o) => {
          if (!o) {
            setSelectedId(null);
            setNewMessage("");
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="p-5 border-b shrink-0">
            {loadingThread ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              activeComplaint && (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <DialogTitle className="text-base font-semibold leading-tight">
                      {activeComplaint.title}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeComplaint.ticketNumber} · {activeComplaint.category || "General"} · From{" "}
                      <span className="font-medium text-foreground">
                        {activeComplaint.raisedBy?.firstName} {activeComplaint.raisedBy?.lastName}
                      </span>
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                      activeComplaint.status === "open"
                        ? "bg-warning/15 text-warning-foreground"
                        : activeComplaint.status === "assigned"
                          ? "bg-info/15 text-info"
                          : activeComplaint.status === "in_progress"
                            ? "bg-primary/15 text-primary"
                            : activeComplaint.status === "resolved"
                              ? "bg-success/15 text-success"
                              : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {activeComplaint.status.replace("_", " ")}
                  </span>
                </div>
              )
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto divide-y divide-border min-h-0">
            {loadingThread ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`p-4 ${msg.from === "you" ? "bg-primary/5" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-semibold ${msg.from === "you" ? "text-primary" : "text-foreground"}`}
                      >
                        {msg.from === "you"
                          ? "You"
                          : `${activeComplaint?.raisedBy?.firstName ?? "Citizen"}`}
                      </span>
                      <span className="text-xs text-muted-foreground">{msg.time}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{msg.text}</p>
                  </div>
                ))}

                {messages.length === 1 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No response sent yet.
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
                disabled={isResponding || !newMessage.trim()}
                className="bg-gradient-hero shrink-0"
              >
                {isResponding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}

          {isClosed && (
            <div className="p-3 border-t text-center text-xs text-muted-foreground shrink-0">
              This ticket is {activeComplaint?.status}.
            </div>
          )}

          {readOnly && !isClosed && (
            <div className="p-3 border-t text-center text-xs text-muted-foreground shrink-0">
              Read-only view.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default CouncillorComplaintsView
