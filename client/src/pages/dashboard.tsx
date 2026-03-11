import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { useRef, useState } from "react";
import { useSEO } from "@/lib/seo";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, Plus, Users, MessageSquare, ExternalLink, ArrowRight, Heart,
  Star, Crown, Zap, Upload, XCircle, Clock, AlertTriangle, Loader2,
  Copy, Trash2, Edit2, ChevronDown, ChevronRight, CheckCircle2, HelpCircle, LogOut,
} from "lucide-react";
import type { PricingPlan } from "@shared/schema";

interface MeResponse { id: number; email: string }
interface SubMe { subscription: any; plan: PricingPlan }
interface MyStats { invitationCount: number; rsvpCount: number; wishCount: number; guestCount: number }

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

const ATTENDANCE_CONFIG: Record<string, { label: string; icon: any; class: string }> = {
  hadir: { label: "Hadir", icon: CheckCircle2, class: "bg-emerald-100 text-emerald-700" },
  tidak_hadir: { label: "Tidak Hadir", icon: XCircle, class: "bg-red-100 text-red-700" },
  belum_pasti: { label: "Belum Pasti", icon: HelpCircle, class: "bg-amber-100 text-amber-700" },
};

const THEME_OPTIONS = [
  { value: "romantic-floral", label: "Romantic Floral" },
  { value: "luxury-gold", label: "Luxury Gold" },
  { value: "eternal-rose", label: "Eternal Rose" },
  { value: "minimal-modern", label: "Minimal Modern" },
  { value: "classic-elegant", label: "Classic Elegant" },
];

function BillingSection() {
  const { toast } = useToast();
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

// ─── Invitations Section ──────────────────────────────────────────────────────

function InvitationsSection() {
  const { toast } = useToast();
  const { data: invitations, isLoading } = useQuery<any[]>({ queryKey: ["/api/my-invitations"] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/my-invitations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-stats"] });
      toast({ title: "Undangan dihapus" });
    },
    onError: (e: any) => toast({ title: "Gagal menghapus", description: e?.message, variant: "destructive" }),
  });

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${slug}`);
    toast({ title: "Link disalin!" });
  };

  const realInvitations = invitations?.filter(inv => !inv.slug.startsWith("demo-")) ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Undangan Saya</h1>
          <p className="text-slate-500 text-sm mt-0.5">Semua undangan digital milik Anda</p>
        </div>
        <Link href="/dashboard/new">
          <Button size="sm" data-testid="button-new-invitation">
            <Plus className="w-4 h-4 mr-1.5" />Buat Undangan
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : realInvitations.length === 0 ? (
          <div className="py-16 text-center">
            <Heart className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm mb-4">Belum ada undangan. Buat yang pertama!</p>
            <Link href="/dashboard/new">
              <Button size="sm" data-testid="button-create-first">
                <Plus className="w-4 h-4 mr-1.5" />Buat Undangan
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {realInvitations.map((inv: any) => (
              <div key={inv.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors" data-testid={`invitation-row-${inv.id}`}>
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{inv.groomName} & {inv.brideName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">/invite/{inv.slug}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={inv.isPublished ? "default" : "secondary"} className="text-xs" data-testid={`badge-inv-status-${inv.id}`}>
                    {inv.isPublished ? "Aktif" : "Draft"}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyLink(inv.slug)} title="Salin link" data-testid={`button-copy-${inv.id}`}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <a href={`/invite/${inv.slug}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Buka undangan" data-testid={`button-view-${inv.id}`}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                  <a href={`/admin/${inv.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" title="Edit undangan" data-testid={`button-edit-${inv.id}`}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteMutation.mutate(inv.id)} disabled={deleteMutation.isPending} title="Hapus undangan" data-testid={`button-delete-${inv.id}`}>
                    <Trash2 className="w-3.5 h-3.5" />
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

// ─── New Invitation Section ───────────────────────────────────────────────────

const newInvSchema = z.object({
  groomName: z.string().min(1, "Nama mempelai pria wajib diisi"),
  brideName: z.string().min(1, "Nama mempelai wanita wajib diisi"),
  receptionDate: z.string().optional(),
  venueName: z.string().default(""),
  venueAddress: z.string().default(""),
  slug: z.string().min(3, "Slug minimal 3 karakter").regex(/^[a-z0-9-]+$/, "Hanya huruf kecil, angka, dan tanda hubung"),
  themeSlug: z.string().default("romantic-floral"),
});
type NewInvForm = z.infer<typeof newInvSchema>;

