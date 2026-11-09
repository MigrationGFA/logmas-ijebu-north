"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Landmark,
  Loader2,
  Plus,
  Send,
  User,
} from "lucide-react";
import { useCreateDemandNotice } from "@/hooks/queries/useDemandNotices";
import { LGA_CONFIG, getLgaServiceBanking } from "@/config/lga.config";
import { DemandNoticeRecord } from "@/services/apiDemandNotice";

interface IssueDemandNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (notice: DemandNoticeRecord) => void;
}

const APPLICABLE_SERVICES = [
  { code: "demand_notice", name: "Business Demand Notice", head: "2002 - Business & Commercial Demand Notices" },
  { code: "community_development_levy", name: "Community Development Levy", head: "2001 - Community Development Levy" },
  { code: "street_naming", name: "Street Naming & Property Numbering", head: "2006 - Urban Dev & Street Naming" },
  { code: "environmental_sanitation", name: "Sanitation & Public Health Levy", head: "1005 - Health & Sanitation" },
  { code: "haulage_fees", name: "Haulage & Heavy Transit Levy", head: "2002 - Haulage & Transit" },
  { code: "liquor_licence", name: "Liquor / Hospitality Assessment", head: "2003 - Excise & Trade" },
];

export default function IssueDemandNoticeModal({
  isOpen,
  onClose,
  onSuccess,
}: IssueDemandNoticeModalProps) {
  const createMutation = useCreateDemandNotice();

  const [payerType, setPayerType] = useState<"business" | "individual" | "property_owner">("business");
  const [payerName, setPayerName] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [ward, setWard] = useState(LGA_CONFIG.wards[0]?.name ?? "");
  const [address, setAddress] = useState("");
  const [serviceCode, setServiceCode] = useState("demand_notice");
  const [chargeDescription, setChargeDescription] = useState("Annual Municipal Business Premises Demand Notice");
  const [amountPayable, setAmountPayable] = useState("50000");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");

  const currentBanking = getLgaServiceBanking(serviceCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerName.trim() || !phone.trim() || !address.trim() || !amountPayable) {
      return;
    }

    const selectedService = APPLICABLE_SERVICES.find((s) => s.code === serviceCode);

    try {
      const res = await createMutation.mutateAsync({
        payerType,
        payerName: payerName.trim(),
        tradingName: tradingName.trim() || undefined,
        rcNumber: rcNumber.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        ward,
        address: address.trim(),
        serviceCode,
        revenueHead: selectedService?.head || "2002 - Demand Notices",
        chargeDescription: chargeDescription.trim(),
        assessmentItems: [
          {
            description: chargeDescription.trim(),
            amount: Number(amountPayable),
          },
        ],
        amountPayable: Number(amountPayable),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes: notes.trim() || undefined,
      });

      if (res?.data) {
        onSuccess(res.data.notice || res.data);
        onClose();
      }
    } catch (err) {
      // Handled by mutation toast
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Issue Statutory Demand Notice
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Create an official assessment notice with linked Providus Bank virtual settlement.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
          {/* Section 1: Payer Details */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" /> Liable Entity / Payer Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px]">Entity Category</Label>
                <Select
                  value={payerType}
                  onValueChange={(val: any) => setPayerType(val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Commercial Business / Enterprise</SelectItem>
                    <SelectItem value="property_owner">Property Owner / Tenement</SelectItem>
                    <SelectItem value="individual">Individual Payer / Resident</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <Label className="text-[11px]">
                  Legal Entity / Payer Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  placeholder="e.g. Dangote Cement Depot Ltd / Chief Kolawole Adeleke"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  className="h-8 text-xs bg-white mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px]">Trading / Signboard Name (if different)</Label>
                <Input
                  placeholder="e.g. Best Choice Supermarket"
                  value={tradingName}
                  onChange={(e) => setTradingName(e.target.value)}
                  className="h-8 text-xs bg-white mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px]">CAC / RC Registration No (optional)</Label>
                <Input
                  placeholder="e.g. RC 1492023 / BN 89201"
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value)}
                  className="h-8 text-xs bg-white mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px]">
                  Contact Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  placeholder="08029575973"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-8 text-xs bg-white mt-1 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="text-[11px]">Payer Email Address (for electronic notice delivery)</Label>
                <Input
                  type="email"
                  placeholder="billing@enterprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-8 text-xs bg-white mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px]">
                  {`Ward in ${LGA_CONFIG.identity.name} LGA`} <span className="text-red-500">*</span>
                </Label>
                <Select value={ward} onValueChange={setWard}>
                  <SelectTrigger className="h-8 text-xs bg-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LGA_CONFIG.wards.map((w) => (
                      <SelectItem key={w.id} value={w.name}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-3">
                <Label className="text-[11px]">
                  Physical Premises Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  placeholder="e.g. Street name, area, town, Ogun State"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-8 text-xs bg-white mt-1"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Assessment Particulars */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-700" /> Revenue Service & Assessment Particulars
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px]">Revenue Category</Label>
                <Select value={serviceCode} onValueChange={setServiceCode}>
                  <SelectTrigger className="h-8 text-xs bg-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPLICABLE_SERVICES.map((s) => (
                      <SelectItem key={s.code} value={s.code}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px]">
                  Amount Payable (NGN) <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  type="number"
                  min="500"
                  step="500"
                  value={amountPayable}
                  onChange={(e) => setAmountPayable(e.target.value)}
                  className="h-8 text-xs bg-white mt-1 font-mono font-bold text-emerald-900"
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="text-[11px]">Assessment Particulars / Line Description</Label>
                <Input
                  required
                  value={chargeDescription}
                  onChange={(e) => setChargeDescription(e.target.value)}
                  className="h-8 text-xs bg-white mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px]">Settlement Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-8 text-xs bg-white mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px]">Internal Auditor / Officer Note (optional)</Label>
                <Input
                  placeholder="e.g. Assessed under 2026 Commercial Band B"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-8 text-xs bg-white mt-1"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Allocated Providus Bank Account Preview */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 text-xs text-emerald-950">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
              <Landmark className="w-4 h-4 text-emerald-700" />
              Designated Providus Bank Virtual Account (Auto-Allocated)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white p-2.5 rounded border border-emerald-200 font-mono text-[11px] mt-1.5">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-sans">Bank:</span>
                <strong className="text-slate-900">{currentBanking.bankName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-sans">Account Name:</span>
                <strong className="text-slate-800 text-[10px] truncate block">
                  {currentBanking.accountName}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-sans">Account Number:</span>
                <strong className="text-emerald-800 font-bold">{currentBanking.accountNumber}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-sans">Service Code:</span>
                <strong className="text-slate-800">{currentBanking.serviceCode}</strong>
              </div>
            </div>
            <p className="text-[10px] text-emerald-800 mt-1.5 font-sans">
              The recipient will receive an official notice quoting this Providus Bank account. Automated reconciliation will confirm settlement upon payment.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold gap-1.5"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Issuing Notice...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Issue Demand Notice
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
