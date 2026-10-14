/* eslint-disable @typescript-eslint/no-explicit-any */
import { services } from "@/services/apiServices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";

export const serviceKey = {
  all: ["services"] as const,
  getBySlug: (slug: string) => [...serviceKey.all, slug] as const,
};

// Hook for citizen operations
export function useServices() {
  const queryClient = useQueryClient();

  // Get all services
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: serviceKey.all,
    queryFn: () => services.listServices(),
    retry: 1,
  });

  const servicesList = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    const LGA_SERVICES_ICONS = [
      { id: "certificate_of_origin", name: "State of Origin", icon: "FileBadge" },
      { id: "club_registration", name: "Certificate of Club Registration", icon: "Users" },
      { id: "cda_registration", name: "Certificate of Community Development Association Registration", icon: "Building2" },
      { id: "farmers_registration", name: "Certificate of Farmers Registration", icon: "Sprout" },
      { id: "environmental_sanitation", name: "Certificate of Environmental Sanitation Compliance", icon: "ShieldCheck" },
      { id: "tenement_rate", name: "Tenement Rate", icon: "Home" },
      { id: "haulage_fees", name: "Haulage Fees", icon: "Truck" },
      { id: "liquor_licence", name: "Liquor Licence Fees", icon: "Beer" },
      { id: "viewing_centre_licence", name: "Viewing Centre Licence Fee", icon: "Tv" },
      { id: "quarry_permit", name: "Quarry Fees and Permits", icon: "Pickaxe" },
      { id: "street_naming", name: "Street Naming and Property Numbering", icon: "MapPin" },
      { id: "kiosk_licence", name: "Kiosk Licence", icon: "Store" }
    ];
    
    return data.map((service: any) => ({
      ...service,
      icon: LGA_SERVICES_ICONS.find(s => s.id === service.id)?.icon || null
    }));
  }, [data]);

  // Get single application by ID or slug
  const useGetServiceBySlug = (slug: string) => {
    return useQuery({
      queryKey: serviceKey.getBySlug(slug),
      queryFn: () => services.getServiceBySlug(slug),
      enabled: !!slug,
    });
  };

  return {
    services: servicesList,
    rawData: data,
    isLoading,
    error,
    refetch,
    useGetServiceBySlug,
  };
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => services.createService(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: serviceKey.all });
      toast.success(
        `Statutory Service "${data?.name || data?.data?.name || "New Service"}" created successfully!`,
      );
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create statutory service");
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      serviceId,
      data,
    }: {
      serviceId: string;
      data: any;
    }) => services.updateService(serviceId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: serviceKey.all });
      toast.success("Service and fee configuration updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update service");
    },
  });
}

// Hook for public verification (no auth)
// export function useVerifyCertificate() {
//   const useVerify = (code: string, enabled: boolean = true) => {
//     return useQuery({
//       queryKey: serviceKey.verification(code),
//       queryFn: () => stateOfOriginService.verifyCertificate(code),
//       enabled: enabled && !!code,
//       retry: 1,
//     });
//   };

//   return { useVerify };
// }
// export function useGetCertificateData() {
//   const useCertificate = (applicationId: string, enabled: boolean = true) => {
//     return useQuery({
//       queryKey: serviceKey.certificate(applicationId),
//       queryFn: () => stateOfOriginService.getCertificate(applicationId),
//       enabled: enabled && !!applicationId,
//       retry: 1,
//     });
//   };

//   return { useCertificate };
// }
