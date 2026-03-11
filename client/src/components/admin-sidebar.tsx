import { useLocation, Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FileText,
  Users,
  MessageSquare,
  Layers,
  LogOut,
  Heart,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",    href: "/admin",             icon: LayoutDashboard },
  { label: "Landing Page", href: "/admin/landing",     icon: Layers },
  { label: "Undangan",     href: "/admin/invitations", icon: FileText },
  { label: "RSVP",         href: "/admin/rsvp",        icon: Users },
  { label: "Ucapan",       href: "/admin/wishes",      icon: MessageSquare },
];

export function AdminSidebar() {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: admin } = useQuery<{ id: number; email: string; name: string }>({
    queryKey: ["/api/admin/me"],
    staleTime: Infinity,
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/logout"),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/admin/login";
    },
    onError: () => toast({ title: "Gagal logout", variant: "destructive" }),
  });

  function isActive(href: string) {
    if (href === "/admin") return location === "/admin";
    return location.startsWith(href);
  }

  return (
    <Sidebar>
      {/* Logo */}
      <SidebarHeader className="px-4 py-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-sm text-slate-900">WedSaas</p>
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Link href={item.href}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      {/* Footer: admin info + logout */}
      <SidebarFooter className="px-3 py-3">
        <div className="px-2 py-1 mb-1">
          <p className="text-xs font-medium text-slate-700 truncate">{admin?.name ?? "Admin"}</p>
          <p className="text-xs text-slate-400 truncate">{admin?.email ?? ""}</p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="text-slate-500 hover:text-red-600 hover:bg-red-50"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              <span>{logoutMutation.isPending ? "Keluar..." : "Keluar"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
