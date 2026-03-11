import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Heart,
  Palette,
  Smartphone,
  Link2,
  ClipboardList,
  Image,
  Gift,
  Star,
  Check,
  ChevronRight,
  Menu,
  X,
  Users,
  Award,
  Zap,
  Eye,
  Sparkles,
} from "lucide-react";

const HERO_DEFAULTS = {
  hero_title:         "Undangan Pernikahan Digital yang Tak Terlupakan",
  hero_subtitle:      "Platform undangan pernikahan online terbaik di Indonesia. Elegan, personal, dan mudah dibagikan.",
  hero_cta_primary:   "Buat Undangan Sekarang",
  hero_cta_secondary: "Lihat Contoh",
  hero_cta_link:      "/admin/new",
};

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { data: heroData = HERO_DEFAULTS } = useQuery<typeof HERO_DEFAULTS>({
    queryKey: ["/api/landing"],
    staleTime: 5 * 60 * 1000,
    placeholderData: HERO_DEFAULTS,
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: Palette,
      title: "Mudah Dibuat, Langsung Cantik",
      desc: "Cukup isi data pernikahan, pilih tema, dan undangan siap. Tidak perlu keahlian desain sama sekali.",
    },
    {
      icon: Smartphone,
      title: "Tampil Sempurna di HP",
      desc: "Tamu bisa membuka undangan langsung dari WhatsApp, tanpa perlu install aplikasi apapun.",
    },
    {
      icon: Link2,
      title: "Link Nama Tamu Personal",
      desc: "Setiap tamu disambut namanya: undangan.com/rizky-dinda?to=Pak+Hendra — terasa eksklusif dan berkesan.",
    },
    {
      icon: ClipboardList,
      title: "RSVP Online Real-time",
      desc: "Tamu konfirmasi kehadiran langsung dari undangan. Kamu bisa pantau siapa yang hadir kapan saja.",
    },
    {
      icon: Image,
      title: "Galeri & Love Story",
      desc: "Tampilkan foto prewedding dan cerita perjalanan cinta kalian dalam tampilan elegan nan berkesan.",
    },
    {
      icon: Gift,
      title: "Amplop Digital & Ucapan",
      desc: "Tamu bisa kirim doa dan ucapan, serta melihat info rekening — semua dalam satu halaman undangan.",
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Daftar Gratis",
      desc: "Buat akun dalam hitungan detik. Tidak perlu kartu kredit, langsung bisa mulai.",
    },
    {
      num: "02",
      title: "Isi Data Pernikahan",
      desc: "Masukkan nama mempelai, tanggal, lokasi akad dan resepsi, serta kisah cinta kalian.",
    },
    {
      num: "03",
      title: "Pilih Tema Favorit",
      desc: "Pilih dari koleksi tema elegan — dari nuansa gold mewah hingga floral romantis.",
    },
    {
      num: "04",
      title: "Bagikan via WhatsApp",
      desc: "Salin link undangan, kirim ke grup keluarga dan teman — hari istimewamu siap disambut.",
    },
  ];

  const themes = [
    {
      name: "Luxury Gold",
      rating: "4.9",
      badge: "Terpopuler",
      gradient: "from-yellow-900 via-yellow-700 to-amber-500",
      accent: "bg-yellow-400/20",
      textColor: "text-yellow-100",
      pattern: "gold",
    },
    {
      name: "Romantic Floral",
      rating: "4.8",
      badge: "Baru",
      gradient: "from-rose-900 via-pink-700 to-rose-400",
      accent: "bg-rose-400/20",
      textColor: "text-rose-100",
      pattern: "floral",
    },
    {
      name: "Minimal Modern",
      rating: "4.7",
      badge: null,
      gradient: "from-slate-800 via-slate-600 to-slate-400",
      accent: "bg-slate-400/20",
      textColor: "text-slate-100",
      pattern: "minimal",
    },
    {
      name: "Classic Elegant",
      rating: "4.9",
      badge: "Premium",
      gradient: "from-indigo-900 via-blue-700 to-blue-400",
      accent: "bg-blue-400/20",
      textColor: "text-blue-100",
      pattern: "classic",
    },
  ];

  const pricing = [
    {
      name: "Gratis",
      price: "Rp 0",
      period: "",
      highlight: false,
      features: [
        "1 Undangan Digital",
        "3 Tema Pilihan",
        "RSVP Online",
        "Link Nama Tamu Personal",
        "Galeri 10 Foto",
        "Aktif 1 Tahun",
      ],
      cta: "Mulai Gratis",
      variant: "outline" as const,
    },
    {
      name: "Premium",
      price: "Rp 99.000",
      period: "/sekali bayar",
      highlight: true,
      features: [
        "1 Undangan Digital Lengkap",
        "50+ Tema Elegan",
        "RSVP + Export Data Tamu",
        "Galeri 50 Foto",
        "Musik Latar Romantis",
        "Love Story Timeline",
        "Aktif 2 Tahun",
      ],
      cta: "Pilih Premium",
      variant: "default" as const,
    },
    {
      name: "Pro",
      price: "Rp 199.000",
      period: "/sekali bayar",
      highlight: false,
      features: [
        "Undangan Tak Terbatas",
        "Semua Tema + Eksklusif",
        "Manajemen Tamu Lengkap",
        "Galeri Tak Terbatas",
        "Semua Fitur Premium",
        "Cocok untuk Wedding Organizer",
        "Prioritas Layanan",
      ],
      cta: "Pilih Pro",
      variant: "outline" as const,
    },
  ];

  const testimonials = [
    {
      stars: 5,
      text: "Undangan digitalnya luar biasa cantik! Hampir semua tamu bertanya dibuat pakai apa. Prosesnya cepat dan hasilnya jauh melebihi ekspektasi kami.",
      name: "Rizky & Dinda",
      date: "Menikah 14 Feb 2025",
      initials: "RD",
      color: "bg-blue-100 text-blue-700",
    },
    {
      stars: 5,
      text: "Fitur RSVP-nya sangat membantu. Tidak perlu tanya satu-satu ke tamu siapa yang hadir — semua terpantau otomatis. Love story timeline-nya juga bikin terharu.",
      name: "Budi & Sari",
      date: "Menikah 21 Jun 2025",
      initials: "BS",
      color: "bg-rose-100 text-rose-700",
    },
    {
      stars: 5,
      text: "Tema Luxury Gold-nya persis dengan konsep pernikahan kami. Tamu dari luar kota pun bisa buka undangan dengan mudah dari HP masing-masing.",
      name: "Fajar & Ayu",
      date: "Menikah 8 Mar 2025",
      initials: "FA",
      color: "bg-amber-100 text-amber-700",
    },
  ];

  const faqs = [
    {
      q: "Apakah WedSaas benar-benar bisa dipakai gratis?",
      a: "Ya! Paket Gratis memungkinkan kamu membuat undangan digital lengkap tanpa biaya apapun — termasuk RSVP dan galeri foto. Untuk fitur lebih seperti musik latar, love story timeline, dan lebih banyak foto, kamu bisa upgrade ke paket Premium.",
    },
    {
      q: "Berapa lama undangan digital saya bisa diakses tamu?",
      a: "Paket Gratis aktif selama 1 tahun, sedangkan paket Premium dan Pro aktif selama 2 tahun sejak tanggal pembuatan — jauh melewati hari pernikahanmu, sehingga kenangan tetap bisa dilihat kapan saja.",
    },
    {
      q: "Bagaimana cara membagikan undangan ke tamu?",
      a: "Setelah undangan selesai, kamu mendapat link seperti wedsaas.com/nama-kalian. Tinggal salin dan kirim via WhatsApp, Instagram, atau SMS. Kamu juga bisa menambahkan nama tamu di link agar sambutan terasa personal.",
    },
    {
      q: "Bagaimana cara kerja fitur RSVP?",
      a: "Tamu membuka link undangan dan mengisi formulir konfirmasi kehadiran langsung dari halaman undangan. Semua data RSVP langsung masuk ke dashboardmu secara real-time, dan bisa diekspor ke Excel untuk paket Premium/Pro.",
    },
    {
      q: "Apakah ada batasan jumlah tamu yang bisa RSVP?",
      a: "Tidak ada! Semua paket mendukung RSVP tamu tak terbatas. Undang 50 atau 500 tamu — sistemnya tetap berjalan lancar.",
    },
    {
      q: "Bisakah saya mengubah isi undangan setelah dibagikan?",
      a: "Tentu bisa. Kamu bisa mengedit informasi acara, foto, dan konten kapan saja dari dashboard. Perubahan langsung terlihat oleh tamu yang membuka link tanpa perlu kirim ulang.",
    },
  ];

  const navLinks = ["Fitur", "Cara Kerja", "Tema", "Harga", "FAQ"];

  return (
    <div className="min-h-screen bg-white text-foreground font-sans">
      {/* Navbar */}
      <header
        data-testid="navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/" data-testid="logo" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">WedSaas</span>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(" ", "-")}`}
                  data-testid={`nav-link-${link.toLowerCase()}`}
                  className="text-sm font-medium text-slate-600 hover-elevate transition-colors"
                >
                  {link}
                </a>
              ))}
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <a href="/admin/login">
                <Button variant="ghost" size="sm" data-testid="button-masuk">
                  Masuk
                </Button>
              </a>
              <a href="/admin/new">
                <Button size="sm" data-testid="button-mulai-gratis">
                  Buat Undangan
                </Button>
              </a>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-md text-slate-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="text-sm font-medium text-slate-700 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <a href="/admin/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full" data-testid="button-masuk-mobile">Masuk</Button>
              </a>
              <a href="/admin/new" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full" data-testid="button-mulai-gratis-mobile">Buat Undangan</Button>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section
        id="hero"
        data-testid="section-hero"
        className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-full blur-3xl opacity-60" />
          <div className="absolute top-20 right-10 w-32 h-32 bg-blue-100 rounded-full blur-2xl opacity-40" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-rose-50 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Undangan Digital Pernikahan Terpercaya di Indonesia
          </div>

          {/* Heading */}
          <h1
            data-testid="hero-title"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight max-w-4xl mx-auto"
          >
            {heroData.hero_title}
          </h1>

          <p
            data-testid="hero-subtitle"
            className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            {heroData.hero_subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href={heroData.hero_cta_link || HERO_DEFAULTS.hero_cta_link}>
              <Button size="lg" data-testid="button-hero-buat-undangan" className="gap-2 px-8 text-base">
                {heroData.hero_cta_primary}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </a>
            <a href="#tema">
              <Button
                variant="outline"
                size="lg"
                data-testid="button-hero-lihat-tema"
                className="gap-2 px-8 text-base"
              >
                <Eye className="w-4 h-4" />
                {heroData.hero_cta_secondary}
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12">
            {[
              { icon: Users, value: "10.000+", label: "Pasangan Bahagia" },
              { icon: Star, value: "4.9/5", label: "Rating dari Pengguna" },
              { icon: Zap, value: "5 Menit", label: "Siap Dibagikan" },
            ].map((stat) => (
              <div
                key={stat.label}
                data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="text-xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Hero mockup */}
          <div className="mt-16 relative max-w-4xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
              {/* Browser chrome */}
              <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b border-slate-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4 bg-white rounded-md px-3 py-1 text-xs text-slate-400 border border-slate-200 text-center">
                  wedsaas.com/rizky-dinda?to=Pak+Hendra
                </div>
              </div>
              {/* Mock invitation preview */}
              <div className="relative h-64 sm:h-80 bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-600 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute text-white text-2xl opacity-30"
                      style={{ left: `${(i * 17) % 100}%`, top: `${(i * 23) % 100}%` }}
                    >
                      ✿
                    </div>
                  ))}
                </div>
                <div className="text-center text-white z-10 px-8">
                  <p className="text-blue-200 text-xs tracking-widest uppercase mb-1">Kepada Yth. Pak Hendra</p>
                  <p className="text-blue-200 text-sm tracking-widest uppercase mb-2">Undangan Pernikahan</p>
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="h-px w-16 bg-blue-300/50" />
                    <Heart className="w-5 h-5 text-rose-300 fill-rose-300" />
                    <div className="h-px w-16 bg-blue-300/50" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-1">Rizky & Dinda</h2>
                  <p className="text-blue-200 text-sm">Sabtu, 14 Februari 2026 • Jakarta</p>
                  <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 text-sm font-medium">
                    Konfirmasi Kehadiran
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-4 -right-4 sm:-right-6 bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 flex items-center gap-3 max-w-48">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">RSVP Baru!</div>
                <div className="text-xs text-slate-500">+3 tamu konfirmasi hadir</div>
              </div>
            </div>
            <div className="absolute -top-4 -left-4 sm:-left-6 bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Award className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">Disukai Tamu</div>
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="fitur"
        data-testid="section-features"
        className="py-20 lg:py-28 bg-slate-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Fitur Unggulan</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Semua yang Kamu Butuhkan
            </h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">
              Dari undangan hingga ucapan tamu — semua tersedia dalam satu link yang bisa langsung dibagikan
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card
                key={i}
                data-testid={`card-feature-${i}`}
                className="group border-card-border hover-elevate cursor-default transition-all duration-200"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="cara-kerja"
        data-testid="section-how-it-works"
        className="py-20 lg:py-28 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Cara Kerja</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Undangan Siap dalam 4 Langkah
            </h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">
              Tidak perlu desainer, tidak perlu nunggu lama — dari daftar hingga siap kirim hanya butuh beberapa menit
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div
                key={i}
                data-testid={`step-${i + 1}`}
                className="relative flex flex-col items-center text-center"
              >
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-9 left-[calc(50%+2rem)] right-[-50%] h-px bg-gradient-to-r from-blue-200 to-slate-200" />
                )}
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-md shadow-blue-200 mb-5">
                  <span className="text-white font-bold text-lg">{step.num}</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Theme Preview Section */}
      <section
        id="tema"
        data-testid="section-themes"
        className="py-20 lg:py-28 bg-slate-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Koleksi Tema</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Desain yang Memukau Tamu
            </h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">
              Pilih tema yang mencerminkan kepribadian dan cerita cinta kalian — dari nuansa mewah hingga simpel elegan
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {themes.map((theme, i) => (
              <div
                key={i}
                data-testid={`card-theme-${i}`}
                className="group rounded-xl border border-slate-200 bg-white shadow-sm hover-elevate transition-all duration-200 overflow-visible"
              >
                {/* Theme preview image area */}
                <div
                  className={`relative h-52 rounded-t-xl bg-gradient-to-br ${theme.gradient} overflow-hidden`}
                >
                  {/* Decorative pattern */}
                  <div className="absolute inset-0 opacity-10">
                    {Array.from({ length: 12 }).map((_, j) => (
                      <div
                        key={j}
                        className="absolute text-white text-lg"
                        style={{ left: `${(j * 19) % 90}%`, top: `${(j * 31) % 80}%` }}
                      >
                        {theme.pattern === "gold" ? "✦" : theme.pattern === "floral" ? "❀" : theme.pattern === "minimal" ? "·" : "◈"}
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
                    <Heart className="w-6 h-6 mb-2 fill-white/60 text-white/60" />
                    <div className="text-xs tracking-widest uppercase opacity-70 mb-1">Undangan</div>
                    <div className="font-serif text-lg font-bold text-center">Ahmad & Rina</div>
                    <div className="text-xs opacity-60 mt-1">12 Desember 2026</div>
                  </div>
                  {theme.badge && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-white/90 backdrop-blur-sm text-slate-900 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {theme.badge}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900 text-sm">{theme.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium text-slate-700">{theme.rating}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href="/invite/demo-wedding" target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-preview-theme-${i}`}
                        className="w-full text-xs"
                      >
                        Lihat Demo
                      </Button>
                    </a>
                    <a href="/admin/new" className="flex-1">
                      <Button
                        size="sm"
                        data-testid={`button-use-theme-${i}`}
                        className="w-full text-xs"
                      >
                        Pakai Tema
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button variant="outline" size="lg" data-testid="button-lihat-semua-tema" className="gap-2">
              Lihat Semua Tema
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="harga"
        data-testid="section-pricing"
        className="py-20 lg:py-28 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Harga</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Harga Terjangkau, Kenangan Selamanya
            </h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">
              Bayar sekali, undangan aktif bertahun-tahun. Tidak ada biaya bulanan, tidak ada biaya cetak.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricing.map((plan, i) => (
              <div
                key={i}
                data-testid={`card-pricing-${plan.name.toLowerCase()}`}
                className={`relative rounded-2xl border p-6 flex flex-col transition-all duration-200 ${
                  plan.highlight
                    ? "bg-primary text-white border-primary shadow-lg shadow-blue-200 scale-105"
                    : "bg-white border-slate-200 hover-elevate"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      Paling Populer
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className={`font-semibold text-lg mb-1 ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                    {plan.name}
                  </h3>
                  <div className={`text-3xl font-bold ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                    {plan.price}
                  </div>
                  {plan.period && (
                    <div className={`text-sm mt-0.5 ${plan.highlight ? "text-blue-100" : "text-slate-500"}`}>
                      {plan.period}
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feat, j) => (
                    <li
                      key={j}
                      data-testid={`feature-${plan.name.toLowerCase()}-${j}`}
                      className="flex items-start gap-2.5"
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          plan.highlight ? "bg-white/20" : "bg-blue-50"
                        }`}
                      >
                        <Check
                          className={`w-3 h-3 ${plan.highlight ? "text-white" : "text-primary"}`}
                        />
                      </div>
                      <span
                        className={`text-sm ${plan.highlight ? "text-blue-50" : "text-slate-600"}`}
                      >
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>

                <a href="/admin/new" className="block">
                  <Button
                    variant={plan.highlight ? "secondary" : plan.variant}
                    data-testid={`button-cta-pricing-${plan.name.toLowerCase()}`}
                    className={`w-full ${plan.highlight ? "bg-white text-primary font-semibold" : ""}`}
                  >
                    {plan.cta}
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="testimonial"
        data-testid="section-testimonials"
        className="py-20 lg:py-28 bg-slate-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Testimoni</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Kata Pasangan yang Sudah Merasakan
            </h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">
              Ribuan pasangan telah mempercayai WedSaas untuk mengundang tamu di hari paling spesial mereka
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <Card
                key={i}
                data-testid={`card-testimonial-${i}`}
                className="border-card-border hover-elevate transition-all duration-200"
              >
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: testimonial.stars }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${testimonial.color} flex items-center justify-center font-semibold text-sm flex-shrink-0`}
                    >
                      {testimonial.initials}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{testimonial.name}</div>
                      <div className="text-xs text-slate-400">{testimonial.date}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq"
        data-testid="section-faq"
        className="py-20 lg:py-28 bg-white"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Pertanyaan yang Sering Ditanya
            </h2>
            <p className="mt-4 text-slate-500">
              Masih ada pertanyaan? Hubungi kami via WhatsApp atau email ke support@wedsaas.com
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                data-testid={`faq-item-${i}`}
                className="border border-slate-200 rounded-xl px-5 hover-elevate transition-all"
              >
                <AccordionTrigger className="text-left font-medium text-slate-900 text-sm py-4 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-500 text-sm pb-4 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="cta"
        data-testid="section-cta"
        className="py-20 lg:py-28 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 relative overflow-hidden"
      >
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-medium px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <Heart className="w-3.5 h-3.5 fill-rose-300 text-rose-300" />
            Dipercaya 10.000+ Pasangan di Seluruh Indonesia
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
            Wujudkan Undangan Impian Kalian
          </h2>
          <p className="mt-5 text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed">
            Undangan digital yang elegan, mudah dibagikan, dan dikenang tamu.
            Mulai gratis sekarang — siap dalam 5 menit.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/admin/new">
              <Button
                size="lg"
                data-testid="button-cta-mulai"
                className="bg-white text-primary font-semibold gap-2 px-8 text-base"
              >
                <Heart className="w-4 h-4 fill-current" />
                Buat Undangan Sekarang
              </Button>
            </a>
            <a href="/invite/demo-wedding" target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="lg"
                data-testid="button-cta-lihat-tema"
                className="border-white/40 text-white bg-white/10 backdrop-blur-sm gap-2 px-8 text-base"
              >
                <Eye className="w-4 h-4" />
                Lihat Contoh Undangan
              </Button>
            </a>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            {[
              { icon: Check, text: "Tampil cantik di HP" },
              { icon: Check, text: "Bebas biaya cetak" },
              { icon: Check, text: "Selesai dalam 5 menit" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-blue-100">
                <div className="w-4 h-4 rounded-full bg-blue-400/40 flex items-center justify-center">
                  <item.icon className="w-2.5 h-2.5 text-white" />
                </div>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        data-testid="footer"
        className="bg-slate-900 text-slate-400 py-12"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-lg font-bold text-white">WedSaas</span>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap items-center justify-center gap-6">
              {[
                { label: "Tema", href: "#tema" },
                { label: "Privasi", href: "#privasi" },
                { label: "Syarat", href: "#syarat" },
                { label: "Kontak", href: "#kontak" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  data-testid={`footer-link-${link.label.toLowerCase()}`}
                  className="text-sm hover-elevate transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Copyright */}
            <p data-testid="footer-copyright" className="text-sm text-slate-500">
              © 2026 WedSaas. Dibuat dengan cinta untuk pasangan Indonesia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
