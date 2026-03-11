import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText, Users, MessageSquare, Plus,
  Layers, ArrowRight,
} from "lucide-react";
import type { Invitation } from "@shared/schema";

interface Stats {
  totalInvitations: number;
  totalRsvp: number;
  totalGuestbook: number;
  recentInvitations: Invitation[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  href: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <p
            className="text-2xl font-bold text-slate-800"
            data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}
          >
            {value}
          </p>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-slate-500 text-sm">{label}</p>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Selamat datang di panel admin WedSaas</p>
        </div>
        <Link href="/admin/invitations">
          <Button size="sm" data-testid="button-new-invitation">
            <Plus className="w-4 h-4 mr-1.5" />
            Buat Undangan
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Ringkasan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))
          ) : (
            <>
              <StatCard
                icon={FileText}
                label="Total Undangan"
                value={stats?.totalInvitations ?? 0}
                href="/admin/invitations"
                color="bg-blue-500"
              />
              <StatCard
                icon={Users}
                label="Total RSVP"
                value={stats?.totalRsvp ?? 0}
                href="/admin/rsvp"
                color="bg-rose-500"
              />
              <StatCard
                icon={MessageSquare}
                label="Ucapan Masuk"
                value={stats?.totalGuestbook ?? 0}
                href="/admin/wishes"
                color="bg-emerald-500"
              />
            </>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Akses Cepat
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              href: "/admin/invitations",
              icon: FileText,
              title: "Kelola Undangan",
              desc: "Buat, edit, dan bagikan link undangan",
            },
            {
              href: "/admin/landing",
              icon: Layers,
              title: "Landing Page",
              desc: "Lihat pengaturan halaman utama",
            },
            {
              href: "/admin/rsvp",
              icon: Users,
              title: "Data RSVP",
              desc: "Pantau konfirmasi kehadiran tamu",
            },
            {
              href: "/admin/wishes",
              icon: MessageSquare,
              title: "Ucapan & Doa",
              desc: "Baca ucapan dari para tamu undangan",
            },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                    <item.icon className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-400 truncate">{item.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
