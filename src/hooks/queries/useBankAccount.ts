import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  bankAccountService,
  type LgaBankAccount,
} from "@/services/apiBankAccount";
import { getPackEntry, PACK_KEYS } from "@/lib/offline/pack";

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

  // Offline fallback: the copy of the account saved into the device pack
  // on the last online dashboard visit. The live value always wins when
  // it arrives; the saved copy only shows when the live read cannot.
  const cachedQuery = useQuery({
    queryKey: [...bankAccountKeys.all, "cached"] as const,
    queryFn: () => getPackEntry<LgaBankAccount>(PACK_KEYS.bankAccount),
    retry: false,
    enabled,
  });

  return {
    bankAccount: query.data?.bankAccount ?? cachedQuery.data ?? null,
    isLoadingBankAccount: query.isLoading && cachedQuery.isLoading,
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
