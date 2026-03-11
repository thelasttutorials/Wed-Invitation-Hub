import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import UserGuard from "@/components/user-guard";
import { UserSidebar } from "@/components/user-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Plus,
  Users,
  MessageSquare,
  ExternalLink,
  ArrowRight,
  Heart,
} from "lucide-react";
import type { User } from "@shared/schema";

interface MeResponse {
  id: number;
  email: string;
}

function DashboardHome() {
  const { data: me } = useQuery<MeResponse>({
    queryKey: ["/api/auth/me"],
    staleTime: 60_000,
  });

  const { data: invitations, isLoading } = useQuery<any[]>({
    queryKey: ["/api/invitations"],
  });

  const totalInvitations = invitations?.length ?? 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Selamat datang! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {me?.email}
          </p>
        </div>
        <Link href="/dashboard/new">
          <Button
            size="sm"
            className="gap-1.5"
            data-testid="button-buat-undangan"
          >
            <Plus className="w-4 h-4" />
            Buat Undangan
          </Button>
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/invitations">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-rose-500">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-800" data-testid="stat-undangan">
                {isLoading ? <Skeleton className="h-7 w-10" /> : totalInvitations}
              </p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-slate-500 text-sm">Undangan</p>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/rsvp">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-blue-500">
                <Users className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-800" data-testid="stat-rsvp">
                —
              </p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-slate-500 text-sm">RSVP</p>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/wishes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-violet-500">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-800" data-testid="stat-ucapan">
                —
              </p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-slate-500 text-sm">Ucapan</p>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Invitations list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Undangan Terbaru
          </h2>
          <Link href="/dashboard/invitations">
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : !invitations || invitations.filter(inv => !inv.slug.startsWith("demo-")).length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-3">
                <Heart className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">Belum ada undangan</h3>
              <p className="text-slate-500 text-sm mb-4">
                Buat undangan digital pernikahan pertama kamu sekarang
              </p>
              <Link href="/dashboard/new">
                <Button size="sm" data-testid="button-buat-pertama">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Buat Undangan
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {invitations
              .filter(inv => !inv.slug.startsWith("demo-"))
              .slice(0, 5)
              .map((inv: any) => (
                <Card key={inv.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">
                        {inv.groomName} & {inv.brideName}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        /{inv.slug}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={inv.isPublished ? "default" : "secondary"}
                        className="text-xs"
                        data-testid={`badge-status-${inv.id}`}
                      >
                        {inv.isPublished ? "Aktif" : "Draft"}
                      </Badge>
                      <a
                        href={`/invite/${inv.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Getting started tips */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-6 border border-rose-100">
        <h3 className="font-semibold text-slate-900 mb-1">Cara Menggunakan WedSaas</h3>
        <p className="text-slate-600 text-sm mb-4">Ikuti langkah mudah ini untuk memulai</p>
        <ol className="space-y-2">
          {[
            "Klik Buat Undangan dan isi data pasangan",
            "Bagikan link undangan ke keluarga & teman",
            "Pantau RSVP dan ucapan yang masuk di sini",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
              <span className="w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-64 text-center">
      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
        <FileText className="w-6 h-6 text-slate-400" />
      </div>
      <h2 className="font-semibold text-slate-900 mb-1">{title}</h2>
      <p className="text-slate-500 text-sm">Fitur ini akan segera tersedia.</p>
      <Link href="/dashboard">
        <Button variant="outline" size="sm" className="mt-4">
          Kembali ke Dashboard
        </Button>
      </Link>
    </div>
  );
}

interface DashboardProps {
  section?: "home" | "invitations" | "new" | "rsvp" | "wishes" | "settings";
}

export default function Dashboard({ section = "home" }: DashboardProps) {
  const pageTitles: Record<string, string> = {
    home: "Dashboard",
    invitations: "Undangan Saya",
    new: "Buat Undangan",
    rsvp: "Daftar RSVP",
    wishes: "Ucapan Tamu",
    settings: "Pengaturan Akun",
  };

  return (
    <UserGuard>
      <SidebarProvider>
        <div className="flex h-screen w-full bg-slate-50">
          <UserSidebar />
          <SidebarInset className="flex flex-col min-h-0">
            <header className="flex items-center gap-2 px-4 h-12 border-b bg-white shrink-0">
              <SidebarTrigger
                className="text-slate-500 hover:text-slate-800"
                data-testid="button-sidebar-toggle-user"
              />
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm font-medium text-slate-700">
                {pageTitles[section]}
              </span>
            </header>
            <main className="flex-1 overflow-y-auto">
              {section === "home" && <DashboardHome />}
              {section === "invitations" && <ComingSoon title="Undangan Saya" />}
              {section === "new" && <ComingSoon title="Buat Undangan Baru" />}
              {section === "rsvp" && <ComingSoon title="Daftar RSVP" />}
              {section === "wishes" && <ComingSoon title="Ucapan Tamu" />}
              {section === "settings" && <ComingSoon title="Pengaturan Akun" />}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </UserGuard>
  );
}
