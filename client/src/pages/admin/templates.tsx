import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Wand2, Eye, Search } from "lucide-react";
import { getTheme, ALL_THEMES, type ThemeSlug } from "@/lib/themes";
import { useState } from "react";
import type { Template } from "@shared/schema";

function ThemeThumbnail({ themeSlug, size = "lg" }: { themeSlug: string; size?: "sm" | "lg" }) {
  const t = getTheme(themeSlug);
  const h = size === "lg" ? "h-36" : "h-24";
  return (
    <div
      className={`${h} w-full rounded-xl overflow-hidden relative flex flex-col`}
      style={{ background: t.backgroundColor, border: `1.5px solid ${t.cardBorder}` }}
    >
      <div
        className="flex-1 flex items-center justify-center relative"
        style={{
          background: `linear-gradient(135deg, ${t.coverOverlayStart} 0%, ${t.coverOverlayEnd} 100%)`,
        }}
      >
        <div className="text-center px-4 py-3">
          <p className="text-xs font-medium mb-1" style={{ color: t.accentColor, letterSpacing: "0.15em", fontFamily: t.fontBody }}>
            UNDANGAN PERNIKAHAN
          </p>
          <p className="text-white font-bold leading-tight" style={{ fontFamily: t.fontHeading, fontSize: size === "lg" ? "1.1rem" : "0.85rem" }}>
            Rizki & Sari
          </p>
          <div className="mt-2 px-3 py-1 rounded-full inline-block text-xs font-medium"
            style={{ background: t.buttonBg, color: t.buttonText, fontFamily: t.fontBody }}>
            Buka Undangan
          </div>
        </div>
      </div>
      <div className="px-3 py-2 flex justify-between items-center" style={{ background: t.cardBg }}>
        <div className="flex gap-1">
          {[1,2,3].map(i => (
            <div key={i} className="w-6 h-6 rounded" style={{ background: t.sectionAltBg, border: `1px solid ${t.cardBorder}` }} />
          ))}
        </div>
        <div className="h-1.5 w-16 rounded-full" style={{ background: t.dividerColor }} />
      </div>
    </div>
  );
}

function TemplateCard({ template }: { template: Template }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const theme = getTheme(template.themeSlug);

  const togglePublish = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/templates/${template.id}`, { isPublished: !template.isPublished }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] }),
    onError: (e: any) => toast({ title: "Gagal", description: e?.message, variant: "destructive" }),
  });

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-200 group"
      data-testid={`card-template-${template.id}`}
    >
      <div className="p-4 pb-3">
        <ThemeThumbnail themeSlug={template.themeSlug} />
      </div>

      <div className="px-4 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900">{template.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{template.description}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {template.badge && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: theme.primaryColor + "20", color: theme.primaryColor }}
              >
                {template.badge}
              </span>
            )}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${template.isPublished ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
              {template.isPublished ? "Aktif" : "Draft"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            className="flex-1 h-8 text-xs gap-1.5"
            style={{ background: theme.primaryColor, color: theme.buttonText }}
            onClick={() => navigate(`/admin/templates/${template.id}/builder`)}
            data-testid={`button-edit-template-${template.id}`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            Builder
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-2.5" asChild>
            <a href={`/invite/demo-${template.themeSlug}`} target="_blank" rel="noopener noreferrer">
              <Eye className="w-3.5 h-3.5" />
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs"
            onClick={() => togglePublish.mutate()}
            disabled={togglePublish.isPending}
          >
            {togglePublish.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : template.isPublished ? "Nonaktifkan" : "Aktifkan"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTemplates() {
  const [search, setSearch] = useState("");
  const { data: templates, isLoading } = useQuery<Template[]>({ queryKey: ["/api/admin/templates"] });

  const filtered = templates?.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.themeSlug.includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Template Undangan</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola template dan kustomisasi desain per tema</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Cari template..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 w-48 h-9"
            data-testid="input-search-template"
          />
        </div>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        {ALL_THEMES.map(theme => (
          <div key={theme.slug} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ background: theme.primaryColor }} />
            <span className="font-medium text-slate-700">{theme.name}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[0,1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 h-72 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered?.map(template => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
