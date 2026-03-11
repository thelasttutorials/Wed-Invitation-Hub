import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Loader2, ImageIcon } from "lucide-react";
import { useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu Bukti",
  waiting_confirmation: "Menunggu Konfirmasi",
  paid: "Lunas",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  waiting_confirmation: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-600",
};

function OrderRow({ order }: { order: any }) {
  const { toast } = useToast();
  const [showProof, setShowProof] = useState(false);

  const approveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/orders/${order.id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Approved!", description: `Pembayaran ${order.orderNumber} berhasil dikonfirmasi.` });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e?.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/orders/${order.id}/reject`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Ditolak", description: `Order ${order.orderNumber} telah ditolak.` });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e?.message, variant: "destructive" }),
  });

  const canAct = order.paymentStatus === "waiting_confirmation";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-900 text-sm" data-testid={`text-order-number-${order.id}`}>{order.orderNumber}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.paymentStatus] ?? ""}`}>
                  {STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                </span>
              </div>
              <p className="text-sm text-slate-600">{order.user?.email}</p>
              <p className="text-xs text-slate-400">Paket: <strong>{order.plan?.name}</strong> — Rp {order.amount?.toLocaleString("id-ID")}</p>
              <p className="text-xs text-slate-400">Dibuat: {new Date(order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {order.confirmation && (
                <Button variant="outline" size="sm" onClick={() => setShowProof(!showProof)} data-testid={`button-show-proof-${order.id}`}>
                  <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                  Bukti
                </Button>
              )}
              {canAct && (
                <>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    data-testid={`button-approve-${order.id}`}
                  >
                    {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1" />Approve</>}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => rejectMutation.mutate()}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    data-testid={`button-reject-${order.id}`}
                  >
                    {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-1" />Reject</>}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {showProof && order.confirmation && (
          <div className="border-t bg-slate-50 p-4 space-y-2">
            <h4 className="font-medium text-sm text-slate-900">Detail Transfer</h4>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
              <div><span className="text-slate-500">Pengirim:</span> <span className="font-medium">{order.confirmation.senderName}</span></div>
              <div><span className="text-slate-500">Bank:</span> <span className="font-medium">{order.confirmation.senderBank}</span></div>
              <div><span className="text-slate-500">Tgl Transfer:</span> <span className="font-medium">{order.confirmation.transferDate}</span></div>
              <div><span className="text-slate-500">Nominal:</span> <span className="font-medium">Rp {order.confirmation.transferAmount?.toLocaleString("id-ID")}</span></div>
              {order.confirmation.note && <div className="col-span-2"><span className="text-slate-500">Catatan:</span> {order.confirmation.note}</div>}
            </div>
            {order.confirmation.proofImageUrl && (
              <div className="mt-2">
                <p className="text-xs text-slate-500 mb-1.5">Bukti Transfer:</p>
                <img
                  src={order.confirmation.proofImageUrl}
                  alt="Bukti transfer"
                  className="max-w-xs rounded-lg border border-slate-200 max-h-64 object-contain"
                  data-testid={`img-proof-${order.id}`}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminOrders() {
  const { data: orders, isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/orders"] });

  const waitingCount = orders?.filter(o => o.paymentStatus === "waiting_confirmation").length ?? 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kelola Order</h1>
          <p className="text-slate-500 text-sm mt-1">Review dan konfirmasi pembayaran user</p>
        </div>
        {waitingCount > 0 && (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
            {waitingCount} menunggu konfirmasi
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0,1,2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : !orders?.length ? (
        <div className="text-center py-16 text-slate-400">
          <p>Belum ada order masuk.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => <OrderRow key={order.id} order={order} />)}
        </div>
      )}
    </div>
  );
}
