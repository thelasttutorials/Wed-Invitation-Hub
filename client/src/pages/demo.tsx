import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useSEO } from "@/lib/seo";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  MapPin, Calendar, Clock, Heart, ChevronDown,
  Share2, ExternalLink, Music2, Pause, ArrowUp, Users, Send, CheckCircle2,
} from "lucide-react";
import type { Invitation, LoveStoryItem, Wish, Template } from "@shared/schema";
import { getTheme } from "@/lib/themes";
import { parseSectionConfig } from "@/lib/sectionDefs";

interface InvitationData {
  invitation: Invitation;
  loveStory: LoveStoryItem[];
  guestbook: Wish[];
}

function useCountdown(targetDate: string | null | undefined) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return time;
}

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 min-w-[60px] text-center border border-white/20">
        <span className="text-3xl font-bold text-white" data-testid={`countdown-${label.toLowerCase()}`}>
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-white/70 text-xs mt-1 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

// Sample data for demo
const SAMPLE_INVITATION: Partial<Invitation> = {
  groomName: "Budi",
  brideName: "Sari",
  groomParents: "Putra dari Bpk. Bambang & Ibu Siti",
  brideParents: "Putri dari Bpk. Slamet & Ibu Ani",
  akadDate: "2025-06-15",
  receptionDate: "2025-06-15",
  akadTime: "09:00 - 10:00 WIB",
  receptionTime: "11:00 - 13:00 WIB",
  venueName: "Gedung Serbaguna Jakarta",
  venueAddress: "Jl. Gatot Subroto No. 1, Jakarta Selatan",
  mapsUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.273187216694!2d106.81534431533682!3d-6.227690195491953!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f3e498708f3d%3A0xf693e5077464303d!2sBalai%20Kartini!5e0!3m2!1sid!2sid!4v1622112345678!5m2!1sid!2sid",
  openingQuote: "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.",
  coverPhotoUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
  musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  galleryPhotos: [
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80",
    "https://images.unsplash.com/photo-1522673607200-1648835ede57?w=800&q=80",
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
  ],
};

