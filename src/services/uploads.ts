import { api } from "@/lib/api";

export type UploadType =
  | "passports"
  | "complaints"
  | "permits"
  | "receipts"
  | "general"
  | "news";

export interface UploadResult {
  url: string;
  key?: string;
  mime?: string;
  size?: number;
}

export const uploadsService = {
  uploadFile: (file: File, type: UploadType): Promise<UploadResult> => {
    const fd = new FormData();
    fd.append("file", file);
    return api.upload<UploadResult>(`/uploads?type=${encodeURIComponent(type)}`, fd);
  },
};
