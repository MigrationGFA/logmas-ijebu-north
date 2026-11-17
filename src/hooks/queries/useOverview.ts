import { useQuery } from "@tanstack/react-query";
import {
  overviewService,
  Role,
  CitizenMetrics,
  DashboardMetrics,
  FieldOfficerMetrics,
  AuditorMetrics,
  CouncillorMetrics,
  TreasurerMetrics,
} from "@/services/apiOverview";
import { useAuth } from "./useAuth";

export const overviewKeys = {
  all: ["overview"] as const,
  dashboard: () => [...overviewKeys.all, "dashboard"] as const,
};

export function useOverview(userRole: Role) {
  // const { user } = useAuth();
  // const userRole = user?.role as Role;

  const {
    data: overviewData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: overviewKeys.dashboard(),
    queryFn: () => overviewService.getDashboardOverview(),
    // enabled: !!userRole,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  console.log(overviewData, "overviewData");
  // Type-safe getters for different roles
  const getCitizenMetrics = () => {
    if (userRole === "citizen" && overviewData?.metrics) {
      return {
        metrics: overviewData.metrics as unknown as CitizenMetrics,
        recentApplications: overviewData.recentApplications,
      };
    }
    return null;
  };

  const getBusinessMetrics = () => {
    if (userRole === "business_owner" && overviewData?.metrics) {
      return {
        metrics: overviewData.metrics,
        recentInvoices: overviewData.recentInvoices,
      };
    }
    return null;
  };

  const getManagementMetrics = () => {
    if (["lga_admin", "chairman"].includes(userRole)) {
      return overviewData?.metrics;
    }
    return null;
  };

const getTreasurerMetrics = () => {
  if (userRole === "treasurer" && overviewData) {
    return {
      metrics: overviewData.metrics as TreasurerMetrics,
      revenueTrendChart: overviewData.revenueTrendChart || [],
      categoryBreakdown: overviewData.categoryBreakdown || [],
    };
  }
  return null;
};

  const getCouncillorMetrics = () => {
    if (userRole === "ward_councillor" && overviewData) {
      return {
        metrics: overviewData.metrics as unknown as CouncillorMetrics,
        applications: overviewData.applications || [],
      };
    }
    return null;
  };

  const getAuditorMetrics = () => {
    if (userRole === "auditor" && overviewData) {
      return {
        metrics: overviewData.metrics as unknown as AuditorMetrics,
        anomalies: overviewData.anomalies || [],
        highValueTransactions: overviewData.highValueTransactions || [],
        recentAudits: overviewData.recentAudits || [],
      };
    }
    return null;
  };

  const getContractorData = () => {
    if (["agent", "contractor"].includes(userRole) && overviewData) {
      // console.log(overviewData,"contractorData")

      return {
        invoices: overviewData.invoices || [],
        receipts: overviewData.receipts || [],
        officers: overviewData.officers || [],
        revenueTrend: overviewData.revenueTrend || [],
      };
    }
    return null;
  };

  const getFieldOfficerMetrics = () => {
    if (userRole === "field_officer" && overviewData) {
      return {
        metrics: overviewData.metrics as unknown as FieldOfficerMetrics,
        recentInvoices: overviewData.recentInvoices || [],
      };
    }
    return null;
  };

  return {
    // Raw data
    overviewData,
    isLoading,
    error,
    refetch,
    userRole,

    // Type-safe getters
    citizenMetrics: getCitizenMetrics(),
    businessMetrics: getBusinessMetrics(),
    managementMetrics: getManagementMetrics(),
    councillorMetrics: getCouncillorMetrics(),
    contractorData: getContractorData(),
    fieldOfficerMetrics: getFieldOfficerMetrics(),
    treasurerMetrics: getTreasurerMetrics(),
    auditorMetrics: getAuditorMetrics(),
    // Helper flags
    isCitizen: userRole === "citizen",
    isBusinessOwner: userRole === "business_owner",
    isTreasurer: userRole === "treasurer",
    isLgaAdmin: userRole === "lga_admin",
    isChairman: userRole === "chairman",
    isWardCouncillor: userRole === "ward_councillor",
    isContractor: userRole === "contractor",
    isFieldOfficer: userRole === "field_officer",
  };
}
