/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  FileBadge,
  CheckCircle2,
  XCircle,
  Download,
  User,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Send,
  FileText,
} from "lucide-react";
import { Application } from "@/services/apiServices";
import { format } from "date-fns";
import { useAdminStateOfOrigin } from "@/hooks/queries/useServices";
import { useCouncillorStateOfOrigin } from "@/hooks/queries/useServices";
import { tokenManager } from "@/services/apiAuth";
import Link from "next/link";
import { useStaffManagement } from "@/hooks/queries/useLgaAdmin";
import { getPublicCertificateUrl } from "@/lib/certificateTokens";

interface ReviewDialogProps {
  app: Application;
  canDecide: boolean;
  councillor: boolean;
}

function ReviewDialog({ app, canDecide, councillor }: ReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [remarks, setRemarks] = useState(
    app.reviewNotes || app.councillorNotes || "",
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [selectedCouncillorId, setSelectedCouncillorId] = useState(""); // â† NEW

  const user = tokenManager.getUser();
  const { forwardToCouncillorAsync, isForwarding } = useAdminStateOfOrigin();
  const { decideOnApplicationAsync, isDeciding } =
    useCouncillorStateOfOrigin(true);
  const { useGetStaff } = useStaffManagement();

  // Fetch councillors for LGA Admin picker
  const { data: councillorsData } = useGetStaff({ role: "ward_councillor" }); // â† NEW
  const councillors = councillorsData ?? [];

  const isLGAAdmin = user?.role === "lga_admin" || user?.role === "super_admin";
  const isWardCouncillor = user?.role === "ward_councillor";
  const isCitizen = user?.role === "citizen" || user?.role === "business_owner";
  const isLoading = isForwarding || isDeciding;

  const isApproved =
    app.status === "approved" || app.status === "certificate_issued";
  const hasCertificate = !!app.certificate;

  const initials = app.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleForward = async () => {
    if (!selectedCouncillorId) {
      toast.error("No councillor selected. Please select a councillor.");
      return;
    }
    try {
      await forwardToCouncillorAsync(
        {
          id: app.id,
          data: {
            reviewNotes: remarks || " No notes provided",
            councillorId: selectedCouncillorId, // â† pass if selected
          },
        },
        {
          onSuccess: () => {
            setOpen(false);
            toast.success(
              selectedCouncillorId
                ? `Application forwarded to selected councillor`
                : `Application forwarded to ward councillor`,
            );
          },
        },
      );
    } catch {}
  };

  const handleDecide = async (decision: "approved" | "rejected") => {
    if (decision === "rejected" && !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    try {
      await decideOnApplicationAsync(
        {
          id: app.id,
          data: {
            decision,
            councillorNotes: remarks,
            rejectionReason:
              decision === "rejected" ? rejectionReason : undefined,
          },
        },
        {
          onSuccess: () => {
            setOpen(false);
            setShowRejectionInput(false);
            setRejectionReason("");
          },
        },
      );
    } catch {}
  };

  const handleDialogClose = (newOpen: boolean) => {
    if (!newOpen) {
      setShowRejectionInput(false);
      setRejectionReason("");
      setSelectedCouncillorId("");
      setRemarks(app.reviewNotes || app.councillorNotes || "");
    }
    setOpen(newOpen);
  };

  // console.log(selectedCouncillorId, "selectedCouncillorId");

  const showForwardAction = canDecide && isLGAAdmin;
  const showDecideActions = canDecide && isWardCouncillor;
  const showViewCertificate =
    !canDecide && isCitizen && isApproved && hasCertificate;

  const handleViewCertificate = () => {
    const certToken =
      app.certificate?.certificateNumber ??
      app.certificate?.verificationCode ??
      app.certificate?.qrToken ??
      app.certificate?.id ??
      app.certificateNumber ??
      app.verificationCode ??
      app.qrToken ??
      app.id;

    if (!certToken) {
      toast.error("Certificate record or token is not yet available for this application.");
      return;
    }

    const certUrl = getPublicCertificateUrl(encodeURIComponent(certToken));
    window.open(certUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Eye className="h-3.5 w-3.5 mr-1" />
          {canDecide ? "Review" : "View"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileBadge className="h-5 w-5 text-primary" />
            Application {app.applicationNo || app.id}
          </DialogTitle>
        </DialogHeader>

        {/* Applicant header */}
        <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/40 border border-border/60">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-gradient-hero text-primary-foreground font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg">{app.fullName}</h3>
              <StatusBadge
                status={app.status === "paid" ? "under_review" : app.status}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              State of Origin Certificate • Submitted{" "}
              {format(new Date(app.createdAt), "PPP")}
            </p>
          </div>
        </div>

        {/* Applicant fields */}
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <Field
            icon={User}
            label="Date of Birth"
            value={format(new Date(app.dateOfBirth), "PPP")}
          />
          <Field icon={User} label="Gender" value={app.gender} />
          <Field icon={Phone} label="Phone" value={app.phone} />
          <Field icon={Mail} label="Email" value={app.email || "N/A"} />
          <Field icon={MapPin} label="LGA" value="the LGA" />
          <Field icon={MapPin} label="Ward" value={app.ward?.name || "N/A"} />
          <div className="sm:col-span-2">
            <Field icon={MapPin} label="Address" value={app.address} />
          </div>
        </div>

        {/* Payment info */}
        <Card className="p-4 bg-background border-border/60">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" /> Payment & Receipt
          </h4>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <Badge className="mt-1 bg-success/15 text-success border-success/30">
                {app.invoice?.status || "N/A"}
              </Badge>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Amount</div>
              <div className="font-semibold">
                ₦
                {app.invoice?.totalAmount
                  ? parseInt(app.invoice.totalAmount as any).toLocaleString()
                  : "0"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Invoice</div>
              <div className="font-mono text-xs">
                {app.invoice?.id?.slice(0, 8) || " - "}
              </div>
            </div>
          </div>
        </Card>

        {/* Certificate info */}
        {isApproved && hasCertificate && app.certificate && (
          <Card className="p-4 bg-success/5 border-success/30">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" /> Certificate
              Information
            </h4>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">
                  Certificate Number
                </div>
                <div className="font-mono font-semibold">
                  {app.certificate.certificateNumber}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Issued Date</div>
                <div>{format(new Date(app.certificate.issuedAt), "PPP")}</div>
              </div>
            </div>
          </Card>
        )}

        {/* â”€â”€ LGA ADMIN FORWARD SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {showForwardAction &&
          app.invoice.status === "paid" &&
          app.status === "paid" && (
            <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
              <h4 className="text-sm font-semibold">Forward to Councillor</h4>

              {/* Councillor picker */}
              <div>
                <Label>Assign to Councillor</Label>
                <select
                  className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedCouncillorId}
                  onChange={(e) => setSelectedCouncillorId(e.target.value)}
                >
                  <option value="">Select a councillor</option>
                  {councillors.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                      {c.ward?.name
                        ? `  -  ${c.ward.name} Ward`
                        : "  -  No ward assigned"}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedCouncillorId
                    ? "This application will be sent directly to the selected councillor."
                    : ""}
                </p>
              </div>

              {/* Review notes */}
              <div>
                <Label>Review Notes</Label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add notes for the ward councillor (optional)..."
                  className="mt-1.5"
                  rows={3}
                />
              </div>
            </div>
          )}

        {/* â”€â”€ COUNCILLOR REMARKS SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {showDecideActions && (
          <div className="space-y-3">
            <div>
              <Label>Decision Notes</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add your decision notes (optional)..."
                className="mt-1.5"
                rows={3}
              />
            </div>

            {showRejectionInput && (
              <div>
                <Label className="text-destructive">Rejection Reason *</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a detailed reason for rejection..."
                  className="mt-1.5 border-destructive"
                  rows={3}
                />
              </div>
            )}
          </div>
        )}

        {/* â”€â”€ ACTION BUTTONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {(showForwardAction || showDecideActions) && (
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (app.passportUrl) {
                  window.open(app.passportUrl, "_blank");
                  toast.success("Documents downloaded");
                } else {
                  toast.error("No documents available for download");
                }
              }}
            >
              <Download className="h-4 w-4 mr-1.5" /> Download Documents
            </Button>

            {/* LGA Admin actions */}
            {showForwardAction &&
              app.invoice.status === "paid" &&
              app.status === "paid" && (
                <>
                  {/* <Button
                    variant="outline"
                    className="text-destructive"
                    onClick={() => handleDecide("rejected")}
                    disabled={isLoading}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" /> Decline
                  </Button> */}
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleForward}
                    disabled={isLoading}
                  >
                    {isForwarding ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-1.5" />
                    )}
                    Forward to Councillor
                  </Button>
                </>
              )}

            {/* Ward Councillor actions */}
            {showDecideActions && (
              <>
                {!showRejectionInput ? (
                  <Button
                    variant="outline"
                    className="text-destructive"
                    onClick={() => setShowRejectionInput(true)}
                    disabled={isLoading}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" /> Reject
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => handleDecide("rejected")}
                    disabled={isDeciding || !rejectionReason.trim()}
                  >
                    {isDeciding ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-1.5" />
                    )}
                    Confirm Rejection
                  </Button>
                )}
                <Button
                  className="bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => handleDecide("approved")}
                  disabled={isDeciding}
                >
                  {isDeciding ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  )}
                  Approve & Issue Certificate
                </Button>
              </>
            )}
          </div>
        )}

        {/* View-only footer */}
        {!canDecide && (
          <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
            {showViewCertificate && (
              <Button
                variant="outline"
                className="border-success/50 text-success hover:text-success"
                onClick={handleViewCertificate}
              >
                <FileText className="h-4 w-4 mr-1.5" />
                View Certificate
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
export default ReviewDialog;

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/60 bg-background">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium text-sm truncate">{value}</div>
      </div>
    </div>
  );
}

