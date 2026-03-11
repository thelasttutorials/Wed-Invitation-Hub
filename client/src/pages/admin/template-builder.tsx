import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Save, Eye, EyeOff, Loader2, Monitor, Smartphone,
  GripVertical, Plus, Trash2, Copy, Wand2, CheckCircle2, Layers,
} from "lucide-react";
import { getTheme, ALL_THEMES, type ThemeSlug } from "@/lib/themes";
import { SECTION_DEFS, type SectionConfig, parseSectionConfig, getSectionDef } from "@/lib/sectionDefs";
import type { Template } from "@shared/schema";

// ─── Sortable Section Card ────────────────────────────────────────────────────

function SortableSectionCard({
  section,
  isSelected,
  onSelect,
  onToggleVisible,
  onDuplicate,
  onDelete,
}: {
  section: SectionConfig;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const def = getSectionDef(section.id);
  const Icon = def?.Icon ?? Layers;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-150 ${
        isSelected
          ? "bg-blue-50 border-blue-400 shadow-sm"
          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
      } ${!section.visible ? "opacity-50" : ""}`}
      data-testid={`section-card-${section.id}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-0.5 shrink-0"
        onClick={e => e.stopPropagation()}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-600" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isSelected ? "text-blue-900" : "text-slate-800"}`}>{def?.label ?? section.id}</p>
        <p className="text-xs text-slate-400 truncate">{def?.description ?? ""}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={e => { e.stopPropagation(); onToggleVisible(); }} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600" title={section.visible ? "Sembunyikan" : "Tampilkan"}>
          {section.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        <button onClick={e => { e.stopPropagation(); onDuplicate(); }} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="Duplikat">
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500" title="Hapus">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {!section.visible && (
        <div className="absolute right-2 top-2">
          <EyeOff className="w-3 h-3 text-slate-400" />
        </div>
      )}
    </div>
  );
}

// ─── Section Preview in Canvas ─────────────────────────────────────────────────