function NewInvitationSection() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const themeFromUrl = new URLSearchParams(searchStr).get("theme") ?? "romantic-floral";
  const { data: subData } = useQuery<SubMe>({ queryKey: ["/api/subscription/me"] });

  const validThemeSlugs = THEME_OPTIONS.map(t => t.value);
  const defaultTheme = validThemeSlugs.includes(themeFromUrl) ? themeFromUrl : "romantic-floral";

  const form = useForm<NewInvForm>({
    resolver: zodResolver(newInvSchema),
    defaultValues: { groomName: "", brideName: "", receptionDate: "", venueName: "", venueAddress: "", slug: "", themeSlug: defaultTheme },
  });

  const createMutation = useMutation({
    mutationFn: (data: NewInvForm) => apiRequest("POST", "/api/my-invitations", data),
    onSuccess: (inv: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-stats"] });
      toast({ title: "Undangan dibuat!", description: "Sekarang lengkapi detail undangan Anda." });
      navigate(`/admin/${inv.id}/edit`);
    },
    onError: (e: any) => toast({ title: "Gagal", description: e?.message ?? "Coba lagi.", variant: "destructive" }),
  });

  const groomName = form.watch("groomName");
  const brideName = form.watch("brideName");

  function autoSlug() {
    const base = `${groomName}-${brideName}`.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").substring(0, 60);
    form.setValue("slug", base);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Buat Undangan Baru</h1>
        <p className="text-slate-500 text-sm mt-0.5">Isi informasi dasar undangan. Detail bisa dilengkapi setelah ini.</p>
      </div>

      {subData?.plan?.slug === "gratis" && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Paket Gratis: 1 Undangan</p>
            <p className="text-amber-700">Upgrade ke Premium atau Pro untuk membuat lebih banyak undangan.</p>
            <Link href="/pricing"><Button size="sm" variant="outline" className="mt-2 text-xs h-7">Upgrade Paket</Button></Link>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="groomName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Mempelai Pria <span className="text-red-500">*</span></FormLabel>
                    <FormControl><Input placeholder="cth. Budi Santoso" data-testid="input-groom-name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="brideName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Mempelai Wanita <span className="text-red-500">*</span></FormLabel>
                    <FormControl><Input placeholder="cth. Siti Rahayu" data-testid="input-bride-name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="receptionDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Resepsi</FormLabel>
                  <FormControl><Input type="date" data-testid="input-reception-date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="venueName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Tempat</FormLabel>
                  <FormControl><Input placeholder="cth. Gedung Serbaguna" data-testid="input-venue-name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="venueAddress" render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Tempat</FormLabel>
                  <FormControl><Input placeholder="cth. Jl. Sudirman No. 1, Jakarta" data-testid="input-venue-address" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="themeSlug" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tema Undangan</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-theme">
                        <SelectValue placeholder="Pilih tema" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {THEME_OPTIONS.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Slug URL <span className="text-red-500">*</span>
                    <span className="text-slate-400 font-normal ml-1 text-xs">(wedsaas.com/invite/<strong>{field.value || "..."}</strong>)</span>
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormControl><Input placeholder="cth. budi-siti-2025" data-testid="input-slug" {...field} /></FormControl>
                    <Button type="button" variant="outline" size="sm" onClick={autoSlug} className="shrink-0 text-xs">Auto</Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-create-invitation">
                {createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Membuat...</> : <><Plus className="w-4 h-4 mr-2" />Buat Undangan</>}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── RSVP Section ─────────────────────────────────────────────────────────────

function RsvpSection() {
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const { data: groups, isLoading } = useQuery<any[]>({ queryKey: ["/api/my-rsvp"] });

  const toggle = (id: number) => setOpenIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const total = groups?.reduce((sum, g) => sum + g.rsvps.length, 0) ?? 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Daftar RSVP</h1>
        <p className="text-slate-500 text-sm mt-0.5">Tamu yang sudah mengisi konfirmasi kehadiran</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !groups?.length ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Belum ada konfirmasi RSVP masuk.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">Total: <strong className="text-slate-700">{total} RSVP</strong> dari {groups.length} undangan</p>
          {groups.map((group: any) => (
            <div key={group.invitation.id} className="border border-slate-100 rounded-xl overflow-hidden bg-white" data-testid={`rsvp-group-${group.invitation.id}`}>
              <button
                onClick={() => toggle(group.invitation.id)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                data-testid={`rsvp-toggle-${group.invitation.id}`}
              >
                <div className="w-9 h-9 bg-rose-50 rounded-lg flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm">{group.invitation.groomName} & {group.invitation.brideName}</p>
                  <p className="text-xs text-slate-400">{group.rsvps.length} RSVP</p>
                </div>
                {openIds.has(group.invitation.id) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>
              {openIds.has(group.invitation.id) && (
                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {group.rsvps.map((rsvp: any) => {
                    const cfg = ATTENDANCE_CONFIG[rsvp.attendance] ?? ATTENDANCE_CONFIG["belum_pasti"];
                    const Icon = cfg.icon;
                    return (
                      <div key={rsvp.id} className="px-5 py-3 flex items-center gap-3" data-testid={`rsvp-row-${rsvp.id}`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 text-sm">{rsvp.guestName}</p>
                          {rsvp.message && <p className="text-xs text-slate-500 mt-0.5 truncate">{rsvp.message}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-xs">
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${cfg.class}`}>
                            <Icon className="w-3 h-3" />{cfg.label}
                          </span>
                          {rsvp.guestCount > 1 && <span className="text-slate-400">{rsvp.guestCount} orang</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Wishes Section ───────────────────────────────────────────────────────────

function WishesSection() {
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const { data: groups, isLoading } = useQuery<any[]>({ queryKey: ["/api/my-wishes"] });

  const toggle = (id: number) => setOpenIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const total = groups?.reduce((sum, g) => sum + g.wishes.length, 0) ?? 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Ucapan Tamu</h1>
        <p className="text-slate-500 text-sm mt-0.5">Pesan dan ucapan dari tamu undangan</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !groups?.length ? (
        <div className="text-center py-16 text-slate-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Belum ada ucapan masuk.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">Total: <strong className="text-slate-700">{total} ucapan</strong> dari {groups.length} undangan</p>
          {groups.map((group: any) => (
            <div key={group.invitation.id} className="border border-slate-100 rounded-xl overflow-hidden bg-white" data-testid={`wishes-group-${group.invitation.id}`}>
              <button
                onClick={() => toggle(group.invitation.id)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                data-testid={`wishes-toggle-${group.invitation.id}`}
              >
                <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm">{group.invitation.groomName} & {group.invitation.brideName}</p>
                  <p className="text-xs text-slate-400">{group.wishes.length} ucapan</p>
                </div>
                {openIds.has(group.invitation.id) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>
              {openIds.has(group.invitation.id) && (
                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {group.wishes.map((wish: any) => (
                    <div key={wish.id} className="px-5 py-3" data-testid={`wish-row-${wish.id}`}>
                      <p className="font-medium text-slate-800 text-sm">{wish.guestName}</p>
                      <p className="text-slate-600 text-sm mt-0.5 italic">"{wish.message}"</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(wish.createdAt).toLocaleDateString("id-ID")}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings Section ─────────────────────────────────────────────────────────

function SettingsSection() {
  const { toast } = useToast();
  const { data: me } = useQuery<MeResponse>({ queryKey: ["/api/auth/me"] });
  const { data: subData } = useQuery<SubMe>({ queryKey: ["/api/subscription/me"] });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout", {}),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
  });

  const plan = subData?.plan;
  const Icon = PLAN_ICON_MAP[plan?.slug ?? "gratis"] ?? Zap;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Pengaturan Akun</h1>
        <p className="text-slate-500 text-sm mt-0.5">Informasi dan preferensi akun Anda</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email Akun</p>
            <p className="text-slate-900 font-medium" data-testid="text-account-email">{me?.email ?? "—"}</p>
          </div>
          <Separator />
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Paket Langganan</p>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${plan?.slug === "gratis" ? "bg-slate-100" : plan?.slug === "premium" ? "bg-rose-100" : "bg-violet-100"}`}>
                <Icon className={`w-3.5 h-3.5 ${plan?.slug === "gratis" ? "text-slate-600" : plan?.slug === "premium" ? "text-rose-500" : "text-violet-600"}`} />
              </div>
              <span className="font-semibold text-slate-900 text-sm">{plan?.name ?? "Gratis"}</span>
              <Badge className="bg-green-100 text-green-700 text-xs" data-testid="badge-plan-settings">Aktif</Badge>
            </div>
          </div>
          <Separator />
          <div className="flex gap-3 flex-wrap">
            <Link href="/pricing">
              <Button variant="outline" size="sm" data-testid="button-upgrade-settings">Upgrade Paket</Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 border-red-200 hover:bg-red-50"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-logout-settings"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              {logoutMutation.isPending ? "Keluar..." : "Keluar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-slate-400 text-center space-y-1">
        <p>WedSaas — Platform Undangan Pernikahan Digital</p>
        <div className="flex items-center justify-center gap-3">
          <a href="/privacy" className="hover:text-slate-600">Kebijakan Privasi</a>
          <span>·</span>
          <a href="/terms" className="hover:text-slate-600">Syarat & Ketentuan</a>
          <span>·</span>
          <a href="/contact" className="hover:text-slate-600">Kontak</a>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Home ───────────────────────────────────────────────────────────

function DashboardHome() {
  const { data: me } = useQuery<MeResponse>({ queryKey: ["/api/auth/me"], staleTime: 60_000 });
  const { data: subData } = useQuery<SubMe>({ queryKey: ["/api/subscription/me"] });
  const { data: stats } = useQuery<MyStats>({ queryKey: ["/api/my-stats"] });
  const { data: invitations, isLoading } = useQuery<any[]>({ queryKey: ["/api/my-invitations"] });
  const plan = subData?.plan;
  const maxInv = plan?.maxInvitations ?? 1;
  const Icon = PLAN_ICON_MAP[plan?.slug ?? "gratis"] ?? Zap;
  const realInvitations = invitations?.filter(inv => !inv.slug.startsWith("demo-")) ?? [];

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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: "/dashboard/invitations", bg: "bg-rose-500", Icon: FileText, val: stats?.invitationCount ?? null, label: "Undangan", testId: "stat-undangan" },
          { href: "/dashboard/guests", bg: "bg-emerald-500", Icon: Users, val: stats?.guestCount ?? null, label: "Tamu", testId: "stat-guests" },
          { href: "/dashboard/rsvp", bg: "bg-blue-500", Icon: Users, val: stats?.rsvpCount ?? null, label: "RSVP", testId: "stat-rsvp" },
          { href: "/dashboard/wishes", bg: "bg-violet-500", Icon: MessageSquare, val: stats?.wishCount ?? null, label: "Ucapan", testId: "stat-ucapan" },
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
                Undangan: {realInvitations.length}/{maxInv >= 999 ? "∞" : maxInv}
                {plan && !plan.allowMusic && " · Musik: —"}
                {plan && !plan.allowLoveStory && " · Love Story: —"}
              </p>
            </div>
          </div>
          {plan?.slug === "gratis" && (
            <Link href="/pricing">
              <Button size="sm" variant="outline" className="text-xs" data-testid="button-upgrade-from-home">Upgrade Paket</Button>
            </Link>
          )}
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Undangan Terbaru</h2>
          <Link href="/dashboard/invitations">
            <Button variant="ghost" size="sm" className="text-xs text-slate-500">Lihat Semua</Button>
          </Link>
        </div>
        {isLoading ? (
          <div className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
        ) : !realInvitations.length ? (
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
            {realInvitations.slice(0, 5).map((inv: any) => (
              <Card key={inv.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 truncate">{inv.groomName} & {inv.brideName}</div>
                    <div className="text-xs text-slate-400 mt-0.5">/invite/{inv.slug}</div>
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

const SECTION_TITLES: Record<string, string> = {
  home: "Dashboard",
  invitations: "Undangan Saya",
  new: "Buat Undangan Baru",
  rsvp: "RSVP Tamu",
  wishes: "Ucapan & Doa",
  settings: "Pengaturan Akun",
  billing: "Paket & Tagihan",
  orders: "Pesanan",
};

export default function Dashboard({ section = "home" }: DashboardProps) {
  useSEO({
    title: `${SECTION_TITLES[section] ?? "Dashboard"} — WedSaas`,
    noIndex: true,
  });

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
              {section === "invitations" && <InvitationsSection />}
              {section === "new" && <NewInvitationSection />}
              {section === "rsvp" && <RsvpSection />}
              {section === "wishes" && <WishesSection />}
              {section === "settings" && <SettingsSection />}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </UserGuard>
  );
}
