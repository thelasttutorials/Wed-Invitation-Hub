import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Separator } from "@/components/ui/separator";

interface AdminGuardProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export default function AdminGuard({ children, pageTitle }: AdminGuardProps) {
  const [, navigate] = useLocation();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError || !data) {
    navigate("/admin/login");
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50">
        <AdminSidebar />
        <SidebarInset className="flex flex-col min-h-0">
          {/* Top bar */}
          <header className="flex items-center gap-2 px-4 h-12 border-b bg-white shrink-0">
            <SidebarTrigger
              className="text-slate-500 hover:text-slate-800"
              data-testid="button-sidebar-toggle"
            />
            <Separator orientation="vertical" className="h-4" />
            {pageTitle && (
              <span className="text-sm font-medium text-slate-700">{pageTitle}</span>
            )}
          </header>
          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
