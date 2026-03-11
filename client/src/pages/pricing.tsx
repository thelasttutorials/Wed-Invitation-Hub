import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useSEO } from "@/lib/seo";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Star, Crown, Loader2, Heart } from "lucide-react";
import type { PricingPlan } from "@shared/schema";

interface SubMe { subscription: any; plan: PricingPlan }

const PLAN_ICONS: Record<string, any> = { gratis: Zap, premium: Star, pro: Crown };
const PLAN_COLORS: Record<string, string> = {
  gratis: "border-slate-200",
  premium: "border-rose-400 ring-2 ring-rose-400",
  pro: "border-violet-400 ring-2 ring-violet-400",
};
const BTN_COLORS: Record<string, string> = {
  gratis: "bg-slate-700 hover:bg-slate-800 text-white",
  premium: "bg-rose-500 hover:bg-rose-600 text-white",
  pro: "bg-violet-600 hover:bg-violet-700 text-white",
};

function formatPrice(price: number) {
  if (price === 0) return "Gratis";
  return `Rp ${price.toLocaleString("id-ID")}`;
}

function planFeatures(plan: PricingPlan): string[] {
  const f: string[] = [];
  const inv = plan.maxInvitations >= 999 ? "Undangan unlimited" : `${plan.maxInvitations} undangan`;
  const gal = plan.maxGalleryPhotos >= 999 ? "Galeri unlimited" : `${plan.maxGalleryPhotos} foto galeri`;
  f.push(inv, gal);
  f.push("RSVP tamu aktif", "Ucapan tamu aktif");
  if (plan.allowMusic) f.push("Background musik");
  if (plan.allowLoveStory) f.push("Love story timeline");
  if (plan.allowGift) f.push("Amplop digital");
  if (plan.allowPremiumTemplates) f.push("Template premium");
  if (plan.allowCustomDomain) f.push("Custom domain");
  return f;
}

export default function PricingPage() {
  useSEO({
    title: "Harga & Paket — WedSaas",
    description: "Pilih paket undangan pernikahan digital yang sesuai kebutuhanmu. Mulai gratis, upgrade kapan saja. Paket Premium dan Pro tersedia.",
  });

  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: plans, isLoading: plansLoading } = useQuery<PricingPlan[]>({ queryKey: ["/api/pricing"] });
  const { data: me } = useQuery({ queryKey: ["/api/auth/me"], retry: false });
  const { data: subData } = useQuery<SubMe>({ queryKey: ["/api/subscription/me"], retry: false, enabled: !!me });

  const startFreeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/subscriptions/start-free", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/me"] });
      toast({ title: "Berhasil!", description: "Paket Gratis telah aktif. Selamat membuat undangan!" });
      navigate("/dashboard");
    },
    onError: (e: any) => toast({ title: "Gagal", description: e?.message ?? "Coba lagi.", variant: "destructive" }),
  });

  const orderMutation = useMutation({
    mutationFn: (planId: number) => apiRequest("POST", "/api/orders", { planId }),
    onSuccess: (_data, planId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/me"] });
      navigate("/dashboard/billing");
    },
    onError: (e: any) => toast({ title: "Gagal", description: e?.message ?? "Coba lagi.", variant: "destructive" }),
  });

  function handleChoosePlan(plan: PricingPlan) {
    if (!me) { navigate("/login"); return; }
    if (plan.slug === "gratis") { startFreeMutation.mutate(); return; }
    orderMutation.mutate(plan.id);
  }

  const currentPlanSlug = subData?.plan?.slug;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <header className="px-6 py-5 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 fill-white text-white" />
            </div>
            <span className="font-bold text-slate-900">WedSaas</span>
          </a>
          {me ? (
            <a href="/dashboard">
              <Button variant="outline" size="sm">Dashboard</Button>
            </a>
          ) : (
            <a href="/login">
              <Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white">Masuk</Button>
            </a>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Pilih Paket yang Tepat</h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Mulai gratis, upgrade kapan saja. Semua paket termasuk RSVP dan ucapan tamu.
          </p>
        </div>

        {plansLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans?.map((plan) => {
              const Icon = PLAN_ICONS[plan.slug] ?? Star;
              const isCurrent = currentPlanSlug === plan.slug;
              const isPopular = plan.slug === "premium";
              return (
                <div
                  key={plan.id}
                  data-testid={`card-plan-${plan.slug}`}
                  className={`relative rounded-2xl border bg-white p-6 flex flex-col ${PLAN_COLORS[plan.slug] ?? "border-slate-200"}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full">Paling Populer</span>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-green-500 text-white text-xs">Paket Aktif</Badge>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${plan.slug === "gratis" ? "bg-slate-100" : plan.slug === "premium" ? "bg-rose-100" : "bg-violet-100"}`}>
                      <Icon className={`w-5 h-5 ${plan.slug === "gratis" ? "text-slate-600" : plan.slug === "premium" ? "text-rose-500" : "text-violet-600"}`} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
                    <p className="text-slate-500 text-sm mt-1">{plan.description}</p>
                  </div>

                  <div className="mb-6">
                    <span className="text-3xl font-bold text-slate-900">{formatPrice(plan.price)}</span>
                    {plan.price > 0 && <span className="text-slate-400 text-sm ml-1">/seumur hidup</span>}
                  </div>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {planFeatures(plan).map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${BTN_COLORS[plan.slug] ?? ""}`}
                    onClick={() => handleChoosePlan(plan)}
                    disabled={isCurrent || startFreeMutation.isPending || orderMutation.isPending}
                    data-testid={`button-choose-${plan.slug}`}
                  >
                    {startFreeMutation.isPending && plan.slug === "gratis" ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengaktifkan...</>
                    ) : isCurrent ? (
                      "Paket Aktif"
                    ) : plan.slug === "gratis" ? (
                      "Mulai Gratis"
                    ) : (
                      `Pilih ${plan.name}`
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-10">
          Paket Premium dan Pro diaktifkan setelah admin mengonfirmasi pembayaran transfer bank.
        </p>
      </main>
    </div>
  );
}
