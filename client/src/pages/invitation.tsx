import { useState, useEffect, useRef } from "react";
import { useParams, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  MapPin, Calendar, Clock, Heart, Music, ChevronDown,
  Share2, ExternalLink, Send, BookOpen, Users, Music2,
  Pause, Play, ArrowUp
} from "lucide-react";
import type { Invitation, LoveStoryItem, RsvpEntry, GuestbookEntry } from "@shared/schema";

interface InvitationData {
  invitation: Invitation;
  loveStory: LoveStoryItem[];
  rsvp: RsvpEntry[];
  guestbook: GuestbookEntry[];
}

function useCountdown(targetDate: string | null | undefined) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
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

export default function InvitationPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const guestName = params.get("to") || "Tamu Undangan";
  const { toast } = useToast();
  const qc = useQueryClient();

  const [opened, setOpened] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [rsvpForm, setRsvpForm] = useState({ guestName: guestName, attendance: "hadir", guestCount: "1", message: "" });
  const [gbForm, setGbForm] = useState({ guestName: guestName, message: "" });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data, isLoading, error } = useQuery<InvitationData>({
    queryKey: ["/api/invitations", slug],
    queryFn: () => fetch(`/api/invitations/${slug}`).then(r => r.json()),
  });

  const rsvpMutation = useMutation({
    mutationFn: (body: typeof rsvpForm) => apiRequest("POST", `/api/invitations/${slug}/rsvp`, {
      ...body,
      guestCount: parseInt(String(body.guestCount), 10) || 1,
    }),
    onSuccess: () => {
      toast({ title: "RSVP berhasil!", description: "Terima kasih atas konfirmasi kehadiranmu." });
      setRsvpForm({ guestName: guestName, attendance: "hadir", guestCount: "1", message: "" });
      qc.invalidateQueries({ queryKey: ["/api/invitations", slug] });
    },
    onError: () => toast({ title: "Gagal mengirim RSVP", variant: "destructive" }),
  });

  const gbMutation = useMutation({
    mutationFn: (body: typeof gbForm) => apiRequest("POST", `/api/invitations/${slug}/guestbook`, body),
    onSuccess: () => {
      toast({ title: "Ucapan terkirim!", description: "Terima kasih atas doamu." });
      setGbForm({ guestName: guestName, message: "" });
      qc.invalidateQueries({ queryKey: ["/api/invitations", slug] });
    },
    onError: () => toast({ title: "Gagal mengirim ucapan", variant: "destructive" }),
  });

  const countdown = useCountdown(data?.invitation.receptionDate);

  useEffect(() => {
    const handleScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!data?.invitation.musicUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(data.invitation.musicUrl);
      audioRef.current.loop = true;
    }
  }, [data?.invitation.musicUrl]);

  const handleOpen = () => {
    setOpened(true);
    if (audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 300);
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
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

  if (error || !data?.invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1209]">
        <div className="text-center space-y-3 px-6">
          <Heart className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-white text-xl font-semibold">Undangan Tidak Ditemukan</h2>
          <p className="text-white/60">Silakan periksa kembali link undangan Anda.</p>
        </div>
      </div>
    );
  }

  const { invitation, loveStory, rsvp, guestbook } = data;
  const coverBg = invitation.coverPhotoUrl ||
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80";

  return (
    <div className="font-sans" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* ── Cover Screen ── */}
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-700 ${opened ? "opacity-0 pointer-events-none translate-y-[-20px]" : "opacity-100"}`}
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.7) 100%), url(${coverBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-center px-8 max-w-lg">
          <p className="text-rose-300 text-sm uppercase tracking-[0.3em] mb-4">Undangan Pernikahan</p>
          <h1 className="text-white text-5xl md:text-6xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            {invitation.groomName}
          </h1>
          <p className="text-rose-300 text-2xl mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>&amp;</p>
          <h1 className="text-white text-5xl md:text-6xl font-bold mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            {invitation.brideName}
          </h1>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20 mb-8">
            <p className="text-white/70 text-sm">Kepada Yth.</p>
            <p className="text-white text-lg font-semibold" data-testid="guest-name-display">{guestName}</p>
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
        <div className="absolute bottom-8 text-white/50 animate-bounce">
          <ChevronDown className="w-6 h-6" />
        </div>
      </div>

      {/* ── Main Content ── */}
      <div
        className={`transition-opacity duration-700 ${opened ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{ background: "#fefaf7" }}
      >
        {/* Hero */}
        <section
          className="relative min-h-screen flex flex-col items-center justify-center text-center px-6"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.65) 100%), url(${coverBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        >
          <p className="text-rose-300 text-xs uppercase tracking-[0.35em] mb-3">Bismillahirrahmanirrahim</p>
          <h2 className="text-white text-5xl md:text-7xl font-bold leading-tight mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            {invitation.groomName}
          </h2>
          <p className="text-rose-300 text-3xl mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>&amp;</p>
          <h2 className="text-white text-5xl md:text-7xl font-bold leading-tight mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            {invitation.brideName}
          </h2>
          {invitation.openingQuote && (
            <blockquote className="max-w-md text-white/75 text-sm italic leading-relaxed mb-8 border-l-2 border-rose-400 pl-4 text-left">
              {invitation.openingQuote}
            </blockquote>
          )}
          <div className="flex items-center gap-3 text-white/80 text-sm">
            <Calendar className="w-4 h-4 text-rose-400" />
            <span>
              {invitation.receptionDate
                ? new Date(invitation.receptionDate).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
                : "—"}
            </span>
          </div>
          <div className="absolute bottom-8 text-white/50 animate-bounce">
            <ChevronDown className="w-6 h-6" />
          </div>
        </section>

        {/* Pasangan */}
        <section className="py-16 px-6 bg-[#fefaf7]">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-rose-400 text-xs uppercase tracking-widest mb-2">Mempelai</p>
            <h3 className="text-gray-800 text-2xl font-semibold mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>Perkenalkan Kami</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 text-center">
                <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-rose-400" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{invitation.groomName}</h4>
                <p className="text-gray-500 text-sm">{invitation.groomParents}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 text-center">
                <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-rose-400" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{invitation.brideName}</h4>
                <p className="text-gray-500 text-sm">{invitation.brideParents}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Countdown */}
        <section className="py-16 px-6" style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #2d1515 100%)" }}>
          <div className="max-w-xl mx-auto text-center">
            <p className="text-rose-400 text-xs uppercase tracking-widest mb-2">Menghitung Hari</p>
            <h3 className="text-white text-2xl font-semibold mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>Hari Bahagia Kami</h3>
            <div className="flex justify-center gap-4 flex-wrap">
              <CountdownBox value={countdown.days} label="Hari" />
              <CountdownBox value={countdown.hours} label="Jam" />
              <CountdownBox value={countdown.minutes} label="Menit" />
              <CountdownBox value={countdown.seconds} label="Detik" />
            </div>
          </div>
        </section>

        {/* Acara */}
        <section className="py-16 px-6 bg-[#fefaf7]">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-rose-400 text-xs uppercase tracking-widest mb-2">Waktu &amp; Tempat</p>
              <h3 className="text-gray-800 text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>Detail Acara</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <span>{invitation.akadDate ? new Date(invitation.akadDate).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{invitation.akadTime || "—"}</span>
                  </div>
                </div>
              </div>
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
                    <span>{invitation.receptionDate ? new Date(invitation.receptionDate).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{invitation.receptionTime || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Venue */}
            <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-rose-100">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">{invitation.venueName}</h4>
                  <p className="text-gray-500 text-sm">{invitation.venueAddress}</p>
                </div>
              </div>
              {invitation.mapsUrl && (
                <div className="mt-4 rounded-xl overflow-hidden">
                  <iframe
                    src={invitation.mapsUrl}
                    width="100%"
                    height="240"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    title="Lokasi Acara"
                    data-testid="maps-iframe"
                  />
                </div>
              )}
              {invitation.mapsUrl && (
                <a
                  href={invitation.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-2 text-rose-500 text-sm font-medium hover:underline"
                  data-testid="link-maps"
                >
                  <ExternalLink className="w-4 h-4" /> Buka di Google Maps
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Love Story */}
        {loveStory.length > 0 && (
          <section className="py-16 px-6 bg-rose-50">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <p className="text-rose-400 text-xs uppercase tracking-widest mb-2">Perjalanan Cinta</p>
                <h3 className="text-gray-800 text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>Our Love Story</h3>
              </div>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-rose-200" />
                <div className="space-y-8">
                  {loveStory.map((item, i) => (
                    <div key={item.id} className="relative flex gap-6 pl-16" data-testid={`love-story-item-${item.id}`}>
                      <div className="absolute left-3.5 top-3 w-5 h-5 rounded-full bg-rose-400 border-4 border-rose-50 flex items-center justify-center">
                        <Heart className="w-2 h-2 text-white fill-white" />
                      </div>
                      <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100 flex-1">
                        <span className="text-rose-400 text-xs font-medium uppercase tracking-widest">{item.dateLabel}</span>
                        <h4 className="text-gray-800 font-bold mt-1 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h4>
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
          <section className="py-16 px-6 bg-[#fefaf7]">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <p className="text-rose-400 text-xs uppercase tracking-widest mb-2">Kenangan Indah</p>
                <h3 className="text-gray-800 text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>Galeri Foto</h3>
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
          <section className="py-16 px-6 bg-rose-50">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <p className="text-rose-400 text-xs uppercase tracking-widest mb-2">Momen Spesial</p>
                <h3 className="text-gray-800 text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>Video Kami</h3>
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
        <section className="py-16 px-6 bg-[#fefaf7]" id="rsvp">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <p className="text-rose-400 text-xs uppercase tracking-widest mb-2">Konfirmasi Kehadiran</p>
              <h3 className="text-gray-800 text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>RSVP</h3>
              <p className="text-gray-500 text-sm mt-2">Mohon konfirmasi kehadiran Anda sebelum acara dimulai.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 space-y-4">
              <div>
                <Label htmlFor="rsvp-name" className="text-sm font-medium text-gray-700">Nama</Label>
                <Input
                  id="rsvp-name"
                  data-testid="input-rsvp-name"
                  value={rsvpForm.guestName}
                  onChange={e => setRsvpForm(f => ({ ...f, guestName: e.target.value }))}
                  placeholder="Nama lengkap Anda"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Kehadiran</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[["hadir", "Hadir"], ["tidak_hadir", "Tidak Hadir"], ["belum_pasti", "Belum Pasti"]].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      data-testid={`button-attendance-${val}`}
                      onClick={() => setRsvpForm(f => ({ ...f, attendance: val }))}
                      className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${rsvpForm.attendance === val ? "bg-rose-500 text-white border-rose-500" : "bg-white text-gray-600 border-gray-200 hover:border-rose-300"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="rsvp-count" className="text-sm font-medium text-gray-700">Jumlah Tamu</Label>
                <Input
                  id="rsvp-count"
                  data-testid="input-rsvp-count"
                  type="number"
                  min={1}
                  max={10}
                  value={rsvpForm.guestCount}
                  onChange={e => setRsvpForm(f => ({ ...f, guestCount: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="rsvp-message" className="text-sm font-medium text-gray-700">Pesan (opsional)</Label>
                <Textarea
                  id="rsvp-message"
                  data-testid="input-rsvp-message"
                  value={rsvpForm.message}
                  onChange={e => setRsvpForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Pesan untuk pengantin..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              <Button
                onClick={() => rsvpMutation.mutate(rsvpForm)}
                disabled={rsvpMutation.isPending || !rsvpForm.guestName.trim()}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl"
                data-testid="button-submit-rsvp"
              >
                {rsvpMutation.isPending ? "Mengirim..." : "Kirim Konfirmasi"}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
            {/* RSVP list */}
            {rsvp.length > 0 && (
              <div className="mt-6 space-y-2">
                <p className="text-gray-500 text-xs text-center">{rsvp.filter(r => r.attendance === "hadir").length} tamu telah mengkonfirmasi kehadiran</p>
              </div>
            )}
          </div>
        </section>

        {/* Guestbook */}
        <section className="py-16 px-6 bg-rose-50" id="guestbook">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <p className="text-rose-400 text-xs uppercase tracking-widest mb-2">Kata &amp; Doa</p>
              <h3 className="text-gray-800 text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>Buku Tamu</h3>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 space-y-4 mb-6">
              <div>
                <Label htmlFor="gb-name" className="text-sm font-medium text-gray-700">Nama</Label>
                <Input
                  id="gb-name"
                  data-testid="input-guestbook-name"
                  value={gbForm.guestName}
                  onChange={e => setGbForm(f => ({ ...f, guestName: e.target.value }))}
                  placeholder="Nama Anda"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gb-message" className="text-sm font-medium text-gray-700">Ucapan &amp; Doa</Label>
                <Textarea
                  id="gb-message"
                  data-testid="input-guestbook-message"
                  value={gbForm.message}
                  onChange={e => setGbForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Tulis ucapan dan doa terbaikmu untuk pengantin..."
                  className="mt-1"
                  rows={4}
                />
              </div>
              <Button
                onClick={() => gbMutation.mutate(gbForm)}
                disabled={gbMutation.isPending || !gbForm.guestName.trim() || !gbForm.message.trim()}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl"
                data-testid="button-submit-guestbook"
              >
                {gbMutation.isPending ? "Mengirim..." : "Kirim Ucapan"}
                <BookOpen className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {guestbook.map(entry => (
                <div key={entry.id} className="bg-white rounded-2xl p-4 shadow-sm border border-rose-100" data-testid={`guestbook-entry-${entry.id}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-rose-100 rounded-full flex items-center justify-center">
                      <Heart className="w-3 h-3 text-rose-400" />
                    </div>
                    <span className="font-semibold text-gray-800 text-sm">{entry.guestName}</span>
                    <span className="text-gray-400 text-xs ml-auto">
                      {new Date(entry.createdAt).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed pl-9">{entry.message}</p>
                </div>
              ))}
              {guestbook.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">Jadilah yang pertama memberikan ucapan.</p>
              )}
            </div>
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

        {/* Share & Footer */}
        <section className="py-16 px-6" style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #2d1515 100%)" }}>
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

      {/* ── Floating Music Player ── */}
      {data?.invitation.musicUrl && opened && (
        <button
          onClick={toggleMusic}
          data-testid="button-music-toggle"
          className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg shadow-rose-900/40 flex items-center justify-center transition-all duration-300"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Music2 className="w-5 h-5" />}
        </button>
      )}

      {/* ── Back to Top ── */}
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
