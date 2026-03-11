import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Wand2, Eye, Plus, Search, Palette } from "lucide-react";
import { getTheme, ALL_THEMES } from "@/lib/themes";
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
          {[1, 2, 3].map(i => (
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
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 truncate">{template.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{template.description || "—"}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-mono truncate">/{template.slug}</p>
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
            <a href={`/demo/${template.themeSlug}`} target="_blank" rel="noopener noreferrer" data-testid={`button-preview-template-${template.id}`}>
              <Eye className="w-3.5 h-3.5" />
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs"
            onClick={() => togglePublish.mutate()}
            disabled={togglePublish.isPending}
            data-testid={`button-toggle-template-${template.id}`}
          >
            {togglePublish.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : template.isPublished ? "Nonaktifkan" : "Aktifkan"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function NewTemplateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [themeSlug, setThemeSlug] = useState("romantic-floral");
  const [badge, setBadge] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [slugManual, setSlugManual] = useState(false);

  function handleNameChange(v: string) {
    setName(v);
    if (!slugManual) {
      setSlug(v.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
    }
  }

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/admin/templates", { name, slug, description, themeSlug, badge, isPublished }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
      toast({ title: "Tema berhasil dibuat!" });
      onClose();
      if (data?.id) navigate(`/admin/templates/${data.id}/builder`);
    },
    onError: (e: any) => toast({ title: "Gagal membuat tema", description: e?.message, variant: "destructive" }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast({ title: "Nama tema wajib diisi", variant: "destructive" });
    if (!slug.trim()) return toast({ title: "Slug wajib diisi", variant: "destructive" });
    createMutation.mutate();
  }

  function handleClose() {
    setName(""); setSlug(""); setDescription(""); setThemeSlug("romantic-floral");
    setBadge(""); setIsPublished(true); setSlugManual(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-slate-500" />
            Buat Tema Baru
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="nt-name">Nama Tema <span className="text-red-500">*</span></Label>
            <Input
              id="nt-name"
              placeholder="cth: Blossom Sakura"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              data-testid="input-new-template-name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nt-slug">Slug <span className="text-red-500">*</span></Label>
            <Input
              id="nt-slug"
              placeholder="cth: blossom-sakura"
              value={slug}
              onChange={e => { setSlugManual(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); }}
              className="font-mono text-sm"
              data-testid="input-new-template-slug"
            />
            <p className="text-[11px] text-slate-400">Hanya huruf kecil, angka, dan tanda -</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nt-desc">Deskripsi</Label>
            <Textarea
              id="nt-desc"
              placeholder="Deskripsi singkat tema..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="resize-none h-16 text-sm"
              data-testid="input-new-template-description"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Gaya Tema</Label>
              <Select value={themeSlug} onValueChange={setThemeSlug}>
                <SelectTrigger data-testid="select-new-template-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_THEMES.map(t => (
                    <SelectItem key={t.slug} value={t.slug}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: t.primaryColor }} />
                        {t.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nt-badge">Badge (opsional)</Label>
              <Input
                id="nt-badge"
                placeholder="cth: Baru, Premium"
                value={badge}
                onChange={e => setBadge(e.target.value)}
                data-testid="input-new-template-badge"
              />
            </div>
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-slate-700">Publikasikan sekarang</p>
              <p className="text-xs text-slate-400">Tema langsung tampil di library</p>
            </div>
            <Switch
              checked={isPublished}
              onCheckedChange={setIsPublished}
              data-testid="switch-new-template-published"
            />
          </div>

          {themeSlug && (
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <ThemeThumbnail themeSlug={themeSlug} size="sm" />
            </div>
          )}

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" onClick={handleClose} disabled={createMutation.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={createMutation.isPending} data-testid="button-create-template-submit">
              {createMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Membuat...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" />Buat Tema</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminTemplates() {
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const { data: templates, isLoading } = useQuery<Template[]>({ queryKey: ["/api/admin/templates"] });

  const filtered = templates?.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.themeSlug.includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <NewTemplateDialog open={showNew} onClose={() => setShowNew(false)} />

      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Theme Library</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isLoading ? "Memuat..." : `${templates?.length ?? 0} tema tersedia`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Cari tema..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-44 h-9"
              data-testid="input-search-template"
            />
          </div>
          <Button
            onClick={() => setShowNew(true)}
            className="h-9 gap-2"
            data-testid="button-create-new-template"
          >
            <Plus className="w-4 h-4" />
            Buat Tema Baru
          </Button>
        </div>
      </div>

      <div className="mb-5 flex gap-2 flex-wrap">
        {ALL_THEMES.map(theme => (
          <div key={theme.slug} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ background: theme.primaryColor }} />
            <span className="font-medium text-slate-700">{theme.name}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 h-72 animate-pulse" />
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {filtered.map(template => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-400">
          <Palette className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">{search ? "Tidak ada tema yang cocok" : "Belum ada tema"}</p>
          {!search && (
            <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowNew(true)}>
              <Plus className="w-4 h-4" />
              Buat Tema Pertama
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
