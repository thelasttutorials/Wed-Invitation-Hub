import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ExternalLink, Save, LayoutTemplate } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const heroSchema = z.object({
  hero_title:       z.string().min(1, "Judul wajib diisi"),
  hero_subtitle:    z.string().min(1, "Subjudul wajib diisi"),
  hero_cta_primary: z.string().min(1, "Teks tombol wajib diisi"),
  hero_cta_link:    z.string().min(1, "Link tombol wajib diisi"),
});

type HeroForm = z.infer<typeof heroSchema>;

const HERO_DEFAULTS: HeroForm = {
  hero_title:       "Undangan Pernikahan Digital yang Tak Terlupakan",
  hero_subtitle:    "Platform undangan pernikahan online terbaik di Indonesia. Elegan, personal, dan mudah dibagikan.",
  hero_cta_primary: "Buat Undangan Sekarang",
  hero_cta_link:    "/admin/new",
};

export default function AdminLanding() {
  const { toast } = useToast();

  const { data: heroData, isLoading } = useQuery<HeroForm>({
    queryKey: ["/api/admin/landing"],
  });

  const form = useForm<HeroForm>({
    resolver: zodResolver(heroSchema),
    defaultValues: HERO_DEFAULTS,
  });

  useEffect(() => {
    if (heroData) form.reset(heroData);
  }, [heroData, form]);

  const mutation = useMutation({
    mutationFn: (data: HeroForm) =>
      apiRequest("PATCH", "/api/admin/landing", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/landing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/landing"] });
      toast({
        title: "Tersimpan",
        description: "Konten hero landing page berhasil diperbarui.",
      });
    },
    onError: () => {
      toast({
        title: "Gagal menyimpan",
        description: "Terjadi kesalahan saat menyimpan. Coba lagi.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: HeroForm) => mutation.mutate(data);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Landing Page</h1>
          <p className="text-slate-500 text-sm mt-0.5">Edit konten hero halaman utama publik</p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" data-testid="button-lihat-halaman">
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Lihat Halaman
          </Button>
        </a>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-primary" />
            <CardTitle className="text-base font-semibold text-slate-800">
              Hero Section
            </CardTitle>
          </div>
          <CardDescription className="text-slate-500 text-sm">
            Konten ini ditampilkan di bagian paling atas halaman utama.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="hero_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul Hero</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          placeholder="Masukkan judul utama..."
                          data-testid="input-hero-title"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hero_subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subjudul Hero</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Masukkan subjudul..."
                          data-testid="input-hero-subtitle"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hero_cta_primary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teks Tombol CTA</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="cth: Buat Undangan Sekarang"
                          data-testid="input-cta-text"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hero_cta_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link Tombol CTA</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="cth: /admin/new atau https://..."
                          data-testid="input-cta-link"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    data-testid="button-simpan-hero"
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {mutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
