import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronRight, MessageSquare, Heart } from "lucide-react";
import type { Invitation, Wish } from "@shared/schema";

function InvitationWishesRow({ inv }: { inv: Invitation }) {
  const [open, setOpen] = useState(false);

  const { data: wishes = [], isLoading } = useQuery<Wish[]>({
    queryKey: ["/api/invitations", inv.id, "guestbook"],
    queryFn: async () => {
      const res = await fetch(`/api/invitations/${inv.id}/guestbook`);
      if (!res.ok) throw new Error("Gagal memuat ucapan");
      return res.json();
    },
    enabled: open,
  });

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden" data-testid={`wishes-group-${inv.id}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-white hover:bg-slate-50 transition-colors text-left"
        data-testid={`wishes-toggle-${inv.id}`}
      >
        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
          <Heart className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 text-sm truncate">
            {inv.groomName} &amp; {inv.brideName}
          </p>
          <p className="text-xs text-slate-400 truncate">/invite/{inv.slug}</p>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : wishes.length === 0 ? (
            <p className="py-8 text-center text-slate-400 text-sm">
              Belum ada ucapan untuk undangan ini.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {wishes.map((wish) => (
                <div key={wish.id} className="flex items-start gap-3 px-5 py-3.5" data-testid={`wish-row-${wish.id}`}>
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-xs font-semibold text-slate-500 uppercase mt-0.5">
                    {wish.guestName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{wish.guestName}</p>
                    <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{wish.message}</p>
                  </div>
                  <span className="text-xs text-slate-300 shrink-0 mt-0.5">
                    {new Date(wish.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminWishes() {
  const { data: invitations = [], isLoading } = useQuery<Invitation[]>({
    queryKey: ["/api/invitations"],
  });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Ucapan</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Ucapan dan doa dari para tamu undangan
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : invitations.length === 0 ? (
        <div className="py-20 text-center text-slate-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-200" />
          <p className="text-sm">Belum ada undangan yang dibuat.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <InvitationWishesRow key={inv.id} inv={inv} />
          ))}
        </div>
      )}
    </div>
  );
}
