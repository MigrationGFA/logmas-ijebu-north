"use client"
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {  Search, Phone, Mail, MapPin, Loader2, Building2 } from "lucide-react";
import { useFieldOfficerBusinesses } from "@/hooks/queries/useFieldOfficer";
import { useInvoices } from "@/hooks/queries/useInvoices";
import AddCustomerDialog from "@/components/field-officer/NewCustomer";
import { tokenManager } from "@/services/apiAuth";
import {  BusinessInvoice } from "@/services/apiFieldOfficer";
import { usePagination } from "@/hooks/usePagination";
import { ListPagination } from "@/components/ui/list-pagination";

export default function CustomersPage() {
  const user = tokenManager.getUser()
  const { useGetBusinesses, registerBusiness, isRegistering } = useFieldOfficerBusinesses(user?.role === "field_officer");
  const { data: businessesData, isLoading: businessesLoading } = useGetBusinesses();
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const [searchQuery, setSearchQuery] = useState("");

  const businesses = useMemo(() => businessesData ?? [], [businessesData]);
  // const invoices = invoicesData?.invoices || [];

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return businesses;
    
    return businesses.filter((business) =>
      (business.businessName + (business.ownerName ?? "") + (business?.ward?.name ?? ""))
        .toLowerCase()
        .includes(query)
    );
  }, [businesses, searchQuery]);

  const pagination = usePagination(filteredCustomers, 12, [searchQuery]);

  const isLoading = businessesLoading || invoicesLoading;

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Customers"
          subtitle="Citizens and businesses you've billed"
          action={<AddCustomerDialog/>}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  console.log(businesses,"businesses");
  

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Citizens and businesses you've billed"
        action={<AddCustomerDialog />}
      />
      
      <div className="mb-4 relative max-w-sm">
        <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, phone or business..."
          className="pl-8"
        />
      </div>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pagination.pageItems.map((business) => {
          // const businessInvoices = invoices.filter(
          //   (inv) => inv.customerId === business.id || inv.businessId === business.id
          // );
          const paidAmount = business?.invoices?.filter((i:BusinessInvoice) => i.status === "paid")
            .reduce((sum:number, i:BusinessInvoice) => sum + i.totalAmount, 0) ?? 0
          const totalInvoices = business?.invoices?.length;
          
          return (
            <Card
              key={business.id}
              className="p-5 bg-gradient-card border-border/40 hover:shadow-elegant transition-smooth"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/15 text-primary font-semibold">
                    {(business.businessName || business.ownerName)
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{business.businessName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    Owner: {business.ownerName}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-background p-2.5">
                  <div className="text-xs text-muted-foreground">Invoices</div>
                  <div className="font-semibold">{totalInvoices}</div>
                </div>
                <div className="rounded-lg bg-background p-2.5">
                  <div className="text-xs text-muted-foreground">Paid</div>
                  <div className="font-semibold">₦{(paidAmount / 1000).toFixed(0)}K</div>
                </div>
              </div>
              
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {business.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> {business.phone}
                  </div>
                )}
                {business.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> {business.email}
                  </div>
                )}
                {business.address && (
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-3 w-3" /> {business.address}
                  </div>
                )}
                {business.ward?.name && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3" /> Ward: {business.ward.name}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
        
        {filteredCustomers.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No customers found. Click &quot;Add Customer&quot; to register a new business.
          </div>
        )}
      </div>

      <ListPagination pagination={pagination} unit="customers" />
    </div>
  );
}

