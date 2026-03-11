import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SETTING_LABELS: Record<string, string> = {
  hero_title:         "Judul Utama Hero",
  hero_subtitle:      "Subjudul Hero",
  hero_cta_primary:   "Tombol CTA Utama",
  hero_cta_secondary: "Tombol CTA Sekunder",
  features_title:     "Judul Seksi Fitur",
  features_subtitle:  "Subjudul Seksi Fitur",
  pricing_title:      "Judul Seksi Harga",
  pricing_subtitle:   "Subjudul Seksi Harga",
  footer_tagline:     "Tagline Footer",
};

export default function AdminLanding() {
  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/landing-settings"],
  });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Landing Page</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Pengaturan konten halaman utama publik
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Lihat Halaman
            </Button>
          </a>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <Settings2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          Fitur edit konten landing page akan segera hadir. Saat ini kamu bisa melihat
          pengaturan aktif di bawah ini.
        </p>
      </div>

      {/* Settings list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">
            Pengaturan Aktif
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="py-3 space-y-1.5">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))
          ) : settings && Object.keys(settings).length > 0 ? (
            Object.entries(settings).map(([key, value]) => (
              <div key={key} className="py-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="font-mono text-xs bg-slate-100 text-slate-500 border-0"
                    data-testid={`setting-key-${key}`}
                  >
                    {key}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {SETTING_LABELS[key] ?? key}
                  </span>
                </div>
                <p
                  className="text-sm text-slate-700 leading-relaxed"
                  data-testid={`setting-value-${key}`}
                >
                  {value || <span className="text-slate-300 italic">—kosong—</span>}
                </p>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-slate-400 text-sm">
              Belum ada pengaturan tersimpan.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
