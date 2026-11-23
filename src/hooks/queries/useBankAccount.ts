import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bankAccountService } from "@/services/apiBankAccount";

export const bankAccountKeys = {
  all: ["bank-account"] as const,
};

export function useBankAccount(enabled: boolean = true) {
  const query = useQuery({
    queryKey: bankAccountKeys.all,
    queryFn: () => bankAccountService.getBankAccount(),
    retry: false,
    enabled,
  });

  return {
    bankAccount: query.data?.bankAccount ?? null,
    isLoadingBankAccount: query.isLoading,
  };
}

export function useSaveBankAccount() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: {
      bankName: string;
      accountName: string;
      accountNumber: string;
    }) => bankAccountService.saveBankAccount(payload),
    onSuccess: () => {
      toast.success("Collection bank account saved.");
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.all });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Could not save the bank account");
    },
  });

  return {
    saveBankAccount: mutation.mutate,
    saveBankAccountAsync: mutation.mutateAsync,
    isSavingBankAccount: mutation.isPending,
  };
}
