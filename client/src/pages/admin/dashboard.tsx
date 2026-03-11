import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart, Plus, Edit2, Trash2, Eye, LayoutDashboard,
  FileText, Users, MessageSquare, ExternalLink, Copy
} from "lucide-react";
import type { Invitation } from "@shared/schema";

interface Stats {
  totalInvitations: number;
  totalRsvp: number;
  totalGuestbook: number;
  recentInvitations: Invitation[];
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-800" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>{value}</p>
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: invitations = [], isLoading } = useQuery<Invitation[]>({
    queryKey: ["/api/invitations"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/invitations/${id}`),
    onSuccess: () => {
      toast({ title: "Undangan dihapus" });
      qc.invalidateQueries({ queryKey: ["/api/invitations"] });
      qc.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => toast({ title: "Gagal menghapus", variant: "destructive" }),
  });

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/invitation/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link disalin!" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <span className="font-bold text-gray-800">WedSaas</span>
            <span className="text-gray-300 mx-1">|</span>
            <span className="text-gray-500 text-sm flex items-center gap-1">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </span>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-gray-500">
              <ExternalLink className="w-4 h-4 mr-1" /> Landing Page
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {statsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))
          ) : (
            <>
              <StatCard icon={FileText} label="Total Undangan" value={stats?.totalInvitations ?? 0} color="bg-blue-500" />
              <StatCard icon={Users} label="Total RSVP" value={stats?.totalRsvp ?? 0} color="bg-rose-500" />
              <StatCard icon={MessageSquare} label="Buku Tamu" value={stats?.totalGuestbook ?? 0} color="bg-emerald-500" />
            </>
          )}
        </div>

        {/* Invitations list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Daftar Undangan</h2>
            <Link href="/admin/new">
              <Button className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl" size="sm" data-testid="button-new-invitation">
                <Plus className="w-4 h-4 mr-1" /> Buat Undangan
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : invitations.length === 0 ? (
            <div className="py-16 text-center">
              <Heart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Belum ada undangan. Buat yang pertama!</p>
              <Link href="/admin/new">
                <Button className="mt-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl" data-testid="button-create-first">
                  <Plus className="w-4 h-4 mr-1" /> Buat Undangan
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {invitations.map(inv => (
                <div key={inv.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors" data-testid={`invitation-row-${inv.id}`}>
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-800 truncate">
                        {inv.groomName} &amp; {inv.brideName}
                      </p>
                      <Badge variant={inv.isPublished ? "default" : "secondary"} className={inv.isPublished ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
                        {inv.isPublished ? "Aktif" : "Draft"}
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">
                      /invitation/{inv.slug}
                      {inv.receptionDate && ` · ${new Date(inv.receptionDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="text-gray-400 hover:text-blue-500"
                      data-testid={`button-view-${inv.id}`}
                    >
                      <a href={`/invitation/${inv.slug}`} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyLink(inv.slug)}
                      className="text-gray-400 hover:text-emerald-500"
                      data-testid={`button-copy-${inv.id}`}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Link href={`/admin/${inv.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-gray-700"
                        data-testid={`button-edit-${inv.id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Hapus undangan ${inv.groomName} & ${inv.brideName}?`)) {
                          deleteMutation.mutate(inv.id);
                        }
                      }}
                      className="text-gray-400 hover:text-rose-500"
                      data-testid={`button-delete-${inv.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
