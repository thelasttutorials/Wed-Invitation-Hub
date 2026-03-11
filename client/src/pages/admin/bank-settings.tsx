import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Building2 } from "lucide-react";

const schema = z.object({
  bankName: z.string().min(1, "Nama bank wajib diisi"),
  accountNumber: z.string().min(1, "Nomor rekening wajib diisi"),
  accountHolder: z.string().min(1, "Nama pemilik wajib diisi"),
  paymentNote: z.string().default(""),
});

type FormData = z.infer<typeof schema>;

export default function AdminBankSettings() {
  const { toast } = useToast();
  const { data: bank, isLoading } = useQuery<any>({ queryKey: ["/api/admin/bank-settings"] });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      bankName: bank?.bankName ?? "",
      accountNumber: bank?.accountNumber ?? "",
      accountHolder: bank?.accountHolder ?? "",
      paymentNote: bank?.paymentNote ?? "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("PATCH", "/api/admin/bank-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bank-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-settings"] });
      toast({ title: "Berhasil", description: "Pengaturan bank berhasil disimpan." });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e?.message, variant: "destructive" }),
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Pengaturan Bank</h1>
        <p className="text-slate-500 text-sm mt-1">Rekening bank yang ditampilkan kepada user untuk transfer</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Informasi Rekening
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
                <FormField control={form.control} name="bankName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Bank</FormLabel>
                    <FormControl><Input placeholder="BCA, BNI, Mandiri, ..." data-testid="input-bank-name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="accountNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Rekening</FormLabel>
                    <FormControl><Input placeholder="1234567890" data-testid="input-account-number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="accountHolder" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Atas Nama</FormLabel>
                    <FormControl><Input placeholder="Nama pemilik rekening" data-testid="input-account-holder" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="paymentNote" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan Pembayaran</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Instruksi untuk user saat transfer..."
                        rows={3}
                        data-testid="input-payment-note"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-bank">
                  {updateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan Pengaturan"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
