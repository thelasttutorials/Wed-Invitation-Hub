import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, Download, CheckCircle2, ChevronLeft } from "lucide-react";
import { Link } from "wouter";

export default function InvoicePage() {
  const [, params] = useRoute("/dashboard/invoice/:id");
  const orderId = params?.id;

  const { data: invoiceData, isLoading } = useQuery<any>({
    queryKey: [`/api/orders/${orderId}/invoice`],
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-12">
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">Invoice tidak ditemukan atau belum lunas.</p>
        <Link href="/dashboard">
          <Button variant="ghost">Kembali ke Dashboard</Button>
        </Link>
      </div>
    );
  }

  const { order, plan, user } = invoiceData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between no-print">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Cetak
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50 border-b p-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <span className="font-bold text-xl tracking-tight">WedSaas</span>
              </div>
              <p className="text-sm text-slate-500">Undangan Digital Profesional</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tighter">Invoice</h2>
              <p className="text-sm text-slate-500 font-medium">#{order.orderNumber}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ditagihkan Ke</h4>
              <p className="font-semibold text-slate-900">{user.email}</p>
              <p className="text-sm text-slate-500 mt-1">Pelanggan WedSaas</p>
            </div>
            <div className="text-right">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Detail Pembayaran</h4>
              <p className="text-sm text-slate-600"><span className="text-slate-400">Tanggal:</span> {new Date(order.updatedAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="text-sm text-slate-600"><span className="text-slate-400">Metode:</span> Transfer Bank</p>
              <div className="inline-flex items-center gap-1.5 mt-2 bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-green-100">
                <CheckCircle2 className="w-3 h-3" />
                LUNAS
              </div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="text-left py-3 px-4 font-bold text-slate-600">Deskripsi</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4 px-4">
                    <p className="font-semibold text-slate-900">Paket {plan.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                  </td>
                  <td className="py-4 px-4 text-right font-medium">
                    Rp {order.amount.toLocaleString("id-ID")}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50/50">
                <tr>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">Total</td>
                  <td className="py-3 px-4 text-right font-bold text-primary text-lg">
                    Rp {order.amount.toLocaleString("id-ID")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="pt-8 border-t text-center">
            <p className="text-xs text-slate-400 leading-relaxed">
              Terima kasih telah menggunakan layanan WedSaas.<br />
              Jika Anda memiliki pertanyaan mengenai invoice ini, silakan hubungi tim dukungan kami.
            </p>
          </div>
        </CardContent>
      </Card>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { padding: 0 !important; background: white !important; }
          .p-6 { padding: 0 !important; }
          .max-w-3xl { max-width: 100% !important; width: 100% !important; }
          .shadow-sm { shadow: none !important; border: none !important; }
          Card { border: none !important; }
        }
      `}} />
    </div>
  );
}
