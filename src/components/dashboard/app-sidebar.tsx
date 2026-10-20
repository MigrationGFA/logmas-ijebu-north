/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FileText,
  FilePlus2,
  CreditCard,
  Receipt,
  Users,
  Settings,
  ShieldCheck,
  Bell,
  MessageSquare,
  FileBadge,
  Newspaper,
  Tag,
  // ScrollText,
  // Building2,
  ScanLine,
  LogOut,
  ChevronUp,
  UserCog,
  BarChart3,
  Map,
  // Activity,
  Wallet,
  Briefcase,
  KeyRound,
  Stamp,
  // Search,
  AlertTriangle,
} from "lucide-react";

import {  ROLE_LABELS, type Role } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/queries/useAuth";
// import { tokenManager } from "@/services/apiAuth";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LGA_CONFIG } from "@/config";

type Item = { title: string; url: string; icon: any };

const NAV: Record<Role, { label: string; items: Item[] }[]> = {
  field_officer: [
    {
      label: "Operations",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Service Catalogue", url: "/dashboard/services", icon: FilePlus2 },
        { title: "Applications Registry", url: "/dashboard/applications", icon: Stamp },
        { title: "Issued Certificates", url: "/dashboard/certificates", icon: FileBadge },
        // { title: "Generate Invoice", url: "/dashboard/invoices/new", icon: FileText },
        { title: "All Invoices", url: "/dashboard/invoices", icon: Receipt },
        // { title: "Trade Permits", url: "/dashboard/permits", icon: Stamp },
        // { title: "New Permit Application", url: "/dashboard/permits/new", icon: FilePlus2 },
        { title: "Verify Payment", url: "/dashboard/verify-payment", icon: ScanLine },
        { title: "Receipts", url: "/dashboard/receipts", icon: Receipt },
        // { title: "Customers", url: "/dashboard/customers", icon: Users },
        { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
        { title: "Settings", url: "/dashboard/settings", icon: Settings },
      ],
    },
  ],
  // agent: [
  //   { label: "My Scope", items: [
  //     { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  //     { title: "My Field Officers", url: "/dashboard/field-officers", icon: UserCog },
  //     { title: "Collections Feed", url: "/dashboard/receipts", icon: Receipt },
  //     { title: "Active Invoices", url: "/dashboard/invoices", icon: FileText },
  //     { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  //     { title: "Settings", url: "/dashboard/settings", icon: Settings },
  //   ]},
  // ],

  contractor: [
    {
      label: "Workspace",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        // { title: "Generate Invoice", url: "/dashboard/invoices/new", icon: FilePlus2 },
        { title: "All Invoices", url: "/dashboard/invoices", icon: FileText },
        { title: "Field Officers", url: "/dashboard/field-officers", icon: UserCog },
        // { title: "Verify Payment", url: "/dashboard/verify-payment", icon: ScanLine },
        { title: "Receipts", url: "/dashboard/receipts", icon: Receipt },
        // { title: "Customers", url: "/dashboard/customers", icon: Users },
        { title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
        { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
        { title: "Settings", url: "/dashboard/settings", icon: Settings },
      ],
    },
  ],
  citizen: [
    {
      label: "My Account",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Government Services", url: "/dashboard/services", icon: Briefcase },
        { title: "My Applications", url: "/dashboard/applications", icon: FileBadge },
        { title: "My Certificates", url: "/dashboard/certificates", icon: Stamp },
        { title: "Payment & Bills", url: "/dashboard/invoices", icon: CreditCard },
        { title: "Receipts", url: "/dashboard/receipts", icon: Receipt },
        { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
        { title: "Raise Complaint", url: "/dashboard/complaints", icon: MessageSquare },
        { title: "Settings", url: "/dashboard/settings", icon: Settings },
      ],
    },
  ],
  business_owner: [
    {
      label: "Business",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Government Services", url: "/dashboard/services", icon: Briefcase },
        { title: "My Applications", url: "/dashboard/applications", icon: FileBadge },
        { title: "Certificates & Licences", url: "/dashboard/certificates", icon: Stamp },
        { title: "My Invoices", url: "/dashboard/invoices", icon: FileText },
        // { title: "Trade Permits", url: "/dashboard/permits", icon: Stamp },
        // { title: "Apply for Permit", url: "/dashboard/permits/new", icon: FilePlus2 },
        { title: "Receipts", url: "/dashboard/receipts", icon: Receipt },
        { title: "Complaints", url: "/dashboard/complaints", icon: MessageSquare },
        { title: "News & Updates", url: "/dashboard/news", icon: Newspaper },
        { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
        { title: "Settings", url: "/dashboard/settings", icon: Settings },
      ],
    },
  ],
  treasurer: [
    {
      label: "Finance & Revenue",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Payment Confirmations", url: "/dashboard/payment-confirmations", icon: Wallet },
        // { title: "Revenue Analytics", url: "/dashboard/reports", icon: BarChart3 },
        { title: "Service Pricing", url: "/dashboard/pricing", icon: Tag },
        // { title: "Trade Permits", url: "/dashboard/permits", icon: Stamp },
        { title: "Reconciliation", url: "/dashboard/invoices", icon: Wallet },
        // { title: "Payments", url: "/dashboard/invoices", icon: CreditCard },
        // { title: "Receipts", url: "/dashboard/receipts", icon: Receipt },
        // { title: "Issued Certificates", url: "/dashboard/certificates", icon: FileBadge },
        { title: "Financial Reports", url: "/dashboard/reports", icon: FileText },
        { title: "Contractors Billing", url: "/dashboard/field-officers", icon: Briefcase },
        { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
        { title: "Settings", url: "/dashboard/settings", icon: Settings },
      ],
    },
  ],
  auditor: [
    {
      label: "Audit & Oversight",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Revenue Audit", url: "/dashboard/reports", icon: BarChart3 },
        // { title: "Payments Monitoring", url: "/dashboard/invoices", icon: CreditCard },
        // { title: "Receipts Verification", url: "/dashboard/receipts", icon: Receipt },
        { title: "Invoice Audit", url: "/dashboard/invoices", icon: FileText },
        { title: "Certificates Registry", url: "/dashboard/certificates", icon: FileBadge },
        // { title: "Trade Permits", url: "/dashboard/permits", icon: Stamp },
        // { title: "Field Officer Activities", url: "/dashboard/field-officers", icon: UserCog },
        // { title: "Contractor Collections", url: "/dashboard/contractors", icon: Briefcase },
        { title: "Audit Logs", url: "/dashboard/audit-logs", icon: AlertTriangle },
        { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
        { title: "Settings", url: "/dashboard/settings", icon: Settings },
      ],
    },
  ],
  lga_admin: [
    {
      label: "Administration",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        // { title: "Service Catalogue", url: "/dashboard/services", icon: Briefcase },
        { title: "Service Applications", url: "/dashboard/applications", icon: FileBadge },
        { title: "Issued Certificates", url: "/dashboard/certificates", icon: Stamp },
        // { title: "Trade Permits", url: "/dashboard/permits", icon: Stamp },
        // { title: "Ward Management", url: "/dashboard/wards", icon: Map },
        { title: "Account Management", url: "/dashboard/accounts", icon: KeyRound },
        // { title: "Manage Users", url: "/dashboard/customers", icon: Users },
        // { title: "Contractors", url: "/dashboard/contractors", icon: Briefcase },
        { title: "Field Officers", url: "/dashboard/field-officers", icon: UserCog },
        // { title: "Audit Logs", url: "/dashboard/audit-logs", icon: AlertTriangle },
        { title: "Complaints", url: "/dashboard/complaints", icon: MessageSquare },
        { title: "News & Updates", url: "/dashboard/news", icon: Newspaper },
        { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
        { title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
        { title: "Settings", url: "/dashboard/settings", icon: Settings },
      ],
    },
  ],

  ward_councillor: [
    {
      label: "Ward Office",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "State of Origin Reviews", url: "/dashboard/applications", icon: FileBadge },
        { title: "Ward Certificates", url: "/dashboard/certificates", icon: Stamp },
        { title: "Ward Complaints", url: "/dashboard/complaints", icon: MessageSquare },
        { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
        { title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
        { title: "Settings", url: "/dashboard/settings", icon: Settings },
      ],
    },
  ],
  chairman: [
    {
      label: "Executive",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Revenue Overview", url: "/dashboard/reports", icon: BarChart3 },
        // { title: "Trade Permits Overview", url: "/dashboard/permits", icon: Stamp },
        { title: "Application Overview", url: "/dashboard/applications", icon: FileBadge },
        { title: "Certificates Registry", url: "/dashboard/certificates", icon: Stamp },
        { title: "Complaints Overview", url: "/dashboard/complaints", icon: MessageSquare },
        // { title: "Ward Performance", url: "/dashboard/customers", icon: Activity },
        // { title: "Audit Logs", url: "/dashboard/audit-logs", icon: AlertTriangle },
        // { title: "Reports", url: "/dashboard/reports", icon: FileText },
        { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
        { title: "Profile Settings", url: "/dashboard/settings", icon: Settings },
      ],
    },
  ],
  
  super_admin: [
    {
      label: "Platform",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        // { title: "Manage LGAs", url: "/dashboard/customers", icon: Building2 },
        { title: "Ward Management", url: "/dashboard/wards", icon: Map },
        { title: "Account Management", url: "/dashboard/accounts", icon: KeyRound },
        { title: "Global Configurations", url: "/dashboard/pricing", icon: Tag },
        { title: "Certificates Registry", url: "/dashboard/certificates", icon: FileBadge },
        { title: "User Management", url: "/dashboard/field-officers", icon: Users },
        { title: "System Analytics", url: "/dashboard/reports", icon: BarChart3 },
        { title: "Trade Permits", url: "/dashboard/permits", icon: Stamp },
        { title: "Audit Logs", url: "/dashboard/audit-logs", icon: AlertTriangle },

        { title: "Platform Settings", url: "/dashboard/settings", icon: Settings },
      ],
    },
  ],
};

export function AppSidebar() {
  const {  logout,isLoggingOut,user } = useAuth();
  // const user = tokenManager.getUser()
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = usePathname()
 if (!user || isLoggingOut) return null;
  // console.log(path,"path")

  // console.log(user, "user in sidebar");
  const groups = NAV[user?.role as Role];
  const initials = user?.firstName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/40">
        <Link href="/" className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-gold flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4 text-gold-foreground" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-bold text-sidebar-foreground text-sm">PORTAL</div>
              <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/70">
              {LGA_CONFIG.identity.name} Lga
              </div>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const active =
                    item.url === "/dashboard" ? path === "/dashboard" : path===item.url;
                    // item.url === "/dashboard" ? path === "/dashboard" : path.includes(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link href={item.url} className="flex items-center gap-2.5">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/40">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 h-auto py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-gold text-gold-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex-1 text-left leading-tight overflow-hidden">
                    <div className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</div>
                    <div className="text-[10px] opacity-70 truncate">{ROLE_LABELS[user?.role]}</div>
                  </div>
                  <ChevronUp className="h-3.5 w-3.5 opacity-70" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/">Public site</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-destructive" disabled={isLoggingOut}>
              <LogOut className="h-3.5 w-3.5 mr-2" /> {isLoggingOut ? "Logging out..." : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
