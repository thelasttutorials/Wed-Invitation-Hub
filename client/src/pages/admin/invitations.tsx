import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Plus, Edit2, Trash2, Eye, Copy } from "lucide-react";
import type { Invitation } from "@shared/schema";

export default function AdminInvitations() {
  const { toast } = useToast();
  const qc = useQueryClient();

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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Undangan</h1>
          <p className="text-slate-500 text-sm mt-0.5">Kelola semua undangan pernikahan digital</p>
        </div>
        <Link href="/admin/new">
          <Button size="sm" data-testid="button-new-invitation">
            <Plus className="w-4 h-4 mr-1.5" />
            Buat Undangan
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : invitations.length === 0 ? (
          <div className="py-20 text-center">
            <Heart className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm mb-4">Belum ada undangan. Buat yang pertama!</p>
            <Link href="/admin/new">
              <Button size="sm" data-testid="button-create-first">
                <Plus className="w-4 h-4 mr-1.5" />
                Buat Undangan
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                data-testid={`invitation-row-${inv.id}`}
              >
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-800 truncate">
                      {inv.groomName} &amp; {inv.brideName}
                    </p>
                    <Badge
                      variant={inv.isPublished ? "default" : "secondary"}
                      className={
                        inv.isPublished
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0"
                          : "bg-slate-100 text-slate-500 border-0"
                      }
                    >
                      {inv.isPublished ? "Aktif" : "Draft"}
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5 truncate">
                    /invitation/{inv.slug}
                    {inv.receptionDate &&
                      ` · ${new Date(inv.receptionDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}`}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="text-slate-400 hover:text-blue-500"
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
                    className="text-slate-400 hover:text-emerald-500"
                    data-testid={`button-copy-${inv.id}`}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Link href={`/admin/${inv.id}/edit`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-slate-700"
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
                    className="text-slate-400 hover:text-rose-500"
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
    </div>
  );
}
