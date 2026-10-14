"use client";
import React, { useState } from "react";
import { PageHeader } from "@/components/dashboard/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ServiceType,
} from "@/config/lgaServices";
import Link from "next/link";
import {
  FileBadge,
  Users,
  Building2,
  Sprout,
  ShieldCheck,
  Home,
  Truck,
  Beer,
  Tv,
  Pickaxe,
  MapPin,
  Store,
  Search,
  Clock,
  ArrowRight,
  Filter,
  Plus,
  Edit3,
} from "lucide-react";
import { useServices } from "@/hooks/queries/useServices";
import { tokenManager } from "@/services/apiAuth";
import { CreateServiceModal } from "@/components/treasurer/CreateServiceModal";
import { EditServiceModal } from "@/components/treasurer/EditServiceModal";
import { ErrorState } from "@/components/ui/ErrorState";
import { LGA_CONFIG } from "@/config/lga.config";

const ICON_MAP: Record<string, any> = {
  FileBadge,
  Users,
  Building2,
  Sprout,
  ShieldCheck,
  Home,
  Truck,
  Beer,
  Tv,
  Pickaxe,
  MapPin,
  Store,
};

export default function ServicesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const currentUser = tokenManager.getUser();
  const canManageServices =
    currentUser?.role === "treasurer" ||
    currentUser?.role === "lga_admin" ||
    currentUser?.role === "super_admin";

  const categories = [
    "All",
    "Certificates",
    "Community & Agriculture",
    "Rates & Levies",
    "Licences & Permits",
    "Urban Development",
  ];

  const { services, isLoading, error, refetch } = useServices();

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`${LGA_CONFIG.identity.name} Government Services Catalogue`}
          subtitle="Select an official local government service to apply, obtain statutory assessments, or pay levies online."
        />
        <ErrorState
          title="Failed to load services catalogue"
          error={error}
          refetch={refetch}
        />
      </div>
    );
  }

  const filteredServices = services
    .filter((service) => {
      const matchesSearch =
        service.name.toLowerCase().includes(search.toLowerCase()) ||
        service.description.toLowerCase().includes(search.toLowerCase()) ||
        service.revenueHead.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || service.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a: any, b: any) => {
      const aIsCoo = a.id === "certificate_of_origin" || a.code === "certificate_of_origin";
      const bIsCoo = b.id === "certificate_of_origin" || b.code === "certificate_of_origin";
      if (aIsCoo && !bIsCoo) return -1;
      if (!aIsCoo && bIsCoo) return 1;
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title={`${LGA_CONFIG.identity.name} Government Services Catalogue`}
          subtitle="Select an official local government service to apply, obtain statutory assessments, or pay levies online."
        />

        {canManageServices && (
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-primary text-primary-foreground gap-1.5 font-semibold text-xs h-9 shrink-0 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Create Service
          </Button>
        )}
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services, revenue heads, or permits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:inline" />
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="whitespace-nowrap text-xs"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? // Skeleton loading cards - 3 cards
            Array.from({ length: 3 }).map((_, index) => (
              <Card
                key={`skeleton-${index}`}
                className="flex flex-col justify-between hover:shadow-md transition-all border-border/60 bg-gradient-card animate-pulse"
              >
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground border border-muted/30">
                      <div className="h-6 w-6" />
                    </div>
                    <div className="h-5 w-16 bg-muted/50 rounded-full" />
                  </div>

                  <div className="h-7 w-3/4 bg-muted/50 rounded-lg pt-1" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-full bg-muted/50 rounded" />
                    <div className="h-3 w-2/3 bg-muted/50 rounded" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 text-xs py-2">
                  <div className="p-2.5 rounded-md bg-muted/40 space-y-2">
                    <div className="flex justify-between">
                      <div className="h-3 w-24 bg-muted/50 rounded" />
                      <div className="h-3 w-32 bg-muted/50 rounded" />
                    </div>
                    <div className="flex justify-between">
                      <div className="h-3 w-24 bg-muted/50 rounded" />
                      <div className="h-3 w-20 bg-muted/50 rounded" />
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <div className="h-3 w-28 bg-muted/50 rounded" />
                      <div className="h-5 w-28 bg-muted/50 rounded-full" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="h-3 w-32 bg-muted/50 rounded" />
                    <div className="h-3 w-40 bg-muted/50 rounded" />
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <div className="w-full h-9 bg-muted/50 rounded-md" />
                </CardFooter>
              </Card>
            ))
          : filteredServices.map((service: ServiceType) => {
              const IconComponent = ICON_MAP[service.icon] || FileBadge;

              return (
                <Card
                  key={service.id}
                  className="flex flex-col justify-between hover:shadow-md transition-all border-border/60 bg-gradient-card"
                >
                  <CardHeader className="space-y-2 pb-3">
                    <div className="flex justify-between items-start">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-semibold"
                      >
                        {service.category}
                      </Badge>
                    </div>

                    <CardTitle className="text-lg font-bold leading-tight pt-1">
                      {service.name}
                    </CardTitle>

                    <CardDescription className="text-xs line-clamp-2">
                      {service.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 text-xs py-2">
                    <div className="p-2.5 rounded-md bg-muted/40 space-y-1">
                      <div className="flex justify-between text-muted-foreground font-medium">
                        <span>Revenue Head:</span>
                        <span className="text-foreground font-mono text-[11px]">
                          {service.revenueHead}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground font-medium">
                        <span>Configured Fee:</span>
                        <span className="text-foreground font-bold">
                          ₦{service?.feeConfig?.amount?.toLocaleString() ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground items-center pt-1">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="h-3 w-3 text-primary" />{" "}
                          {service.estimatedDays} day
                          {service.estimatedDays > 1 ? "s" : ""} processing
                        </span>
                        {service.requiresInspection && (
                          <Badge
                            variant="outline"
                            className="text-[9px] border-amber-500/40 text-amber-600 dark:text-amber-400"
                          >
                            Requires Inspection
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        Required Documents ({service.requirements.length}):
                      </span>{" "}
                      {service.requirements.slice(0, 2).join(", ")}
                      {service.requirements.length > 2 && "..."}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 flex gap-2">
                    {canManageServices && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingService(service);
                          setEditModalOpen(true);
                        }}
                        className="text-xs px-2.5 h-9 gap-1 text-primary border-primary/30 hover:bg-primary/10"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    )}
                    <Button
                      asChild
                      className="flex-1 gap-1.5 text-xs font-semibold h-9"
                      size="sm"
                    >
                      <Link href={`/dashboard/services/${service.id}`}>
                        Apply & Settle Fee{" "}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
      </div>

      {!isLoading && filteredServices.length === 0 && (
        <Card className="p-12 text-center bg-muted/20">
          <p className="text-muted-foreground font-medium">
            No government services found matching your criteria.
          </p>
          <Button
            variant="outline"
            className="mt-3 text-xs"
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
            }}
          >
            Reset Filters
          </Button>
        </Card>
      )}

      {/* Treasurer / Admin Create Service Modal */}
      <CreateServiceModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => refetch()}
      />

      {/* Treasurer / Admin Edit Service Modal */}
      <EditServiceModal
        service={editingService}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