function SectionPreview({ section, themeSlug }: { section: SectionConfig; themeSlug: string }) {
  const t = getTheme(themeSlug);
  const def = getSectionDef(section.id);

  const previewContent: Record<string, () => JSX.Element> = {
    cover: () => (
      <div className="h-28 flex items-center justify-center text-center"
        style={{ background: `linear-gradient(135deg, ${t.coverOverlayStart}, ${t.coverOverlayEnd})` }}>
        <div>
          <p className="text-xs mb-1" style={{ color: t.accentColor, fontFamily: t.fontBody }}>Undangan Pernikahan</p>
          <p className="text-2xl font-bold text-white" style={{ fontFamily: t.fontHeading }}>Rizki &amp; Sari</p>
          <div className="mt-2 px-3 py-1 rounded-full inline-block text-xs font-medium mt-2" style={{ background: t.buttonBg, color: t.buttonText }}>
            Buka Undangan
          </div>
        </div>
      </div>
    ),
    hero: () => (
      <div className="h-24 flex items-center justify-center text-center"
        style={{ background: `linear-gradient(135deg, ${t.coverOverlayStart}, ${t.coverOverlayEnd})` }}>
        <div>
          <p className="text-xs mb-1" style={{ color: t.accentColor }}>Bismillahirrahmanirrahim</p>
          <p className="text-xl font-bold text-white" style={{ fontFamily: t.fontHeading }}>Rizki &amp; Sari</p>
        </div>
      </div>
    ),
    couple: () => (
      <div className="p-4" style={{ background: t.sectionAltBg }}>
        <div className="text-center mb-3">
          <div className="h-1 w-12 mx-auto rounded-full mb-2" style={{ background: t.primaryColor }} />
          <p className="font-bold text-sm" style={{ fontFamily: t.fontHeading, color: t.textColor }}>Profil Pasangan</p>
        </div>
        <div className="flex justify-center gap-6">
          {["Rizki Pratama", "Sari Dewi"].map(name => (
            <div key={name} className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full" style={{ background: t.primaryColor + "30", border: `2px solid ${t.primaryColor}` }} />
              <p className="text-xs font-medium" style={{ color: t.textColor }}>{name}</p>
            </div>
          ))}
        </div>
      </div>
    ),
    countdown: () => (
      <div className="p-4 text-center" style={{ background: t.cardBg }}>
        <p className="text-xs mb-2 font-medium" style={{ color: t.textMutedColor }}>Hitung Mundur</p>
        <div className="flex justify-center gap-2">
          {["12", "04", "30", "00"].map((v, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold" style={{ background: t.countdownCardBg, color: t.countdownTextColor }}>{v}</div>
              <span className="text-[9px] mt-0.5" style={{ color: t.textMutedColor }}>{["Hari","Jam","Menit","Detik"][i]}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    event: () => (
      <div className="p-4" style={{ background: t.sectionAltBg }}>
        <p className="text-xs font-semibold mb-2" style={{ color: t.primaryColor, fontFamily: t.fontHeading }}>Detail Acara</p>
        <div className="flex gap-4">
          {["Akad Nikah", "Resepsi"].map(ev => (
            <div key={ev} className="flex-1 p-2 rounded-lg text-center text-xs" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
              <p className="font-semibold" style={{ color: t.textColor }}>{ev}</p>
              <p className="mt-0.5" style={{ color: t.textMutedColor }}>12 Feb 2025</p>
            </div>
          ))}
        </div>
      </div>
    ),
    love_story: () => (
      <div className="p-4" style={{ background: t.cardBg }}>
        <p className="text-xs font-semibold mb-2" style={{ color: t.primaryColor }}>Our Story</p>
        <div className="flex gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: t.primaryColor }} />
            <div className="w-0.5 flex-1" style={{ background: t.dividerColor }} />
          </div>
          <div className="flex-1 text-xs pb-3" style={{ color: t.textMutedColor }}>Pertama kali bertemu...</div>
        </div>
      </div>
    ),
    gallery: () => (
      <div className="p-4" style={{ background: t.sectionAltBg }}>
        <p className="text-xs font-semibold mb-2" style={{ color: t.primaryColor }}>Galeri Foto</p>
        <div className="grid grid-cols-3 gap-1.5">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className="aspect-square rounded" style={{ background: t.primaryColor + "20", border: `1px solid ${t.cardBorder}` }} />
          ))}
        </div>
      </div>
    ),
    rsvp: () => (
      <div className="p-4" style={{ background: t.cardBg }}>
        <p className="text-xs font-semibold mb-2" style={{ color: t.primaryColor }}>Konfirmasi Kehadiran</p>
        <div className="space-y-1.5">
          <div className="h-6 rounded" style={{ background: t.sectionAltBg }} />
          <div className="h-6 rounded" style={{ background: t.sectionAltBg }} />
          <div className="h-7 rounded text-xs flex items-center justify-center font-medium" style={{ background: t.buttonBg, color: t.buttonText }}>
            Kirim RSVP
          </div>
        </div>
      </div>
    ),
    wishes: () => (
      <div className="p-4" style={{ background: t.sectionAltBg }}>
        <p className="text-xs font-semibold mb-2" style={{ color: t.primaryColor }}>Ucapan & Doa</p>
        <div className="space-y-1.5">
          {[0,1].map(i => (
            <div key={i} className="p-2 rounded text-xs" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, color: t.textMutedColor }}>
              Selamat menempuh hidup baru...
            </div>
          ))}
        </div>
      </div>
    ),
    gift: () => (
      <div className="p-4 text-center" style={{ background: t.cardBg }}>
        <p className="text-xs font-semibold mb-2" style={{ color: t.primaryColor }}>Amplop Digital</p>
        <div className="flex justify-center gap-3">
          {["BCA", "GoPay"].map(b => (
            <div key={b} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: t.sectionAltBg, border: `1px solid ${t.cardBorder}`, color: t.textColor }}>
              {b}
            </div>
          ))}
        </div>
      </div>
    ),
    maps: () => (
      <div className="p-4" style={{ background: t.sectionAltBg }}>
        <p className="text-xs font-semibold mb-2" style={{ color: t.primaryColor }}>Lokasi</p>
        <div className="h-16 rounded-lg flex items-center justify-center text-xs" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, color: t.textMutedColor }}>
          Peta Google Maps
        </div>
      </div>
    ),
    closing: () => (
      <div className="p-4 text-center" style={{ background: `linear-gradient(135deg, ${t.coverOverlayStart}, ${t.coverOverlayEnd})` }}>
        <p className="text-xs text-white/80 mb-1">Terima kasih telah hadir</p>
        <p className="text-sm font-bold text-white" style={{ fontFamily: t.fontHeading }}>Rizki &amp; Sari</p>
        <div className="mt-2 h-0.5 w-10 mx-auto rounded" style={{ background: t.accentColor }} />
      </div>
    ),
  };

  const Render = previewContent[section.id] ?? (() => (
    <div className="p-4 text-center text-xs" style={{ background: t.sectionAltBg, color: t.textMutedColor }}>
      {def?.label ?? section.id}
    </div>
  ));

  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: t.cardBorder }}>
      <Render />
    </div>
  );
}

