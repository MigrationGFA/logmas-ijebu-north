"use client"
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Bell, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useNotifications } from "@/hooks/queries/useNotifications";
import { OnboardingIndicator } from "@/components/dashboard/OnboardingIndicator";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { OfflineRuntime } from "@/components/offline/OfflineRuntime";
import { OfflineStatusBar } from "@/components/offline/OfflineStatusBar";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const crumbs = path?.split("/").filter(Boolean);
   const { unreadCount, isLoading } = useNotifications({ limit: 1 });

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-muted/30">
          <AppSidebar />
          <SidebarInset>
            <header className="sticky top-0 z-30 h-14 flex items-center gap-3 border-b border-border/60 bg-background/80 backdrop-blur px-4">
              <SidebarTrigger />
              <nav className="hidden md:flex items-center text-sm text-muted-foreground gap-1.5">
                {crumbs?.map((c, i) => (
                  <span key={c + i} className="flex items-center gap-1.5">
                    {i > 0 && <span className="opacity-50">/</span>}
                    <span
                      className={
                        i === crumbs.length - 1
                          ? "text-foreground font-medium capitalize"
                          : "capitalize"
                      }
                    >
                      {c.replace(/-/g, " ")}
                    </span>
                  </span>
                ))}
              </nav>
              <div className="ml-auto flex items-center gap-2">
                <OfflineStatusBar />
                <LanguageSwitcher variant="compact" />
                <div className="relative hidden sm:block">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="h-9 pl-8 w-48 md:w-64 bg-muted/50"
                  />
                </div>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="relative"
                >
                  <Link href="/dashboard/notifications">
                    <Bell className="h-4 w-4" />
                    {!isLoading && unreadCount > 0 && (
                      <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] bg-destructive">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                    {isLoading && (
                      <Loader2 className="absolute -top-0.5 -right-0.5 h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                  </Link>
                </Button>
              </div>
            </header>
            <OnboardingIndicator />
            <OfflineRuntime />
            <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