const SAMPLE_LOVE_STORY: LoveStoryItem[] = [
  { id: 1, invitationId: 0, title: "Pertama Bertemu", description: "Kami bertemu pertama kali di sebuah cafe saat masa kuliah.", dateLabel: "Januari 2020", photoUrl: "https://images.unsplash.com/photo-1523301343968-6a6ebf63c672?w=600&q=80", sortOrder: 0, createdAt: new Date() },
  { id: 2, invitationId: 0, title: "Menjalin Hubungan", description: "Setelah setahun berteman, kami memutuskan untuk menjalin hubungan.", dateLabel: "Februari 2021", photoUrl: "https://images.unsplash.com/photo-1516589174184-e6646f65ee74?w=600&q=80", sortOrder: 1, createdAt: new Date() },
  { id: 3, invitationId: 0, title: "Lamaran", description: "Budi melamar Sari di depan keluarga besar.", dateLabel: "Maret 2024", photoUrl: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&q=80", sortOrder: 2, createdAt: new Date() },
];

const SAMPLE_WISHES: Wish[] = [
  { id: 1, invitationId: 0, guestName: "Andi & Rina", message: "Selamat ya Budi dan Sari! Semoga samawa.", createdAt: new Date() },
  { id: 2, invitationId: 0, guestName: "Eko", message: "Mantap Bud! Akhirnya nyusul juga.", createdAt: new Date() },
];

export default function DemoPage() {
  const { slug } = useParams<{ slug: string }>();
  const [opened, setOpened] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: template, isLoading } = useQuery<Template>({
    queryKey: ["/api/templates", slug],
  });

  useSEO({
    title: template
      ? `Demo Tema ${template.name} — WedSaas`
      : "Demo Tema Undangan Pernikahan — WedSaas",
    description: template
      ? `Lihat demo tema undangan pernikahan digital ${template.name}. Elegan, modern, dan mudah disesuaikan.`
      : "Lihat demo tema undangan pernikahan digital WedSaas yang elegan dan modern.",
  });

  const countdown = useCountdown(SAMPLE_INVITATION.receptionDate);

  useEffect(() => {
    const handleScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const url = SAMPLE_INVITATION.musicUrl;
    if (!url || audioRef.current) return;
    audioRef.current = new Audio(url);
    audioRef.current.loop = true;
  }, []);

  const handleOpen = () => {
    setOpened(true);
    if (audioRef.current) audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 300);
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {}); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1209]">
        <div className="text-center space-y-3">
          <Heart className="w-10 h-10 text-rose-400 animate-pulse mx-auto" />
          <p className="text-white/60 font-medium">Memuat demo template...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1209] px-6">
        <div className="text-center space-y-4 max-w-sm">
          <h2 className="text-white text-2xl font-semibold">Template Tidak Ditemukan</h2>
          <p className="text-white/50 text-sm">Maaf, template yang Anda cari tidak tersedia.</p>
          <a href="/" className="inline-block mt-2 text-rose-400 hover:text-rose-300 text-sm underline">Kembali ke Beranda</a>
        </div>
      </div>
    );
  }

  const invitation = SAMPLE_INVITATION as Invitation;
  const t = getTheme(template.themeSlug);
  const activeSections = parseSectionConfig(template.sectionsConfig);
  const isSectionVisible = (id: string) => {
    const s = activeSections.find(s => s.id === id);
    return s ? s.visible : true;
  };

  return (
    <div style={{ fontFamily: t.fontBody, ...t.cssVars as React.CSSProperties }}>
      <title>{`${template.name} - Demo | WedSaas`}</title>
      <meta name="description" content={`Lihat demo undangan pernikahan digital dengan tema ${template.name}.`} />

      {/* ── Demo Banner ───────────────────────────────────────────── */}
      {!opened && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-primary text-white py-2 text-center text-xs font-medium shadow-md">
          MODE DEMO: Tema {template.name}
        </div>
      )}

      {/* ── Cover Screen ──────────────────────────────────────────── */}
      <div
        data-testid="section-cover"
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-700 ${opened ? "opacity-0 pointer-events-none -translate-y-5" : "opacity-100"}`}
        style={{
          backgroundImage: `linear-gradient(to bottom, ${t.coverOverlayStart} 0%, ${t.coverOverlayEnd} 100%), url(${invitation.coverPhotoUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-center px-8 max-w-lg">
          <p className="text-xs uppercase tracking-[0.3em] mb-6" style={{ color: t.accentColor }}>Undangan Pernikahan</p>

          <h1 className="text-white text-5xl md:text-6xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            {invitation.groomName}
          </h1>
          <p className="text-rose-300 text-3xl mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>&amp;</p>
          <h1 className="text-white text-5xl md:text-6xl font-bold mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            {invitation.brideName}
          </h1>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20 mb-8">
            <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Kepada Yth.</p>
            <p className="text-white text-lg font-semibold">Tamu Undangan</p>
          </div>

          <Button
            onClick={handleOpen}
            className="bg-rose-500 hover:bg-rose-600 text-white px-10 py-5 text-base rounded-full shadow-lg shadow-rose-900/40 transition-all duration-300 hover:scale-105"
          >
            <Heart className="w-4 h-4 mr-2" />
            Buka Undangan
          </Button>
        </div>
        <div className="absolute bottom-8 text-white/40 animate-bounce">
          <ChevronDown className="w-6 h-6" />
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <div
        className={`transition-opacity duration-700 ${opened ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{ background: "#fefaf7" }}
      >
        {/* Hero */}
        <section
          data-testid="section-hero"
          className="relative min-h-screen flex flex-col items-center justify-center text-center px-6"
          style={{
            backgroundImage: `linear-gradient(to bottom, ${t.coverOverlayStart} 0%, ${t.coverOverlayEnd} 100%), url(${invitation.coverPhotoUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        >
          <p className="text-xs uppercase tracking-[0.35em] mb-4" style={{ color: t.accentColor }}>Bismillahirrahmanirrahim</p>
          <h2 className="text-white text-5xl md:text-7xl font-bold leading-tight mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            {invitation.groomName}
          </h2>
          <p className="text-rose-300 text-3xl mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>&amp;</p>
          <h2 className="text-white text-5xl md:text-7xl font-bold leading-tight mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            {invitation.brideName}
          </h2>

          <blockquote className="max-w-md text-white/75 text-sm italic leading-relaxed mb-8 border-l-2 border-rose-400 pl-4 text-left">
            {invitation.openingQuote}
          </blockquote>

          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Calendar className="w-4 h-4 text-rose-400" />
            <span>{formatDate(invitation.receptionDate)}</span>
          </div>

          <div className="absolute bottom-8 text-white/40 animate-bounce">
            <ChevronDown className="w-6 h-6" />
          </div>
        </section>

        {/* Mempelai */}
        {isSectionVisible("couple") && (
          <section data-testid="section-couple" className="py-16 px-6" style={{ background: t.backgroundColor }}>
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: t.primaryColor }}>Mempelai</p>
              <h3 className="text-2xl font-semibold mb-8" style={{ fontFamily: t.fontHeading, color: t.textColor }}>Perkenalkan Kami</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm text-center" style={{ border: `1px solid ${t.cardBorder}` }}>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: t.secondaryColor }}>
                    <Heart className="w-8 h-8" style={{ color: t.primaryColor }} />
                  </div>
                  <h4 className="text-xl font-bold mb-1" style={{ fontFamily: t.fontHeading, color: t.textColor }}>{invitation.groomName}</h4>
                  <p className="text-sm" style={{ color: t.textMutedColor }}>{invitation.groomParents}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm text-center" style={{ border: `1px solid ${t.cardBorder}` }}>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: t.secondaryColor }}>
                    <Heart className="w-8 h-8" style={{ color: t.primaryColor }} />
                  </div>
                  <h4 className="text-xl font-bold mb-1" style={{ fontFamily: t.fontHeading, color: t.textColor }}>{invitation.brideName}</h4>
                  <p className="text-sm" style={{ color: t.textMutedColor }}>{invitation.brideParents}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Countdown */}
        {isSectionVisible("countdown") && (
          <section data-testid="section-countdown" className="py-16 px-6" style={{ background: `linear-gradient(135deg, ${t.coverOverlayEnd} 0%, ${t.coverOverlayStart} 100%)` }}>
            <div className="max-w-xl mx-auto text-center">
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: t.accentColor }}>Menghitung Hari</p>
              <h3 className="text-white text-2xl font-semibold mb-8" style={{ fontFamily: t.fontHeading }}>Hari Bahagia Kami</h3>
              <div className="flex justify-center gap-4 flex-wrap">
                <CountdownBox value={countdown.days} label="Hari" />
                <CountdownBox value={countdown.hours} label="Jam" />
                <CountdownBox value={countdown.minutes} label="Menit" />
                <CountdownBox value={countdown.seconds} label="Detik" />
              </div>
            </div>
          </section>
        )}

        {/* Acara */}
        {isSectionVisible("event") && (
          <section data-testid="section-events" className="py-16 px-6" style={{ background: t.sectionAltBg }}>
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: t.primaryColor }}>Waktu &amp; Tempat</p>
                <h3 className="text-2xl font-semibold" style={{ fontFamily: t.fontHeading, color: t.textColor }}>Detail Acara</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: `1px solid ${t.cardBorder}` }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: t.secondaryColor }}>
                      <Heart className="w-4 h-4" style={{ color: t.primaryColor }} />
                    </div>
                    <h4 className="font-bold" style={{ color: t.textColor }}>Akad Nikah</h4>
                  </div>
                  <div className="space-y-2 text-sm" style={{ color: t.textMutedColor }}>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 mt-0.5 shrink-0" style={{ color: t.primaryColor }} />
                      <span>{formatDate(invitation.akadDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0" style={{ color: t.primaryColor }} />
                      <span>{invitation.akadTime}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: `1px solid ${t.cardBorder}` }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: t.secondaryColor }}>
                      <Users className="w-4 h-4" style={{ color: t.primaryColor }} />
                    </div>
                    <h4 className="font-bold" style={{ color: t.textColor }}>Resepsi</h4>
                  </div>
                  <div className="space-y-2 text-sm" style={{ color: t.textMutedColor }}>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 mt-0.5 shrink-0" style={{ color: t.primaryColor }} />
                      <span>{formatDate(invitation.receptionDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0" style={{ color: t.primaryColor }} />
                      <span>{invitation.receptionTime}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm" style={{ border: `1px solid ${t.cardBorder}` }}>
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-5 h-5 mt-0.5 shrink-0" style={{ color: t.primaryColor }} />
                  <div>
                    <h4 className="font-bold text-gray-800 mb-1">{invitation.venueName}</h4>
                    <p className="text-gray-500 text-sm">{invitation.venueAddress}</p>
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden mb-3">
                  <iframe src={invitation.mapsUrl} width="100%" height="220" style={{ border: 0 }} allowFullScreen loading="lazy" title="Lokasi Acara" />
                </div>
                <Button variant="outline" className="w-full gap-2" style={{ borderColor: t.primaryColor, color: t.primaryColor }}>
                  <ExternalLink className="w-4 h-4" /> Buka di Google Maps
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Love Story */}
        {isSectionVisible("love_story") && (
          <section data-testid="section-love-story" className="py-16 px-6" style={{ background: t.backgroundColor }}>
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: t.primaryColor }}>Perjalanan Cinta</p>
                <h3 className="text-2xl font-semibold" style={{ fontFamily: t.fontHeading, color: t.textColor }}>Our Love Story</h3>
              </div>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px" style={{ background: t.dividerColor }} />
                <div className="space-y-8">
                  {SAMPLE_LOVE_STORY.map((item) => (
                    <div key={item.id} className="relative flex gap-6 pl-16">
                      <div className="absolute left-3.5 top-3 w-5 h-5 rounded-full flex items-center justify-center border-4" style={{ background: t.primaryColor, borderColor: t.backgroundColor }}>
                        <Heart className="w-2 h-2 text-white fill-white" />
                      </div>
                      <div className="bg-white rounded-2xl p-5 shadow-sm flex-1" style={{ border: `1px solid ${t.cardBorder}` }}>
                        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: t.primaryColor }}>{item.dateLabel}</span>
                        <h4 className="font-bold mt-1 mb-2" style={{ fontFamily: t.fontHeading, color: t.textColor }}>{item.title}</h4>
                        <p className="text-sm leading-relaxed" style={{ color: t.textMutedColor }}>{item.description}</p>
                        {item.photoUrl && <img src={item.photoUrl} alt={item.title} className="mt-3 rounded-xl w-full object-cover h-40" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Gallery */}
        {isSectionVisible("gallery") && (
          <section data-testid="section-gallery" className="py-16 px-6" style={{ background: t.sectionAltBg }}>
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: t.primaryColor }}>Galeri Foto</p>
              <h3 className="text-2xl font-semibold mb-8" style={{ fontFamily: t.fontHeading, color: t.textColor }}>Momen Bahagia</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {invitation.galleryPhotos.map((url, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden shadow-sm border border-white">
                    <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* RSVP */}
        {isSectionVisible("rsvp") && (
          <section data-testid="section-rsvp" className="py-16 px-6" style={{ background: t.backgroundColor }}>
            <div className="max-w-md mx-auto text-center">
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: t.primaryColor }}>Konfirmasi Kehadiran</p>
              <h3 className="text-2xl font-semibold mb-8" style={{ fontFamily: t.fontHeading, color: t.textColor }}>RSVP</h3>
              <div className="bg-white rounded-3xl p-8 shadow-sm border" style={{ borderColor: t.cardBorder }}>
                <p className="text-sm text-gray-500 mb-6">Silakan konfirmasi kehadiran Anda melalui formulir di bawah ini.</p>
                <form className="space-y-4 text-left" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <Label className="text-xs font-semibold mb-1 block">Nama Lengkap</Label>
                    <Input placeholder="Nama Anda" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold mb-1 block">Jumlah Tamu</Label>
                    <Input type="number" defaultValue={1} min={1} max={5} />
                  </div>
                  <Button className="w-full h-11 rounded-xl" style={{ background: t.primaryColor }}>Kirim Konfirmasi</Button>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* Wishes */}
        {isSectionVisible("wishes") && (
          <section data-testid="section-wishes" className="py-16 px-6" style={{ background: t.sectionAltBg }}>
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: t.primaryColor }}>Ucapan & Doa</p>
                <h3 className="text-2xl font-semibold" style={{ fontFamily: t.fontHeading, color: t.textColor }}>Guest Book</h3>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border mb-8" style={{ borderColor: t.cardBorder }}>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <Input placeholder="Nama Anda" />
                  <Textarea placeholder="Tulis ucapan dan doa Anda..." rows={4} />
                  <Button className="w-full gap-2 rounded-xl" style={{ background: t.primaryColor }}><Send className="w-4 h-4" /> Kirim Ucapan</Button>
                </form>
              </div>
              <div className="space-y-4">
                {SAMPLE_WISHES.map((wish) => (
                  <div key={wish.id} className="bg-white p-5 rounded-2xl shadow-sm border" style={{ borderColor: t.cardBorder }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: t.secondaryColor, color: t.primaryColor }}>
                        {wish.guestName.charAt(0)}
                      </div>
                      <span className="font-bold text-sm" style={{ color: t.textColor }}>{wish.guestName}</span>
                    </div>
                    <p className="text-sm" style={{ color: t.textMutedColor }}>{wish.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="py-12 px-6 text-center" style={{ background: t.backgroundColor, borderTop: `1px solid ${t.dividerColor}` }}>
          <Heart className="w-6 h-6 mx-auto mb-4" style={{ color: t.primaryColor }} />
          <h4 className="text-xl font-bold mb-2" style={{ fontFamily: t.fontHeading, color: t.textColor }}>Budi & Sari</h4>
          <p className="text-sm mb-8" style={{ color: t.textMutedColor }}>Sampai Jumpa di Hari Bahagia Kami</p>
          <div className="pt-8 border-t max-w-xs mx-auto" style={{ borderColor: t.dividerColor }}>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Dibuat dengan WedSaas</p>
            <a href="/" className="text-xs font-bold text-gray-600 hover:text-primary transition-colors">www.wedsaas.com</a>
          </div>
        </footer>
      </div>

      {/* Floating Action Buttons */}
      {opened && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
          <Button
            size="icon"
            className="w-12 h-12 rounded-full shadow-lg bg-white/80 backdrop-blur-md border border-gray-200 text-gray-700 hover:bg-white"
            onClick={toggleMusic}
          >
            {isPlaying ? <Music2 className="w-5 h-5 animate-spin-slow" /> : <Pause className="w-5 h-5" />}
          </Button>
          <Button
            size="icon"
            className="w-12 h-12 rounded-full shadow-lg bg-primary text-white"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ArrowUp className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
