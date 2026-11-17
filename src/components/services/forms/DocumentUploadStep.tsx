"use client";

import React, { useRef } from "react";
import {
  Upload,
  FileCheck,
  FileText,
  Trash2,
  AlertCircle,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface DocumentSpec {
  id: string; // Machine-readable key, e.g. "passport_photo", "nin_slip"
  label: string; // Human-friendly display label, e.g. "Passport Photograph"
  description: string;
  required: boolean;
  acceptedFormats?: string;
}

export interface UploadedFileMeta {
  file?: File;
  name: string;
  size?: number;
  type?: string;
  previewUrl?: string;
}

interface DocumentUploadStepProps {
  documents: DocumentSpec[];
  uploadedFiles: Record<string, string | UploadedFileMeta>;
  onFileUpload: (docId: string, fileNameOrMeta: string | UploadedFileMeta, actualFile?: File) => void;
  onFileRemove: (docId: string) => void;
  serviceName: string;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];

export function DocumentUploadStep({
  documents,
  uploadedFiles,
  onFileUpload,
  onFileRemove,
  serviceName,
  disabled = false,
}: DocumentUploadStepProps) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const validateFile = (file: File): boolean => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`Invalid file format: ${file.name}. Only JPG, PNG, and PDF documents are permitted.`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File "${file.name}" exceeds the maximum 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return false;
    }
    return true;
  };

  const handleNativeFileChange = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!validateFile(file)) {
        e.target.value = "";
        return;
      }

      const meta: UploadedFileMeta = {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: URL.createObjectURL(file),
      };

      onFileUpload(docId, meta, file);
      toast.success(`Attached ${file.name}`);
    }
  };

  const handleDrop = (docId: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!validateFile(file)) return;

      const meta: UploadedFileMeta = {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: URL.createObjectURL(file),
      };

      onFileUpload(docId, meta, file);
      toast.success(`Attached ${file.name}`);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const simulateQuickUpload = (docId: string, docLabel: string) => {
    const isImageDoc = docId.toLowerCase().includes("photo") || docId.toLowerCase().includes("passport") || docId.toLowerCase().includes("image");
    const ext = isImageDoc ? "jpg" : "pdf";
    const sampleName = `${docId}_sample.${ext}`;
    const mimeType = isImageDoc ? "image/jpeg" : "application/pdf";
    
    // Create real File object for multipart
    const sampleFile = new File([new Blob([`SAMPLE STATUTORY DOCUMENT FOR ${docLabel} (${docId})`])], sampleName, {
      type: mimeType,
    });

    const meta: UploadedFileMeta = {
      file: sampleFile,
      name: sampleName,
      size: 145000,
      type: mimeType,
    };

    onFileUpload(docId, meta, sampleFile);
    toast.success(`Attached sample document for ${docLabel}`);
  };

  const missingRequired = documents.filter((d) => {
    const val = uploadedFiles[d.id];
    if (!val) return d.required;
    if (typeof val === "string") return !val && d.required;
    return !val.name && d.required;
  });

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h4 className="text-base font-bold text-foreground">
          Statutory Supporting Documents
        </h4>
        <p className="text-xs text-muted-foreground mt-1">
          In accordance with the Local Government statutory bye-laws, please upload clear, legible copies of all required supporting documents for <strong className="text-foreground">{serviceName}</strong>. Allowed formats: JPG, PNG, PDF (Max 5 MB per file).
        </p>
      </div>

      {missingRequired.length > 0 ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Required Documents Remaining ({missingRequired.length}):</span>
            <p className="mt-0.5 text-muted-foreground">
              Please attach {missingRequired.map((d) => d.label).join(", ")} before proceeding to review & submission.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 text-xs text-emerald-900 dark:text-emerald-200">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold">All mandatory documents attached!</span>
            <p className="text-muted-foreground">
              Your documentation is ready for statutory verification by the LGA reviewing officers.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => {
          const rawVal = uploadedFiles[doc.id];
          const isUploaded = !!rawVal && (typeof rawVal === "string" ? rawVal.length > 0 : !!rawVal.name);
          const fileName = typeof rawVal === "string" ? rawVal : rawVal?.name || "";
          const fileSize = typeof rawVal === "object" && rawVal?.size ? rawVal.size : null;

          return (
            <div
              key={doc.id}
              onDrop={(e) => handleDrop(doc.id, e)}
              onDragOver={handleDragOver}
              className={`border rounded-xl p-4 transition-all flex flex-col justify-between ${
                isUploaded
                  ? "bg-emerald-500/5 border-emerald-500/30 shadow-xs"
                  : doc.required
                  ? "bg-card border-border/80 hover:border-primary/50"
                  : "bg-muted/20 border-dashed border-border"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-lg ${
                        isUploaded
                          ? "bg-emerald-500/20 text-emerald-600"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-foreground flex items-center gap-1.5 flex-wrap">
                        <span>{doc.label}</span>
                        {doc.required ? (
                          <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 border-red-200 px-1 py-0">
                            Required *
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground px-1 py-0">
                            Optional
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {doc.description}
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground/80 block mt-0.5">
                        Field Key: {doc.id}
                      </span>
                    </div>
                  </div>
                </div>

                {isUploaded && (
                  <div className="mt-3 bg-background border border-emerald-500/20 rounded-lg p-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-mono font-medium truncate text-foreground">
                        {fileName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {fileSize && (
                        <span className="text-[10px] text-muted-foreground">
                          {(fileSize / 1024).toFixed(0)} KB
                        </span>
                      )}
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-[10px] border-emerald-300">
                        Attached
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2">
                <input
                  type="file"
                  id={`file-input-${doc.id}`}
                  ref={(el) => {
                    fileInputRefs.current[doc.id] = el;
                  }}
                  onChange={(e) => handleNativeFileChange(doc.id, e)}
                  accept={doc.acceptedFormats || ".pdf,.jpg,.jpeg,.png"}
                  className="hidden"
                />

                {isUploaded ? (
                  <div className="flex items-center justify-between w-full">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRefs.current[doc.id]?.click()}
                      className="text-xs h-7 text-primary hover:text-primary/80 px-2"
                    >
                      Replace File
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onFileRemove(doc.id)}
                      className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 px-2 gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRefs.current[doc.id]?.click()}
                      className="text-xs h-8 gap-1.5 flex-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Choose File
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => simulateQuickUpload(doc.id, doc.label)}
                      className="text-[11px] h-8 text-muted-foreground hover:text-foreground px-2.5 shrink-0"
                    >
                      Attach Sample
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
