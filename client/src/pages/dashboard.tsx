import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useRef, useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import UserGuard from "@/components/user-guard";
import { UserSidebar } from "@/components/user-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  FileText, Plus, Users, MessageSquare, ExternalLink, ArrowRight, Heart,
  Star, Crown, Zap, Upload, CheckCircle, XCircle, Clock, AlertTriangle, Loader2,
} from "lucide-react";
import type { PricingPlan } from "@shared/schema";

interface MeResponse { id: number; email: string }
interface SubMe { subscription: any; plan: PricingPlan }

// ─── Billing Section ──────────────────────────────────────────────────────────

const proofSchema = z.object({
  senderName: z.string().min(1, "Nama pengirim wajib diisi"),
  senderBank: z.string().min(1, "Nama bank wajib diisi"),
  transferDate: z.string().min(1, "Tanggal transfer wajib diisi"),
  transferAmount: z.coerce.number().int().positive("Nominal harus lebih dari 0"),
  note: z.string().default(""),
});
type ProofForm = z.infer<typeof proofSchema>;

const STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu Bukti Transfer",
  waiting_confirmation: "Menunggu Konfirmasi Admin",
  paid: "Lunas",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  waiting_confirmation: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};
const PLAN_ICON_MAP: Record<string, any> = { gratis: Zap, premium: Star, pro: Crown };

