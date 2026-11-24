/**
 * Card processing fee, mirrored from the backend GPay controller
 * (withCardProcessingFee in gpay.controller.ts). Card payments carry 1.5% on
 * top of the official amount; the backend is the charging authority and uses
 * this exact formula, so figures computed here for display match the charge.
 * Bank transfer payments never carry this fee.
 */
export const CARD_PROCESSING_FEE_RATE = 0.015;

const round2 = (n: number): number => Math.round(n * 100) / 100;

export function cardProcessingFee(baseAmount: number): number {
  return round2(baseAmount * CARD_PROCESSING_FEE_RATE);
}

export function cardChargeTotal(baseAmount: number): number {
  return round2(baseAmount + cardProcessingFee(baseAmount));
}
