// app/pay/[id]/page.tsx
"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInvoicePayment } from "@/hooks/queries/useInvoices";
import { Loader2 } from "lucide-react";

export default function PayPage({params}:{params:Promise<{ id: string }>}) {
  const { id } = React.use(params);
  const router = useRouter();
  const { initializeOnlinePayment, isInitializingPayment } = useInvoicePayment(id, id);

  useEffect(() => {
    // Trigger the payment flow as soon as the page loads
    initializeOnlinePayment();
  }, [initializeOnlinePayment]);

  // Optional: show a loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-2">Redirecting to payment gateway...</p>
    </div>
  );
}