// ─── Right Panel: Property Editor ────────────────────────────────────────────

type RightTab = "theme" | "section";

function ThemePanel({
  template,
  customColors,
  setCustomColors,
}: {
  template: Template;
  customColors: Record<string, string>;
  setCustomColors: (c: Record<string, string>) => void;
}) {
  const t = getTheme(template.themeSlug);
  const COLORS = [
    { key: "primaryColor", label: "Warna Utama", value: customColors.primaryColor ?? t.primaryColor },
    { key: "secondaryColor", label: "Warna Sekunder", value: customColors.secondaryColor ?? t.secondaryColor },
    { key: "backgroundColor", label: "Latar Belakang", value: customColors.backgroundColor ?? t.backgroundColor },
    { key: "textColor", label: "Warna Teks", value: customColors.textColor ?? t.textColor },
    { key: "accentColor", label: "Aksen", value: customColors.accentColor ?? t.accentColor },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Pilih Tema</p>
        <div className="grid grid-cols-2 gap-2">
          {ALL_THEMES.map(th => (
            <div
              key={th.slug}
              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${template.themeSlug === th.slug ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
              data-testid={`button-theme-${th.slug}`}
            >
              <div className="w-5 h-5 rounded-full shrink-0" style={{ background: `linear-gradient(135deg, ${th.primaryColor}, ${th.accentColor})` }} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-800 leading-none truncate">{th.name}</p>
                {th.badge && <p className="text-[9px] text-slate-400">{th.badge}</p>}
              </div>
              {template.themeSlug === th.slug && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 ml-auto shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Override Warna</p>
        <div className="space-y-2.5">
          {COLORS.map(({ key, label, value }) => (
            <div key={key} className="flex items-center gap-2.5">
              <input
                type="color"
                value={value}
                onChange={e => setCustomColors({ ...customColors, [key]: e.target.value })}
                className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                title={label}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 leading-none">{label}</p>
                <p className="text-[10px] text-slate-400 font-mono">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionPanel({ section }: { section: SectionConfig | null }) {
  const def = section ? getSectionDef(section.id) : null;
  const Icon = def?.Icon ?? Layers;

  if (!section || !def) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center">
        <Layers className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-xs text-slate-400">Pilih section di canvas untuk edit</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
        <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center">
          <Icon className="w-4 h-4 text-slate-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-900 text-sm">{def.label}</p>
          <p className="text-xs text-slate-500 leading-snug">{def.description}</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Properti Section</p>
        <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
          <span className="text-xs text-slate-700">Visibilitas</span>
          <span className={`text-xs font-medium ${section.visible ? "text-green-600" : "text-slate-400"}`}>
            {section.visible ? "Ditampilkan" : "Disembunyikan"}
          </span>
        </div>
        <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
          <span className="text-xs text-slate-700">Urutan</span>
          <span className="text-xs font-medium text-slate-700">{section.order + 1}</span>
        </div>
        <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
          <span className="text-xs text-slate-700">Grup</span>
          <span className="text-xs font-medium text-slate-700 capitalize">{def.group}</span>
        </div>
      </div>

      <div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Konten section ini (teks, foto, dll.) diisi dari data undangan masing-masing pasangan, bukan dari builder.
        </p>
      </div>
    </div>
  );
}

// ─── Main Template Builder ────────────────────────────────────────────────────

export default function TemplateBuilder() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const templateId = parseInt(id);

  const { data: template, isLoading } = useQuery<Template>({
    queryKey: ["/api/admin/templates", templateId],
    queryFn: () => fetch(`/api/admin/templates/${templateId}`).then(r => r.json()),
    enabled: !isNaN(templateId),
  });

  const [sections, setSections] = useState<SectionConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [customColors, setCustomColors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("theme");
  const [paletteSearch, setPaletteSearch] = useState("");

  useEffect(() => {
    if (template) {
      setSections(parseSectionConfig(template.sectionsConfig));
      if (template.themeConfig) {
        try { setCustomColors(JSON.parse(template.themeConfig)); } catch {}
      }
    }
  }, [template]);

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/templates/${templateId}`, {
      sectionsConfig: JSON.stringify(sections),
      themeConfig: Object.keys(customColors).length > 0 ? JSON.stringify(customColors) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates", templateId] });
      setIsDirty(false);
      toast({ title: "Tersimpan!", description: "Template berhasil disimpan." });
    },
    onError: (e: any) => toast({ title: "Gagal menyimpan", description: e?.message, variant: "destructive" }),
  });

  const togglePublish = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/templates/${templateId}`, { isPublished: !template?.isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates", templateId] });
      toast({ title: template?.isPublished ? "Dinonaktifkan" : "Dipublikasi!", description: "Status template berhasil diubah." });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e?.message, variant: "destructive" }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    setSections(prev => {
      const oldIdx = prev.findIndex(s => s.id === active.id);
      const newIdx = prev.findIndex(s => s.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;
      const moved = arrayMove(prev, oldIdx, newIdx);
      return moved.map((s, i) => ({ ...s, order: i }));
    });
    setIsDirty(true);
  }

  const addSection = useCallback((sectionId: string) => {
    setSections(prev => {
      if (prev.some(s => s.id === sectionId)) {
        toast({ description: "Section ini sudah ada di canvas." });
        return prev;
      }
      setIsDirty(true);
      return [...prev, { id: sectionId, visible: true, order: prev.length }];
    });
  }, [toast]);

  const removeSection = useCallback((sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId).map((s, i) => ({ ...s, order: i })));
    if (selectedId === sectionId) setSelectedId(null);
    setIsDirty(true);
  }, [selectedId]);

  const toggleVisible = useCallback((sectionId: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, visible: !s.visible } : s));
    setIsDirty(true);
  }, []);

  const duplicateSection = useCallback((sectionId: string) => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === sectionId);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: `${sectionId}_copy_${Date.now()}`, order: prev.length };
      return [...prev, copy].map((s, i) => ({ ...s, order: i }));
    });
    setIsDirty(true);
  }, []);

  const handleSectionSelect = (sectionId: string) => {
    setSelectedId(sectionId === selectedId ? null : sectionId);
    setRightTab("section");
  };

  const currentTheme = getTheme(template?.themeSlug ?? "romantic-floral");
  const visibleSections = sections.filter(s => s.visible);
  const availableSections = SECTION_DEFS.filter(
    def => !sections.some(s => s.id === def.id) &&
    (!paletteSearch || def.label.toLowerCase().includes(paletteSearch.toLowerCase()))
  );
  const activeSectionDef = activeId ? getSectionDef(activeId) : null;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <p className="text-slate-600 mb-3">Template tidak ditemukan.</p>
          <Button variant="outline" onClick={() => navigate("/admin/templates")}>Kembali</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* ── Top Toolbar ── */}
      <div className="bg-white border-b border-slate-200 px-4 h-14 flex items-center gap-3 shrink-0 z-10 shadow-sm">
        <button onClick={() => navigate("/admin/templates")} className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="h-5 w-px bg-slate-200" />
        <div className="flex items-center gap-2 min-w-0">
          <Wand2 className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-900 truncate text-sm">{template.name}</span>
          {template.badge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: currentTheme.primaryColor + "20", color: currentTheme.primaryColor }}>
              {template.badge}
            </span>
          )}
        </div>
        {isDirty && <span className="text-xs text-amber-500 font-medium">● Belum disimpan</span>}

        <div className="flex items-center gap-1 ml-auto border border-slate-200 rounded-lg p-0.5">
          <button
            onClick={() => setPreviewMode("desktop")}
            className={`p-1.5 rounded-md transition-colors ${previewMode === "desktop" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-700"}`}
            title="Preview Desktop"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPreviewMode("mobile")}
            className={`p-1.5 rounded-md transition-colors ${previewMode === "mobile" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-700"}`}
            title="Preview Mobile"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={() => togglePublish.mutate()}
          disabled={togglePublish.isPending}
        >
          {togglePublish.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : (
            template.isPublished ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />
          )}
          {template.isPublished ? "Nonaktifkan" : "Publikasi"}
        </Button>

        <Button
          size="sm"
          className="h-8 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          data-testid="button-save-template"
        >
          {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Simpan
        </Button>
      </div>

      {/* ── 3-Panel Layout ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Panel: Section Palette */}
        <div className="w-56 bg-white border-r border-slate-200 flex flex-col overflow-hidden shrink-0">
          <div className="p-3 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Section Tersedia</p>
            <div className="relative">
              <input
                value={paletteSearch}
                onChange={e => setPaletteSearch(e.target.value)}
                placeholder="Cari section..."
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 pl-7 outline-none focus:border-blue-400 bg-slate-50"
              />
              <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {availableSections.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 px-2">
                {paletteSearch ? "Tidak ditemukan" : "Semua section sudah ditambahkan"}
              </p>
            ) : (
              availableSections.map(def => {
                const Icon = def.Icon;
                return (
                  <button
                    key={def.id}
                    onClick={() => addSection(def.id)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-colors text-left group"
                    data-testid={`palette-section-${def.id}`}
                    title={`Tambah section ${def.label}`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 group-hover:text-blue-700 truncate">{def.label}</p>
                    </div>
                    <Plus className="w-3 h-3 text-slate-300 group-hover:text-blue-400 ml-auto shrink-0" />
                  </button>
                );
              })
            )}
          </div>

          {sections.length > 0 && (
            <div className="p-2.5 border-t border-slate-100">
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-slate-500 font-medium">{visibleSections.length} section aktif</p>
                <p className="text-[10px] text-slate-400">{sections.length - visibleSections.length} tersembunyi</p>
              </div>
            </div>
          )}
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
          <div className={`w-full transition-all duration-300 ${previewMode === "mobile" ? "max-w-[375px]" : "max-w-2xl"}`}>
            <div className="mb-4 text-center">
              <p className="text-xs text-slate-400 font-medium">
                {previewMode === "mobile" ? "📱 Preview Mobile (375px)" : "🖥️ Preview Desktop"}
              </p>
            </div>

            {sections.length === 0 ? (
              <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-white p-16 text-center">
                <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-500 mb-1">Canvas Kosong</p>
                <p className="text-sm text-slate-400">Klik section di panel kiri untuk menambahkan ke canvas</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2.5 bg-white rounded-2xl border border-slate-200 overflow-hidden p-3">
                    {sections.map(section => (
                      <div key={section.id} className="space-y-1.5">
                        <SortableSectionCard
                          section={section}
                          isSelected={selectedId === section.id}
                          onSelect={() => handleSectionSelect(section.id)}
                          onToggleVisible={() => toggleVisible(section.id)}
                          onDuplicate={() => duplicateSection(section.id)}
                          onDelete={() => removeSection(section.id)}
                        />
                        {selectedId === section.id && section.visible && (
                          <div className="ml-14 mr-2">
                            <SectionPreview section={section} themeSlug={template.themeSlug} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeSectionDef && (
                    <div className="bg-white shadow-xl rounded-xl border border-blue-300 px-4 py-3 flex items-center gap-3 opacity-95">
                      <GripVertical className="w-4 h-4 text-slate-400" />
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <activeSectionDef.Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-800">{activeSectionDef.label}</p>
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>

        {/* Right Panel: Properties */}
        <div className="w-64 bg-white border-l border-slate-200 flex flex-col overflow-hidden shrink-0">
          <div className="px-4 border-b border-slate-100 flex">
            {(["theme", "section"] as RightTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${rightTab === tab ? "border-blue-500 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                {tab === "theme" ? "🎨 Tema" : "⚙️ Section"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {rightTab === "theme" ? (
              <ThemePanel
                template={template}
                customColors={customColors}
                setCustomColors={c => { setCustomColors(c); setIsDirty(true); }}
              />
            ) : (
              <SectionPanel
                section={sections.find(s => s.id === selectedId) ?? null}
              />
            )}
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50">
            <Button
              className="w-full h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !isDirty}
              data-testid="button-save-template-bottom"
            >
              {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isDirty ? "Simpan Perubahan" : "Tersimpan"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
