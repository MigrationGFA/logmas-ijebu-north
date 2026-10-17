/* eslint-disable @typescript-eslint/no-explicit-any */


import React from 'react'
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
import {  Loader2 } from "lucide-react";
import {
  useAdminComplaints,
} from "@/hooks/queries/useComplaints";
import { Complaint } from "@/services/apiComplaints";
import { StatTile, StatusChip } from './page';
import ManageDialog from './ManageDialog';

function AdminComplaintsView({ readOnly }: { readOnly: boolean }) {
  const { useGetAllComplaints, adminRespond, isAdminResponding } =
    useAdminComplaints();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [responseText, setResponseText] = useState("");

  const {
    data: complaintsData,
    isLoading,
    refetch,
  } = useGetAllComplaints({
    status: statusFilter as any,
  });

  // console.log(complaintsData, "complaintsData");
  const complaints = Array.isArray(complaintsData)
    ? complaintsData
    : (complaintsData as any)?.data || [];
  const stats = {
    open: complaints.filter((c: { status: string }) => c.status === "open")
      .length,
    assigned: complaints.filter(
      (c: { status: string }) => c.status === "assigned",
    ).length,
    in_progress: complaints.filter(
      (c: { status: string }) => c.status === "in_progress",
    ).length,
    resolved: complaints.filter(
      (c: { status: string }) => c.status === "resolved",
    ).length,
    closed: complaints.filter((c: { status: string }) => c.status === "closed")
      .length,
  };

  const handleRespond = async (id: string) => {
    if (!responseText.trim()) {
      toast.error("Please enter a response");
      return;
    }
    await adminRespond({ id, data: { message: responseText } });
    setResponseText("");
    setSelectedComplaint(null);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={readOnly ? "Complaints Overview" : "Complaints Management"}
        subtitle="All complaints across the LGA"
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatTile label="Open" value={stats.open} tone="warning" />
        <StatTile label="Assigned" value={stats.assigned} tone="info" />
        <StatTile
          label="In Progress"
          value={stats.in_progress}
          tone="primary"
        />
        <StatTile label="Resolved" value={stats.resolved} tone="success" />
        <StatTile label="Total" value={complaints.length} tone="primary" />
      </div>

      <div className="mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="p-0 bg-gradient-card border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                {/* <TableHead>To</TableHead> */}
                <TableHead>By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints?.map((complaint: Complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-mono text-xs">
                    {complaint.ticketNumber}
                  </TableCell>
                  <TableCell className="font-medium">
                    {complaint.title}
                  </TableCell>
                  <TableCell>{complaint.category || "General"}</TableCell>
                  {/* <TableCell>{complaint.assignedTo?.firstName} {complaint.assignedTo?.lastName || "N/A"}</TableCell> */}
                  <TableCell>
                    {complaint.raisedBy?.firstName}{" "}
                    {complaint.raisedBy?.lastName}
                  </TableCell>
                  <TableCell>
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={complaint.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <ManageDialog
                      complaint={complaint}
                      readOnly={readOnly}
                    //   onRespond={() => setSelectedComplaint(complaint)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Response Dialog */}
      <Dialog
        open={!!selectedComplaint}
        onOpenChange={() => setSelectedComplaint(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Complaint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/40 border">
              <div className="font-semibold">{selectedComplaint?.title}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {selectedComplaint?.description}
              </div>
            </div>
            <div>
              <Label>Response Message</Label>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
                placeholder="Enter your response..."
                className="mt-1.5"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedComplaint(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleRespond(selectedComplaint?.id)}
                disabled={isAdminResponding}
                className="bg-gradient-hero"
              >
                {isAdminResponding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send Response"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminComplaintsView