import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Loader2, Check, X } from "lucide-react";
import { useState } from "react";
import type { PricingPlan } from "@shared/schema";

const editSchema = z.object({
  price: z.coerce.number().int().min(0),
  description: z.string().min(1),
  maxInvitations: z.coerce.number().int().min(1),
  maxGalleryPhotos: z.coerce.number().int().min(1),
});

type EditForm = z.infer<typeof editSchema>;

function PlanCard({ plan }: { plan: PricingPlan }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);

  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      price: plan.price,
      description: plan.description,
      maxInvitations: plan.maxInvitations >= 999 ? 999 : plan.maxInvitations,
      maxGalleryPhotos: plan.maxGalleryPhotos >= 999 ? 999 : plan.maxGalleryPhotos,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditForm) => apiRequest("PATCH", `/api/admin/pricing/${plan.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing"] });
      toast({ title: "Berhasil", description: `Paket ${plan.name} berhasil diperbarui.` });
      setEditing(false);
    },
    onError: (e: any) => toast({ title: "Gagal", description: e?.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{plan.name}</CardTitle>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} data-testid={`button-edit-plan-${plan.id}`}>
              <Pencil className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!editing ? (
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Harga</span><span className="font-medium">Rp {plan.price.toLocaleString("id-ID")}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Max Undangan</span><span className="font-medium">{plan.maxInvitations >= 999 ? "Unlimited" : plan.maxInvitations}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Max Galeri</span><span className="font-medium">{plan.maxGalleryPhotos >= 999 ? "Unlimited" : plan.maxGalleryPhotos}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Musik</span><span>{plan.allowMusic ? "✓" : "✗"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Love Story</span><span>{plan.allowLoveStory ? "✓" : "✗"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Amplop Digital</span><span>{plan.allowGift ? "✓" : "✗"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Custom Domain</span><span>{plan.allowCustomDomain ? "✓" : "✗"}</span></div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => updateMutation.mutate(d))} className="space-y-3">
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem><FormLabel>Harga (Rp)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Deskripsi</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="maxInvitations" render={({ field }) => (
                <FormItem><FormLabel>Maks Undangan (999=∞)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="maxGalleryPhotos" render={({ field }) => (
                <FormItem><FormLabel>Maks Galeri (999=∞)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={updateMutation.isPending} data-testid={`button-save-plan-${plan.id}`}>
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" />Simpan</>}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}><X className="w-4 h-4 mr-1" />Batal</Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminPricing() {
  const { data: plans, isLoading } = useQuery<PricingPlan[]>({ queryKey: ["/api/admin/pricing"] });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Pengaturan Paket</h1>
        <p className="text-slate-500 text-sm mt-1">Ubah harga dan konfigurasi paket langganan</p>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0,1,2].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans?.map(plan => <PlanCard key={plan.id} plan={plan} />)}
        </div>
      )}
    </div>
  );
}
