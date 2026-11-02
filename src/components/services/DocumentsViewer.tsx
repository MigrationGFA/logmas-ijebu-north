"use client";

import React, { useState } from "react";
import { ApplicationDocument } from "@/types/application";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FileText,
  FileCheck,
  Eye,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";

interface DocumentsViewerProps {
  documents: ApplicationDocument[];
  className?: string;
}

// Convert requirement keys to human friendly title labels
function getDocumentLabel(typeKey: string): string {
  const map: Record<string, string> = {
    passport_photo: "Passport Photograph",
    nin_slip: "NIN Slip / National ID",
    baale_letter: "Baale / Traditional Ruler Letter",
    birth_certificate: "Birth Certificate / Age Declaration",
    club_constitution: "Club Constitution / Bye-laws",
    executive_list: "List of Executive Officers",
    patron_letter: "Letter of Consent from Patrons",
    meeting_minutes: "Minutes of Inaugural Meeting",
    president_passport: "Passport Photo of President",
    cda_constitution: "CDA Constitution & Bye-laws",
    executive_resolution: "Executive Committee Resolution",
    boundary_sketch: "Boundary Map / Area Sketch",
    residents_list: "List of Registered Heads",
    chairman_passport: "Passport Photo of Chairman",
    farm_photo: "Farm / Livestock Site Photo",
    land_agreement: "Land Ownership / Lease Agreement",
    farmer_passport: "Passport Photo of Farmer",
    association_letter: "Farmers Association Letter",
    facility_layout: "Facility Floor Plan / Layout",
    waste_management_plan: "Waste Management Contract",
    fumigation_cert: "Fumigation & Pest Certificate",
    sanitation_officer_id: "ID of Safety / Sanitation Officer",
    building_plan: "Approved Building / Survey Plan",
    property_photo: "Exterior Property Photo",
    ownership_title: "Title Document / Deed of Conveyance",
    previous_receipt: "Previous Tenement Receipt",
    vehicle_registration: "Vehicle Registration Papers",
    drivers_licence: "Driver's Licence of Operator",
    waybill_manifest: "Standard Haulage Waybill",
    dispatch_note: "Quarry Dispatch Clearance Note",
    tenancy_agreement: "Tenancy Agreement / Title Document",
    cac_document: "CAC Registration Certificate",
    cac_certificate: "CAC Certificate of Incorporation",
    sanitation_cert: "Environmental Health Certificate",
    proprietor_id: "Valid ID of Proprietor",
    premises_sketch: "Premises Location Sketch",
    fire_safety_receipt: "Fire Extinguisher Receipt",
    operator_passport: "Passport Photo of Manager",
    tenancy_consent: "Landlord Approval Letter",
    mining_licence: "Mining Cadastre Lease / Licence",
    eia_approval: "State EIA Approval Certificate",
    host_community_mou: "Host Community Agreement / MOU",
    site_survey_plan: "Site Survey Plan & GPS Map",
    application_letter: "Formal Application Letter",
    cda_resolution: "CDA Resolution & Consent List",
    street_map: "Street Location Map",
    applicant_id: "Applicant Identification Proof",
    kiosk_photo: "Kiosk & Placement Site Photo",
    landowner_consent: "Landowner / Market Consent Letter",
    valid_id: "Valid National ID Card",
  };

  if (map[typeKey]) return map[typeKey];

  return typeKey
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function isImage(doc: ApplicationDocument): boolean {
  const name = (doc.name || "").toLowerCase();
  const mime = (doc.mimeType || "").toLowerCase();
  return (
    mime.includes("image") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp") ||
    doc.documentType.includes("photo") ||
    doc.documentType.includes("passport")
  );
}

export function DocumentsViewer({ documents, className = "" }: DocumentsViewerProps) {
  const [selectedDoc, setSelectedDoc] = useState<ApplicationDocument | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!documents || documents.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 border rounded-xl">
        No documents attached to this application record.
      </div>
    );
  }

  const handleOpenPreview = (doc: ApplicationDocument) => {
    setSelectedDoc(doc);
    setZoomLevel(100);
  };

  const handleDownload = (doc: ApplicationDocument) => {
    if (doc.url && doc.url.startsWith("http")) {
      window.open(doc.url, "_blank");
    } else {
      // Create a dummy download
      const blob = new Blob([`Official Ijebu North East LGA Statutory Document: ${doc.name}\nType: ${doc.documentType}\nUploaded: ${doc.uploadedAt || new Date().toISOString()}`], {
        type: isImage(doc) ? "image/jpeg" : "application/pdf",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = doc.name || `${doc.documentType}.pdf`;
      link.click();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {documents.map((doc, idx) => {
          const isImg = isImage(doc);
          const label = getDocumentLabel(doc.documentType);

          return (
            <div
              key={doc.id || idx}
              className="border rounded-xl p-3.5 bg-card hover:border-primary/50 transition-all flex flex-col justify-between gap-3 shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      {isImg ? <Eye className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <h6 className="font-semibold text-xs text-foreground truncate" title={label}>
                        {label}
                      </h6>
                      <span className="text-[10px] font-mono text-muted-foreground block truncate">
                        Key: {doc.documentType}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-600 text-[10px] border-emerald-300 shrink-0"
                  >
                    Uploaded
                  </Badge>
                </div>

                {/* Thumbnail Preview if Image */}
                {isImg && (
                  <div
                    onClick={() => handleOpenPreview(doc)}
                    className="mt-3 h-28 w-full rounded-lg bg-muted/40 border overflow-hidden relative group cursor-pointer flex items-center justify-center"
                  >
                    {doc.url && !doc.url.startsWith("blob:") && !doc.url.startsWith("/uploads") ? (
                      <img
                        src={doc.url}
                        alt={label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-3 text-center space-y-1">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                          IMG
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">
                          {doc.name}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
                      <Eye className="h-4 w-4" /> Click to Preview
                    </div>
                  </div>
                )}

                {!isImg && (
                  <div className="mt-3 p-2.5 rounded-lg bg-muted/30 border text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="font-mono text-[11px] truncate text-foreground">
                        {doc.name}
                      </span>
                    </div>
                    {doc.fileSize && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {(doc.fileSize / 1024).toFixed(0)} KB
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t text-xs">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenPreview(doc)}
                  className="flex-1 text-xs h-7 gap-1"
                >
                  <Eye className="h-3 w-3" /> Preview
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                  title="Download File"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Full Preview Lightbox Modal */}
      {selectedDoc && (
        <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-5">
            <DialogHeader className="border-b pb-3">
              <div className="flex items-center justify-between gap-2 pr-6">
                <div>
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {getDocumentLabel(selectedDoc.documentType)}
                  </DialogTitle>
                  <DialogDescription className="text-xs font-mono">
                    {selectedDoc.name} • Multipart Key: {selectedDoc.documentType}
                  </DialogDescription>
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-300">
                  Verified Statutory Document
                </Badge>
              </div>
            </DialogHeader>

            {/* Modal Body: PDF vs Image Viewer */}
            <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center min-h-[350px] bg-muted/20 rounded-xl border my-2">
              {isImage(selectedDoc) ? (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div
                    style={{ transform: `scale(${zoomLevel / 100})`, transition: "transform 0.2s" }}
                    className="max-h-[500px] max-w-full flex items-center justify-center overflow-hidden rounded-lg shadow-md border bg-background"
                  >
                    {selectedDoc.url && !selectedDoc.url.startsWith("blob:") && !selectedDoc.url.startsWith("/uploads") ? (
                      <img
                        src={selectedDoc.url}
                        alt={selectedDoc.name}
                        className="max-h-[480px] w-auto object-contain"
                      />
                    ) : (
                      <div className="p-12 text-center space-y-3">
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-extrabold text-xl">
                          PHOTO
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{selectedDoc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Official {getDocumentLabel(selectedDoc.documentType)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-2 bg-background border px-3 py-1.5 rounded-full shadow-xs text-xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </Button>
                    <span className="font-mono text-[11px] font-semibold">{zoomLevel}%</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4 bg-background rounded-lg border">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <h5 className="font-bold text-sm text-foreground">{selectedDoc.name}</h5>
                    <p className="text-xs text-muted-foreground">
                      Statutory PDF Document for Ijebu North East LGA Authority Review.
                    </p>
                    <div className="pt-2">
                      <Badge variant="secondary" className="font-mono text-[11px]">
                        Field Name: {selectedDoc.documentType}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleDownload(selectedDoc)}
                    className="gap-2 text-xs"
                  >
                    <Download className="h-4 w-4" /> Download / Open PDF
                  </Button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t text-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedDoc(null)}
              >
                Close Preview
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleDownload(selectedDoc)}
                className="gap-1.5"
              >
                <Download className="h-3.5 w-3.5" /> Download Original
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

