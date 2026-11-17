import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/services/apiReports";

export const reportsKeys = {
  all: ["reports"] as const,
  overview: (params?: { from?: string; to?: string; serviceId?: string }) => 
    [...reportsKeys.all, "overview", params] as const,
  exportInvoices: (params?: { from?: string; to?: string }) => 
    [...reportsKeys.all, "export", "invoices", params] as const,
  exportReceipts: (params?: { from?: string; to?: string }) => 
    [...reportsKeys.all, "export", "receipts", params] as const,
};

// Hook for reports overview
export function useReportsOverview(params?: { from?: string; to?: string; serviceId?: string }) {
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: reportsKeys.overview(params),
    queryFn: () => reportsService.getReportsOverview(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Extract data from response
  const data = response || response; // Handle both response formats
  const stats = data?.stats;
  const byService = data?.byService || [];
  const invoices = data?.invoices || [];
  const receipts = data?.receipts || [];
  const period = data?.period;

  // Calculate byServiceType from byService (if needed for backward compatibility)
  const byServiceType = byService.map((service) => ({
    type: service.code || service.id,
    label: service.name,
    transactions: service.transactions,
    revenue: service.revenue,
  }));

  // Calculate byMethod from stats
  const byMethod = stats?.byMethod || {
    transfer: 0,
    pos: 0,
    cash: 0,
    online: 0,
  };

  // Calculate totals for summary
  const totalRevenue = stats?.totalRevenue || 0;
  const totalInvoices = invoices.length;
  const totalReceipts = receipts.length;
  
  // Get top performing service
  const topService = byService[0];
  
  // Get top revenue method
  const topMethod = Object.entries(byMethod)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({ method: key, revenue: value }))[0];

  return {
    // Raw data
    data,
    stats,
    byService, // Main service breakdown
    byServiceType, // For backward compatibility
    byMethod, // Payment method breakdown
    invoices,
    receipts,
    period,
    
    // Computed values
    totalRevenue,
    totalInvoices,
    totalReceipts,
    topService,
    topMethod,
    
    // Status
    isLoading,
    error,
    refetch,
    
    // Helper: Check if data is empty
    isEmpty: invoices.length === 0 && receipts.length === 0,
  };
}

// Hook for exporting invoices
export function useExportInvoices() {
  const useExport = (params?: { from?: string; to?: string }, enabled: boolean = true) => {
    return useQuery({
      queryKey: reportsKeys.exportInvoices(params),
      queryFn: () => reportsService.exportInvoices(params),
      enabled,
      staleTime: 0, // Don't cache export data
    });
  };
  
  return { useExport };
}

// Hook for exporting receipts
export function useExportReceipts() {
  const useExport = (params?: { from?: string; to?: string }, enabled: boolean = true) => {
    return useQuery({
      queryKey: reportsKeys.exportReceipts(params),
      queryFn: () => reportsService.exportReceipts(params),
      enabled,
      staleTime: 0, // Don't cache export data
    });
  };
  
  return { useExport };
}

// Hook for CSV download helper
export function useReportsExport() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      console.warn("No data to export");
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle strings with commas
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(",")
      ),
    ];
    
    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return { downloadCSV };
}