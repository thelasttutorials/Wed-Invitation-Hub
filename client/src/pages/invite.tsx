import { useState, useEffect, useRef } from "react";
import { useParams, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  MapPin, Calendar, Clock, Heart, ChevronDown,
  Share2, ExternalLink, Music2, Pause, ArrowUp, Users, Send, CheckCircle2,
} from "lucide-react";
import type { Invitation, LoveStoryItem } from "@shared/schema";

interface InvitationData {
  invitation: Invitation;
  loveStory: LoveStoryItem[];
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

export default function InvitePage() {
  const { slug } = useParams<{ slug: string }>();
  const searchStr = useSearch();
  const guestName = new URLSearchParams(searchStr).get("to") || "Tamu Undangan";
  const { toast } = useToast();

  const [opened, setOpened] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [rsvpForm, setRsvpForm] = useState({
    guest_name: guestName === "Tamu Undangan" ? "" : guestName,
    attendance_status: "hadir",
    guest_count: 1,
    note: "",
  });
  const [rsvpDone, setRsvpDone] = useState(false);

  const rsvpMutation = useMutation({
    mutationFn: (body: typeof rsvpForm) =>
      apiRequest("POST", `/api/public/invitations/${slug}/rsvp`, body),
    onSuccess: () => {
      setRsvpDone(true);
      toast({ title: "RSVP terkirim!", description: "Terima kasih atas konfirmasimu." });
    },
    onError: () => {
      toast({ title: "Gagal mengirim RSVP", description: "Silakan coba lagi.", variant: "destructive" });
    },
  });

  const { data, isLoading } = useQuery<InvitationData>({
    queryKey: ["/api/invitations", slug],
    queryFn: () => fetch(`/api/invitations/${slug}`).then(r => r.json()),
  });

  const countdown = useCountdown(data?.invitation?.receptionDate ?? data?.invitation?.akadDate);

  useEffect(() => {
    const handleScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const url = data?.invitation?.musicUrl;
    if (!url || audioRef.current) return;
    audioRef.current = new Audio(url);
    audioRef.current.loop = true;
  }, [data?.invitation?.musicUrl]);

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

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: "Undangan Pernikahan", url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link disalin!", description: "Link undangan berhasil disalin." });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1209]">
        <div className="text-center space-y-3">
          <Heart className="w-10 h-10 text-rose-400 animate-pulse mx-auto" />
          <p className="text-white/60 font-medium">Memuat undangan...</p>
        </div>
      </div>
    );
  }

  if (!data?.invitation || (data as any).error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1209] px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
            <Heart className="w-8 h-8 text-rose-400/60" />
          </div>
          <h2 className="text-white text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}
              data-testid="text-not-found-title">
            Undangan Tidak Ditemukan
          </h2>
          <p className="text-white/50 text-sm leading-relaxed" data-testid="text-not-found-desc">
            Link undangan yang kamu buka tidak tersedia.<br />
            Pastikan link sudah benar.
          </p>
          <a href="/" className="inline-block mt-2 text-rose-400 hover:text-rose-300 text-sm underline underline-offset-2">
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  const { invitation, loveStory } = data;
  const coverBg = invitation.coverPhotoUrl ||
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80";

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Cover Screen ──────────────────────────────────────────── */}
      <div
        data-testid="section-cover"
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-700 ${opened ? "opacity-0 pointer-events-none -translate-y-5" : "opacity-100"}`}
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.72) 100%), url(${coverBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-center px-8 max-w-lg">
          <p className="text-rose-300 text-xs uppercase tracking-[0.3em] mb-6">Undangan Pernikahan</p>

          <h1
            data-testid="text-groom-name-cover"
            className="text-white text-5xl md:text-6xl font-bold mb-1"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {invitation.groomName}
          </h1>
          <p className="text-rose-300 text-3xl mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>&amp;</p>
          <h1
            data-testid="text-bride-name-cover"
            className="text-white text-5xl md:text-6xl font-bold mb-8"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {invitation.brideName}
          </h1>

          {/* Guest name */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20 mb-8">
            <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Kepada Yth.</p>
            <p
              className="text-white text-lg font-semibold"
              data-testid="text-guest-name"
            >
              {guestName}
            </p>
          </div>

          <Button
            onClick={handleOpen}
            data-testid="button-open-invitation"
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
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.65) 100%), url(${coverBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        >
          <p className="text-rose-300 text-xs uppercase tracking-[0.35em] mb-4">Bismillahirrahmanirrahim</p>

          <h2
            data-testid="text-groom-name"
            className="text-white text-5xl md:text-7xl font-bold leading-tight mb-1"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {invitation.groomName}
          </h2>
          <p className="text-rose-300 text-3xl mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>&amp;</p>
          <h2
            data-testid="text-bride-name"
            className="text-white text-5xl md:text-7xl font-bold leading-tight mb-8"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {invitation.brideName}
          </h2>

          {invitation.openingQuote && (
            <blockquote
              data-testid="text-opening-quote"
              className="max-w-md text-white/75 text-sm italic leading-relaxed mb-8 border-l-2 border-rose-400 pl-4 text-left"
            >
              {invitation.openingQuote}
            </blockquote>
          )}

          {(invitation.receptionDate || invitation.akadDate) && (
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Calendar className="w-4 h-4 text-rose-400" />
              <span data-testid="text-wedding-date">
                {formatDate(invitation.receptionDate ?? invitation.akadDate)}
              </span>
            </div>
          )}

          <div className="absolute bottom-8 text-white/40 animate-bounce">
            <ChevronDown className="w-6 h-6" />
          </div>
        </section>

        {/* Mempelai */}
        <section data-testid="section-couple" className="py-16 px-6 bg-[#fefaf7]">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-rose-400 text-xs uppercase tracking-widest mb-2">Mempelai</p>
            <h3 className="text-gray-800 text-2xl font-semibold mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
              Perkenalkan Kami
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 text-center">
                <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-rose-400" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {invitation.groomName}
                </h4>
                {invitation.groomParents && (
                  <p className="text-gray-500 text-sm">{invitation.groomParents}</p>
                )}
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 text-center">
                <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-rose-400" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {invitation.brideName}
                </h4>
                {invitation.brideParents && (
                  <p className="text-gray-500 text-sm">{invitation.brideParents}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Countdown */}
        <section
          data-testid="section-countdown"
          className="py-16 px-6"
          style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #2d1515 100%)" }}
        >
          <div className="max-w-xl mx-auto text-center">
            <p className="text-rose-400 text-xs uppercase tracking-widest mb-2">Menghitung Hari</p>
            <h3 className="text-white text-2xl font-semibold mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
              Hari Bahagia Kami
            </h3>
            <div className="flex justify-center gap-4 flex-wrap">
              <CountdownBox value={countdown.days} label="Hari" />
              <CountdownBox value={countdown.hours} label="Jam" />
              <CountdownBox value={countdown.minutes} label="Menit" />
              <CountdownBox value={countdown.seconds} label="Detik" />
            </div>
          </div>
        </section>

        {/* Acara */}
        <section data-testid="section-events" className="py-16 px-6 bg-[#fefaf7]">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-rose-400 text-xs uppercase tracking-widest mb-2">Waktu &amp; Tempat</p>
              <h3 className="text-gray-800 text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                Detail Acara
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Akad */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                    <Heart className="w-4 h-4 text-rose-500" />
                  </div>
                  <h4 className="font-bold text-gray-800">Akad Nikah</h4>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    <span data-testid="text-akad-date">{formatDate(invitation.akadDate)}</span>
                  </div>
                  {invitation.akadTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                      <span data-testid="text-akad-time">{invitation.akadTime}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Resepsi */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-rose-500" />
                  </div>
                  <h4 className="font-bold text-gray-800">Resepsi</h4>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    <span data-testid="text-reception-date">{formatDate(invitation.receptionDate)}</span>
                  </div>
                  {invitation.receptionTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                      <span data-testid="text-reception-time">{invitation.receptionTime}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Venue */}
            {invitation.venueName && (
              <div data-testid="section-venue" className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-rose-100">
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-gray-800 mb-1" data-testid="text-venue-name">
                      {invitation.venueName}
                    </h4>
                    {invitation.venueAddress && (
                      <p className="text-gray-500 text-sm" data-testid="text-venue-address">
                        {invitation.venueAddress}
                      </p>
                    )}
                  </div>
                </div>

                {invitation.mapsUrl && (
                  <>
                    <div className="rounded-xl overflow-hidden mb-3">
                      <iframe
                        src={invitation.mapsUrl}
                        width="100%"
                        height="220"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        title="Lokasi Acara"
                        data-testid="maps-iframe"
                      />
                    </div>
                    <a
                      href={invitation.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="button-open-maps"
                      className="inline-flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium text-sm px-4 py-2 rounded-xl border border-rose-100 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Buka di Google Maps
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Love Story */}
        {loveStory && loveStory.length > 0 && (
          <section data-testid="section-love-story" className="py-16 px-6 bg-rose-50">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <p className="text-rose-400 text-xs uppercase tracking-widest mb-2">Perjalanan Cinta</p>
                <h3 className="text-gray-800 text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Our Love Story
                </h3>
              </div>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-rose-200" />
                <div className="space-y-8">
                  {loveStory.map((item) => (
                    <div key={item.id} className="relative flex gap-6 pl-16" data-testid={`love-story-item-${item.id}`}>
                      <div className="absolute left-3.5 top-3 w-5 h-5 rounded-full bg-rose-400 border-4 border-rose-50 flex items-center justify-center">
                        <Heart className="w-2 h-2 text-white fill-white" />
                      </div>
                      <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100 flex-1">
                        <span className="text-rose-400 text-xs font-medium uppercase tracking-widest">{item.dateLabel}</span>
                        <h4 className="text-gray-800 font-bold mt-1 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {item.title}
                        </h4>
                        <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                        {item.photoUrl && (
                          <img src={item.photoUrl} alt={item.title} className="mt-3 rounded-xl w-full object-cover h-40" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Gallery */}
        {invitation.galleryPhotos && invitation.galleryPhotos.length > 0 && (
          <section data-testid="section-gallery" className="py-16 px-6 bg-[#fefaf7]">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <p className="text-rose-400 text-xs uppercase tracking-widest mb-2">Kenangan Indah</p>
                <h3 className="text-gray-800 text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Galeri Foto
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {invitation.galleryPhotos.map((url, i) => (
                  <div key={i} className="rounded-xl overflow-hidden aspect-square shadow-sm" data-testid={`gallery-photo-${i}`}>
                    <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Video */}
        {invitation.videoUrl && (
          <section data-testid="section-video" className="py-16 px-6 bg-rose-50">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <p className="text-rose-400 text-xs uppercase tracking-widest mb-2">Momen Spesial</p>
                <h3 className="text-gray-800 text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Video Kami
                </h3>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-md aspect-video">
                <iframe
                  src={invitation.videoUrl}
                  className="w-full h-full"
                  allowFullScreen
                  title="Video Pernikahan"
                  data-testid="video-iframe"
                />
              </div>
            </div>
          </section>
        )}

        {/* RSVP */}
        <section data-testid="section-rsvp" className="py-16 px-6 bg-[#fefaf7]" id="rsvp">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <p className="text-rose-400 text-xs uppercase tracking-widest mb-2">Konfirmasi Kehadiran</p>
              <h3 className="text-gray-800 text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                RSVP
              </h3>
              <p className="text-gray-500 text-sm mt-2">
                Mohon konfirmasi kehadiranmu sebelum acara dimulai.
              </p>
            </div>

            {rsvpDone ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-rose-100 text-center space-y-4" data-testid="rsvp-success">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </div>
                <h4 className="text-gray-800 font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Terima kasih!
                </h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  RSVP kamu sudah kami terima. Sampai jumpa di hari bahagia kami!
                </p>
                <button
                  onClick={() => setRsvpDone(false)}
                  className="text-rose-400 hover:text-rose-500 text-sm underline underline-offset-2"
                  data-testid="button-rsvp-again"
                >
                  Ubah konfirmasi
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 space-y-5">
                <div>
                  <Label htmlFor="rsvp-name" className="text-sm font-medium text-gray-700">
                    Nama Lengkap
                  </Label>
                  <Input
                    id="rsvp-name"
                    data-testid="input-rsvp-name"
                    value={rsvpForm.guest_name}
                    onChange={e => setRsvpForm(f => ({ ...f, guest_name: e.target.value }))}
                    placeholder="Nama lengkapmu"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Kehadiran</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {([
                      ["hadir", "Hadir ✓"],
                      ["tidak_hadir", "Tidak Hadir"],
                      ["belum_pasti", "Belum Pasti"],
                    ] as const).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        data-testid={`button-attendance-${val}`}
                        onClick={() => setRsvpForm(f => ({ ...f, attendance_status: val }))}
                        className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all ${
                          rsvpForm.attendance_status === val
                            ? "bg-rose-500 text-white border-rose-500"
                            : "bg-white text-gray-600 border-gray-200 hover:border-rose-300"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="rsvp-count" className="text-sm font-medium text-gray-700">
                    Jumlah Tamu
                  </Label>
                  <Input
                    id="rsvp-count"
                    data-testid="input-rsvp-count"
                    type="number"
                    min={1}
                    max={20}
                    value={rsvpForm.guest_count}
                    onChange={e => setRsvpForm(f => ({ ...f, guest_count: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="rsvp-note" className="text-sm font-medium text-gray-700">
                    Catatan <span className="text-gray-400 font-normal">(opsional)</span>
                  </Label>
                  <Textarea
                    id="rsvp-note"
                    data-testid="input-rsvp-note"
                    value={rsvpForm.note}
                    onChange={e => setRsvpForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="Pesan untuk pengantin..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={() => {
                    if (!rsvpForm.guest_name.trim()) {
                      toast({ title: "Nama wajib diisi", variant: "destructive" });
                      return;
                    }
                    rsvpMutation.mutate(rsvpForm);
                  }}
                  disabled={rsvpMutation.isPending}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl"
                  data-testid="button-submit-rsvp"
                >
                  {rsvpMutation.isPending ? "Mengirim..." : (
                    <>Kirim Konfirmasi <Send className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Additional Notes */}
        {invitation.additionalNotes && (
          <section className="py-12 px-6 bg-[#fefaf7]">
            <div className="max-w-md mx-auto text-center">
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6">
                <Heart className="w-5 h-5 text-rose-400 mx-auto mb-3" />
                <p className="text-gray-600 text-sm leading-relaxed">{invitation.additionalNotes}</p>
              </div>
            </div>
          </section>
        )}

        {/* Footer + Share */}
        <section
          data-testid="section-footer"
          className="py-16 px-6"
          style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #2d1515 100%)" }}
        >
          <div className="max-w-sm mx-auto text-center">
            <Heart className="w-10 h-10 text-rose-400 mx-auto mb-4" />
            <h3 className="text-white text-2xl font-semibold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              {invitation.groomName} &amp; {invitation.brideName}
            </h3>
            <p className="text-white/60 text-sm mb-6">Berbagi momen bahagia ini dengan orang-orang terkasih</p>
            <Button
              onClick={handleShare}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 rounded-full px-8"
              data-testid="button-share"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Bagikan Undangan
            </Button>
            <p className="text-white/30 text-xs mt-10">Dibuat dengan cinta menggunakan WedSaas</p>
          </div>
        </section>
      </div>

      {/* ── Floating Music ─────────────────────────────────────────── */}
      {invitation.musicUrl && opened && (
        <button
          onClick={toggleMusic}
          data-testid="button-music-toggle"
          className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg shadow-rose-900/40 flex items-center justify-center transition-all"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Music2 className="w-5 h-5" />}
        </button>
      )}

      {/* ── Back to Top ────────────────────────────────────────────── */}
      {showTop && opened && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          data-testid="button-back-to-top"
          className="fixed bottom-6 left-6 z-40 w-10 h-10 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full shadow border border-gray-200 flex items-center justify-center hover:bg-white transition-all"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
