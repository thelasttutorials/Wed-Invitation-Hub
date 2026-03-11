import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
} from "@/components/ui/sidebar";
import {
  Heart,
  LayoutDashboard,
  FileText,
  Plus,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  CreditCard,
  ClipboardList,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    testId: "nav-dashboard",
  },
  {
    label: "Undangan Saya",
    href: "/dashboard/invitations",
    icon: FileText,
    testId: "nav-invitations",
  },
  {
    label: "Buat Undangan",
    href: "/dashboard/new",
    icon: Plus,
    testId: "nav-new-invitation",
  },
  {
    label: "Daftar RSVP",
    href: "/dashboard/rsvp",
    icon: Users,
    testId: "nav-rsvp",
  },
  {
    label: "Ucapan Tamu",
    href: "/dashboard/wishes",
    icon: MessageSquare,
    testId: "nav-wishes",
  },
  {
    label: "Paket & Tagihan",
    href: "/dashboard/billing",
    icon: CreditCard,
    testId: "nav-billing",
  },
  {
    label: "Riwayat Order",
    href: "/dashboard/orders",
    icon: ClipboardList,
    testId: "nav-orders",
  },
  {
    label: "Pengaturan Akun",
    href: "/dashboard/settings",
    icon: Settings,
    testId: "nav-settings",
  },
];

export function UserSidebar() {
  const [location] = useLocation();

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout", {}),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
  });

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4 border-b">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 fill-white text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm leading-none">WedSaas</div>
            <div className="text-xs text-slate-400 mt-0.5">Dasbor Pengguna</div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? location === "/dashboard"
                    : location.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={item.testId}>
                      <Link href={item.href} className="flex items-center gap-2">
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              data-testid="button-logout-user"
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