function BillingSection() {
  const { toast } = useToast();
  const { data: me } = useQuery<MeResponse>({ queryKey: ["/api/auth/me"], staleTime: 60_000 });
  const { data: subData, isLoading: subLoading } = useQuery<SubMe>({ queryKey: ["/api/subscription/me"] });
  const { data: bank } = useQuery<any>({ queryKey: ["/api/bank-settings"] });
  const { data: orders, isLoading: ordersLoading } = useQuery<any[]>({ queryKey: ["/api/orders/me"] });

  const pendingOrder = orders?.find(o => o.paymentStatus === "pending" || o.paymentStatus === "waiting_confirmation");
  const plan = subData?.plan;
  const Icon = PLAN_ICON_MAP[plan?.slug ?? "gratis"] ?? Zap;

  const form = useForm<ProofForm>({
    resolver: zodResolver(proofSchema),
    defaultValues: { senderName: "", senderBank: "", transferDate: "", transferAmount: 0, note: "" },
  });

  const [proofFile, setProofFile] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (data: ProofForm) =>
      apiRequest("POST", `/api/orders/${pendingOrder?.id}/upload-proof`, { ...data, proofImageUrl: proofFile }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/me"] });
      toast({ title: "Bukti terkirim!", description: "Menunggu konfirmasi admin. Biasanya dalam 1x24 jam." });
      form.reset();
      setProofFile("");
    },
    onError: (e: any) => toast({ title: "Gagal", description: e?.message, variant: "destructive" }),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Maks 3MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setProofFile(reader.result as string);
    reader.readAsDataURL(file);
  }

  if (subLoading) return <div className="p-6"><Skeleton className="h-40 w-full rounded-xl" /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Paket & Tagihan</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola paket langganan dan pembayaran Anda</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Paket Saat Ini</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan?.slug === "gratis" ? "bg-slate-100" : plan?.slug === "premium" ? "bg-rose-100" : "bg-violet-100"}`}>
              <Icon className={`w-5 h-5 ${plan?.slug === "gratis" ? "text-slate-600" : plan?.slug === "premium" ? "text-rose-500" : "text-violet-600"}`} />
            </div>
            <div>
              <p className="font-bold text-slate-900">{plan?.name ?? "Mulai Gratis"}</p>
              <p className="text-xs text-slate-500">
                {plan?.maxInvitations && plan.maxInvitations >= 999 ? "Undangan unlimited" : `${plan?.maxInvitations ?? 1} undangan`}
                {" · "}
                {plan?.maxGalleryPhotos && plan.maxGalleryPhotos >= 999 ? "Galeri unlimited" : `${plan?.maxGalleryPhotos ?? 3} foto`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-700 font-medium" data-testid="badge-current-plan">Aktif</Badge>
            <Link href="/pricing">
              <Button size="sm" variant="outline" data-testid="button-upgrade-plan">Upgrade Paket</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {pendingOrder && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Order Pembayaran Aktif</p>
                <p className="text-sm text-blue-700">Order #{pendingOrder.orderNumber} — {pendingOrder.plan?.name} — Rp {pendingOrder.amount?.toLocaleString("id-ID")}</p>
                <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[pendingOrder.paymentStatus] ?? ""}`}>
                  {STATUS_LABELS[pendingOrder.paymentStatus] ?? pendingOrder.paymentStatus}
                </span>
              </div>
            </div>

            {pendingOrder.paymentStatus === "pending" && bank && (
              <>
                <div className="bg-white rounded-xl p-4 mb-4 border border-blue-200 space-y-2 text-sm">
                  <p className="font-semibold text-slate-900">Instruksi Transfer</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div><span className="text-slate-500">Bank:</span> <strong>{bank.bankName}</strong></div>
                    <div><span className="text-slate-500">Rekening:</span> <strong>{bank.accountNumber}</strong></div>
                    <div className="col-span-2"><span className="text-slate-500">Atas Nama:</span> <strong>{bank.accountHolder}</strong></div>
                    <div className="col-span-2"><span className="text-slate-500">Nominal:</span> <strong className="text-rose-600 text-base">Rp {pendingOrder.amount?.toLocaleString("id-ID")}</strong></div>
                  </div>
                  {bank.paymentNote && <p className="text-slate-500 text-xs pt-1 border-t">{bank.paymentNote}</p>}
                </div>

                <p className="font-semibold text-slate-900 text-sm mb-3">Upload Bukti Transfer</p>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((d) => uploadMutation.mutate(d))} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form.control} name="senderName" render={({ field }) => (
                        <FormItem><FormLabel>Nama Pengirim</FormLabel><FormControl><Input placeholder="Nama Anda" data-testid="input-sender-name" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="senderBank" render={({ field }) => (
                        <FormItem><FormLabel>Bank Pengirim</FormLabel><FormControl><Input placeholder="BCA, BNI, ..." data-testid="input-sender-bank" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="transferDate" render={({ field }) => (
                        <FormItem><FormLabel>Tanggal Transfer</FormLabel><FormControl><Input type="date" data-testid="input-transfer-date" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="transferAmount" render={({ field }) => (
                        <FormItem><FormLabel>Nominal Transfer (Rp)</FormLabel><FormControl><Input type="number" data-testid="input-transfer-amount" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="note" render={({ field }) => (
                      <FormItem><FormLabel>Catatan (opsional)</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                    <div>
                      <p className="text-sm font-medium mb-1.5">Foto Bukti Transfer <span className="text-red-500">*</span></p>
                      <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" data-testid="input-proof-file" />
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-2 border-2 border-dashed border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-600 hover:border-rose-400 hover:text-rose-600 transition-colors w-full justify-center">
                        <Upload className="w-4 h-4" />
                        {proofFile ? "Ganti foto" : "Pilih foto bukti transfer"}
                      </button>
                      {proofFile && (
                        <img src={proofFile} alt="preview" className="mt-2 max-h-40 rounded-lg border border-slate-200 object-contain" />
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={!proofFile || uploadMutation.isPending}
                      className="w-full"
                      data-testid="button-upload-proof"
                    >
                      {uploadMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengupload...</> : <><Upload className="w-4 h-4 mr-2" />Kirim Bukti Transfer</>}
                    </Button>
                  </form>
                </Form>
              </>
            )}

            {pendingOrder.paymentStatus === "waiting_confirmation" && (
              <div className="flex items-center gap-2 text-blue-700 text-sm">
                <Clock className="w-4 h-4" />
                Bukti transfer sudah diterima. Admin akan mengonfirmasi dalam 1x24 jam.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Orders Section ───────────────────────────────────────────────────────────

function OrdersSection() {
  const { data: orders, isLoading } = useQuery<any[]>({ queryKey: ["/api/orders/me"] });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Riwayat Order</h1>
        <p className="text-slate-500 text-sm mt-1">Semua order pembayaran Anda</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : !orders?.length ? (
        <div className="text-center py-12 text-slate-400">
          <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Belum ada riwayat order.</p>
          <Link href="/pricing"><Button variant="outline" size="sm" className="mt-3">Lihat Paket</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">{order.orderNumber}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {order.plan?.name} — Rp {order.amount?.toLocaleString("id-ID")}
                    {" · "}
                    {new Date(order.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${STATUS_COLORS[order.paymentStatus] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                    {STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                  </span>
                  {order.paymentStatus === "paid" && (
                    <Link href={`/dashboard/invoice/${order.id}`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" data-testid={`button-invoice-${order.id}`}>
                        <FileText className="w-3.5 h-3.5" />
                        Invoice
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Home ───────────────────────────────────────────────────────────

function DashboardHome() {
  const { data: me } = useQuery<MeResponse>({ queryKey: ["/api/auth/me"], staleTime: 60_000 });
  const { data: subData } = useQuery<SubMe>({ queryKey: ["/api/subscription/me"] });
  const { data: invitations, isLoading } = useQuery<any[]>({ queryKey: ["/api/invitations"] });
  const plan = subData?.plan;
  const totalInvitations = invitations?.filter(inv => !inv.slug.startsWith("demo-")).length ?? 0;
  const maxInv = plan?.maxInvitations ?? 1;
  const Icon = PLAN_ICON_MAP[plan?.slug ?? "gratis"] ?? Zap;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Selamat datang!</h1>
          <p className="text-slate-500 text-sm mt-0.5">{me?.email}</p>
        </div>
        <Link href="/dashboard/new">
          <Button size="sm" className="gap-1.5" data-testid="button-buat-undangan">
            <Plus className="w-4 h-4" />Buat Undangan
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: "/dashboard/invitations", bg: "bg-rose-500", Icon: FileText, val: isLoading ? null : totalInvitations, label: "Undangan", testId: "stat-undangan" },
          { href: "/dashboard/guests", bg: "bg-emerald-500", Icon: Users, val: "—", label: "Tamu", testId: "stat-guests" },
          { href: "/dashboard/rsvp", bg: "bg-blue-500", Icon: Users, val: "—", label: "RSVP", testId: "stat-rsvp" },
          { href: "/dashboard/wishes", bg: "bg-violet-500", Icon: MessageSquare, val: "—", label: "Ucapan", testId: "stat-ucapan" },
        ].map(({ href, bg, Icon: I, val, label, testId }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
                  <I className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-slate-800" data-testid={testId}>
                  {val === null ? <Skeleton className="h-7 w-10 inline-block" /> : val}
                </p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-slate-500 text-sm">{label}</p>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-slate-50 to-white">
        <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${plan?.slug === "gratis" ? "bg-slate-100" : plan?.slug === "premium" ? "bg-rose-100" : "bg-violet-100"}`}>
              <Icon className={`w-4 h-4 ${plan?.slug === "gratis" ? "text-slate-600" : plan?.slug === "premium" ? "text-rose-500" : "text-violet-600"}`} />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{plan?.name ?? "Mulai Gratis"}</p>
              <p className="text-xs text-slate-500">
                Undangan: {totalInvitations}/{maxInv >= 999 ? "∞" : maxInv}
                {plan && !plan.allowMusic && " · Musik: —"}
                {plan && !plan.allowLoveStory && " · Love Story: —"}
              </p>
            </div>
          </div>
          {plan?.slug === "gratis" && (
            <Link href="/pricing">
              <Button size="sm" variant="outline" className="text-xs" data-testid="button-upgrade-from-home">
                Upgrade Paket
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Undangan Terbaru</h2>
        </div>
        {isLoading ? (
          <div className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
        ) : !invitations?.filter(inv => !inv.slug.startsWith("demo-")).length ? (
          <Card className="border-dashed">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-3">
                <Heart className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">Belum ada undangan</h3>
              <p className="text-slate-500 text-sm mb-4">Buat undangan digital pernikahan pertama kamu</p>
              <Link href="/dashboard/new">
                <Button size="sm" data-testid="button-buat-pertama"><Plus className="w-4 h-4 mr-1.5" />Buat Undangan</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {invitations.filter(inv => !inv.slug.startsWith("demo-")).slice(0, 5).map((inv: any) => (
              <Card key={inv.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 truncate">{inv.groomName} & {inv.brideName}</div>
                    <div className="text-xs text-slate-400 mt-0.5">/{inv.slug}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={inv.isPublished ? "default" : "secondary"} className="text-xs" data-testid={`badge-status-${inv.id}`}>
                      {inv.isPublished ? "Aktif" : "Draft"}
                    </Badge>
                    <a href={`/invite/${inv.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="w-3.5 h-3.5" /></Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
      <Link href="/dashboard"><Button variant="outline" size="sm" className="mt-4">Kembali ke Dashboard</Button></Link>
    </div>
  );
}

type DashboardSection = "home" | "invitations" | "new" | "rsvp" | "wishes" | "settings" | "billing" | "orders";

const pageTitles: Record<DashboardSection, string> = {
  home: "Dashboard",
  invitations: "Undangan Saya",
  new: "Buat Undangan",
  rsvp: "Daftar RSVP",
  wishes: "Ucapan Tamu",
  settings: "Pengaturan Akun",
  billing: "Paket & Tagihan",
  orders: "Riwayat Order",
};

interface DashboardProps {
  section?: DashboardSection;
}

export default function Dashboard({ section = "home" }: DashboardProps) {
  return (
    <UserGuard>
      <SidebarProvider>
        <div className="flex h-screen w-full bg-slate-50">
          <UserSidebar />
          <SidebarInset className="flex flex-col min-h-0">
            <header className="flex items-center gap-2 px-4 h-12 border-b bg-white shrink-0">
              <SidebarTrigger className="text-slate-500 hover:text-slate-800" data-testid="button-sidebar-toggle-user" />
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm font-medium text-slate-700">{pageTitles[section]}</span>
            </header>
            <main className="flex-1 overflow-y-auto">
              {section === "home" && <DashboardHome />}
              {section === "billing" && <BillingSection />}
              {section === "orders" && <OrdersSection />}
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
