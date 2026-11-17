import { api } from "../lib/api";

// Types based on your controller
export type ComplaintStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed";

export interface ComplaintResponse {
  id: string;
  message: string;
  responderId: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  category?: string;
  wardId: string;
  raisedById:string;
  ward?: {
    id: string;
    name: string;
    code: string;
  };
  raisedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  responses?: ComplaintResponse[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface RaiseComplaintData {
  title: string;
  description: string;
  // wardId: string;
  category: string;
}

export interface RespondToComplaintData {
  message: string;
}

export interface AssignComplaintData {
  assignedToId: string;
  // wardId: string;
}

export interface UpdateStatusData {
  status: ComplaintStatus;
  resolutionNote?: string;
}

export interface ComplaintStats {
  total: number;
  breakdown: {
    open: number;
    assigned: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
}

export interface PaginatedResponse<T> {
  complaints: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UpdateComplaintData {
  assignedToId?: string;
  status?: string;
  resolutionNote?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: null;
  error: null;
}

// Service functions
export const complaintsService = {
  // Citizen endpoints
  raiseComplaint: (data: RaiseComplaintData) =>
    api.post<Complaint>("/complaints", data),

  getMyComplaints: (params?: {
    status?: ComplaintStatus;
    page?: number;
    limit?: number;
  }) => api.get<Complaint[]>("/complaints/my", { params }),

  getMyComplaintById: (id: string) =>
    api.get<Complaint>(`/complaints/my/${id}`),

  // Ward Councillor endpoints
  getWardComplaints: (params?: {
    status?: ComplaintStatus;
    page?: number;
    limit?: number;
  }) => api.get<PaginatedResponse<Complaint>>("/complaints/ward", { params }),

  citizenRespond: (id: string, data: RespondToComplaintData) =>
    api.post<ComplaintResponse>(`/complaints/my/${id}/respond`, data),

  wardCouncillorRespond: (id: string, data: RespondToComplaintData) =>
    api.post<ComplaintResponse>(`/complaints/ward/${id}/respond`, data),

  // LGA Admin endpoints
  getAllComplaints: (params?: {
    status?: ComplaintStatus;
    wardId?: string;
    page?: number;
    limit?: number;
  }) => api.get<Complaint[]>("/complaints/admin", { params }),
  updateComplaint: (id: string, data: UpdateComplaintData) =>
    api.patch<Complaint>(`/complaints/admin/${id}`, data),

  getComplaintById: (id: string) =>
    api.get<Complaint>(`/complaints/admin/${id}`),

  assignComplaint: (id: string, data: AssignComplaintData) =>
    api.patch<Complaint>(`/complaints/admin/${id}/assign`, data),

  updateComplaintStatus: (id: string, data: UpdateStatusData) =>
    api.patch<Complaint>(`/complaints/admin/${id}/status`, data),

  adminRespond: (id: string, data: RespondToComplaintData) =>
    api.post<ComplaintResponse>(`/complaints/admin/${id}/respond`, data),

  // Statistics
  getComplaintStats: () => api.get<ComplaintStats>("/complaints/stats"),
};
