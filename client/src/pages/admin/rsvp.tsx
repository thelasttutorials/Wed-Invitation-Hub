import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Users,
  Heart,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import type { Invitation, Rsvp } from "@shared/schema";

const ATTENDANCE_CONFIG: Record<string, { label: string; icon: any; class: string }> = {
  hadir:       { label: "Hadir",       icon: CheckCircle2, class: "bg-emerald-100 text-emerald-700" },
  tidak_hadir: { label: "Tidak Hadir", icon: XCircle,      class: "bg-red-100 text-red-700" },
  belum_pasti: { label: "Belum Pasti", icon: HelpCircle,   class: "bg-amber-100 text-amber-700" },
};

function InvitationRsvpRow({ inv }: { inv: Invitation }) {
  const [open, setOpen] = useState(false);

  const { data: rsvps = [], isLoading } = useQuery<Rsvp[]>({
    queryKey: ["/api/invitations", inv.id, "rsvp"],
    queryFn: async () => {
      const res = await fetch(`/api/invitations/${inv.id}/rsvp`);
      if (!res.ok) throw new Error("Gagal memuat RSVP");
      return res.json();
    },
    enabled: open,
  });

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden" data-testid={`rsvp-group-${inv.id}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-white hover:bg-slate-50 transition-colors text-left"
        data-testid={`rsvp-toggle-${inv.id}`}
      >
        <div className="w-9 h-9 bg-rose-50 rounded-lg flex items-center justify-center shrink-0">
          <Heart className="w-4 h-4 text-rose-400" />
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
              {[1, 2].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
            </div>
          ) : rsvps.length === 0 ? (
            <p className="py-8 text-center text-slate-400 text-sm">
              Belum ada RSVP untuk undangan ini.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {rsvps.map((rsvp) => {
                const cfg = ATTENDANCE_CONFIG[rsvp.attendance] ?? ATTENDANCE_CONFIG.belum_pasti;
                const Icon = cfg.icon;
                return (
                  <div key={rsvp.id} className="flex items-start gap-3 px-5 py-3" data-testid={`rsvp-row-${rsvp.id}`}>
                    <Icon className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800">{rsvp.guestName}</span>
                        <Badge className={`text-xs border-0 ${cfg.class}`}>{cfg.label}</Badge>
                        <span className="text-xs text-slate-400">{rsvp.guestCount} orang</span>
                      </div>
                      {rsvp.message && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">"{rsvp.message}"</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-300 shrink-0">
                      {new Date(rsvp.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminRsvp() {
  const { data: invitations = [], isLoading } = useQuery<Invitation[]>({
    queryKey: ["/api/invitations"],
  });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">RSVP</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Konfirmasi kehadiran tamu per undangan
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : invitations.length === 0 ? (
        <div className="py-20 text-center text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-200" />
          <p className="text-sm">Belum ada undangan yang dibuat.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <InvitationRsvpRow key={inv.id} inv={inv} />
          ))}
        </div>
      )}
    </div>
  );
}
