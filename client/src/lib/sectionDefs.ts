import {
  ImageIcon, Heart, CalendarDays, Timer, BookOpen, GalleryHorizontal,
  ClipboardCheck, MessageSquare, Gift, MapPin, Sparkles,
} from "lucide-react";

export interface SectionDef {
  id: string;
  label: string;
  description: string;
  Icon: any;
  defaultVisible: boolean;
  group: "essential" | "content" | "interaction";
}

export const SECTION_DEFS: SectionDef[] = [
  { id: "cover",      label: "Cover",          description: "Layar pembuka & tombol buka undangan", Icon: ImageIcon,         defaultVisible: true,  group: "essential" },
  { id: "hero",       label: "Hero Utama",      description: "Foto & nama pasangan full screen",      Icon: Heart,             defaultVisible: true,  group: "essential" },
  { id: "couple",     label: "Profil Pasangan", description: "Data lengkap pengantin & orang tua",    Icon: Heart,             defaultVisible: true,  group: "essential" },
  { id: "countdown",  label: "Hitung Mundur",   description: "Countdown hari menuju pernikahan",       Icon: Timer,             defaultVisible: true,  group: "essential" },
  { id: "event",      label: "Detail Acara",    description: "Waktu, tanggal & lokasi pernikahan",     Icon: CalendarDays,      defaultVisible: true,  group: "essential" },
  { id: "love_story", label: "Love Story",      description: "Timeline cerita perjalanan cinta",       Icon: BookOpen,          defaultVisible: true,  group: "content" },
  { id: "gallery",    label: "Galeri Foto",     description: "Foto-foto prewedding & momen spesial",   Icon: GalleryHorizontal, defaultVisible: true,  group: "content" },
  { id: "rsvp",       label: "RSVP",            description: "Form konfirmasi kehadiran tamu",          Icon: ClipboardCheck,    defaultVisible: true,  group: "interaction" },
  { id: "wishes",     label: "Ucapan & Doa",   description: "Pesan dan ucapan dari tamu undangan",     Icon: MessageSquare,     defaultVisible: true,  group: "interaction" },
  { id: "gift",       label: "Amplop Digital",  description: "Rekening bank dan dompet digital",        Icon: Gift,              defaultVisible: false, group: "interaction" },
  { id: "maps",       label: "Peta Lokasi",     description: "Google Maps embed lokasi pernikahan",     Icon: MapPin,            defaultVisible: true,  group: "content" },
  { id: "closing",    label: "Penutup",         description: "Ucapan penutup dan terima kasih",          Icon: Sparkles,          defaultVisible: true,  group: "essential" },
];

export function getSectionDef(id: string): SectionDef | undefined {
  return SECTION_DEFS.find(s => s.id === id);
}

export interface SectionConfig {
  id: string;
  visible: boolean;
  order: number;
}

export const DEFAULT_SECTIONS: SectionConfig[] = SECTION_DEFS.map((s, i) => ({
  id: s.id,
  visible: s.defaultVisible,
  order: i,
}));

export function parseSectionConfig(raw: string | null | undefined): SectionConfig[] {
  if (!raw) return DEFAULT_SECTIONS;
  try {
    const parsed = JSON.parse(raw) as SectionConfig[];
    // Merge with defaults to ensure all sections are present
    const existing = new Map(parsed.map(s => [s.id, s]));
    const result: SectionConfig[] = [];
    // Add existing in order
    const sorted = [...parsed].sort((a, b) => a.order - b.order);
    for (const s of sorted) {
      if (SECTION_DEFS.find(d => d.id === s.id)) result.push(s);
    }
    // Add any new defaults not in saved config
    for (const def of SECTION_DEFS) {
      if (!existing.has(def.id)) {
        result.push({ id: def.id, visible: def.defaultVisible, order: result.length });
      }
    }
    return result;
  } catch {
    return DEFAULT_SECTIONS;
  }
}
