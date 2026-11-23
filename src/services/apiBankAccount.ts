import { api } from "../lib/api";

/**
 * The LGA collection bank account (FO-only services): the single account
 * kept in the database and managed by treasurer/admin in Settings. The
 * FO invoice page reads it to show payers where to transfer.
 */
export interface LgaBankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const bankAccountService = {
  getBankAccount: async (): Promise<{ bankAccount: LgaBankAccount | null }> => {
    return await api.get<{ bankAccount: LgaBankAccount | null }>("/bank-account");
  },

  saveBankAccount: async (payload: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  }): Promise<{ bankAccount: LgaBankAccount }> => {
    return await api.put<{ bankAccount: LgaBankAccount }>(
      "/bank-account",
      payload,
    );
  },
};
