import { useState, useEffect } from "react";
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

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: Palette,
      title: "Builder Visual",
      desc: "Desain undangan secara visual dengan drag & drop. Tidak perlu keahlian coding.",
    },
    {
      icon: Smartphone,
      title: "Responsif di Semua Device",
      desc: "Tampil sempurna di HP, tablet, dan desktop. Tamu bisa membuka dari mana saja.",
    },
    {
      icon: Link2,
      title: "Link Khusus",
      desc: "Dapatkan link undangan personal seperti wedsaas.com/namakalian yang mudah diingat.",
    },
    {
      icon: ClipboardList,
      title: "RSVP Online",
      desc: "Konfirmasi kehadiran tamu secara online. Kelola daftar tamu dengan mudah.",
    },
    {
      icon: Image,
      title: "Galeri Foto",
      desc: "Tampilkan momen berharga kalian dengan galeri foto yang elegan dan menarik.",
    },
    {
      icon: Gift,
      title: "Hadiah Digital",
      desc: "Fitur amplop digital dan wishlist untuk mempermudah tamu memberikan hadiah.",
    },
  ];

  const steps = [
    { num: "01", title: "Daftar Akun", desc: "Buat akun gratis dalam hitungan detik. Tidak perlu kartu kredit." },
    { num: "02", title: "Isi Data Pernikahan", desc: "Masukkan detail acara, nama mempelai, dan informasi pernikahan." },
    { num: "03", title: "Pilih Tema", desc: "Pilih dari ratusan tema elegan yang bisa dikustomisasi sepenuhnya." },
    { num: "04", title: "Bagikan & Rayakan", desc: "Bagikan link undangan ke seluruh tamu dan rayakan hari istimewamu." },
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
        "1 Undangan Aktif",
        "3 Tema Dasar",
        "RSVP Online",
        "Link Undangan",
        "Galeri 10 Foto",
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
        "3 Undangan Aktif",
        "50+ Tema Premium",
        "RSVP + Export Excel",
        "Link Custom",
        "Galeri 100 Foto",
        "Hadiah Digital",
        "Musik Latar",
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
        "Undangan Tidak Terbatas",
        "Semua Tema + Eksklusif",
        "RSVP + Manajemen Tamu",
        "Domain Custom",
        "Galeri Tidak Terbatas",
        "Hadiah Digital Lanjutan",
        "Prioritas Support",
        "Analitik Tamu",
      ],
      cta: "Pilih Pro",
      variant: "outline" as const,
    },
  ];

  const testimonials = [
    {
      stars: 5,
      text: "Undangan digital kami terlihat sangat memukau! Semua tamu memuji betapa elegannya tampilannya. Proses pembuatannya pun sangat mudah dan cepat.",
      name: "Rizky & Dinda",
      date: "Menikah 14 Feb 2025",
      initials: "RD",
      color: "bg-blue-100 text-blue-700",
    },
    {
      stars: 5,
      text: "WedSaas benar-benar memudahkan kami mengelola RSVP. Tidak perlu lagi repot menghitung tamu secara manual. Fitur hadiah digital-nya juga sangat membantu!",
      name: "Budi & Sari",
      date: "Menikah 21 Jun 2025",
      initials: "BS",
      color: "bg-rose-100 text-rose-700",
    },
    {
      stars: 5,
      text: "Tema Luxury Gold yang kami pilih sangat sesuai dengan konsep pernikahan kami. Responsif di semua perangkat, dan link-nya mudah dibagikan ke keluarga.",
      name: "Fajar & Ayu",
      date: "Menikah 8 Mar 2025",
      initials: "FA",
      color: "bg-amber-100 text-amber-700",
    },
  ];

  const faqs = [
    {
      q: "Apakah WedSaas benar-benar gratis?",
      a: "Ya! Paket Gratis kami memungkinkan kamu membuat satu undangan digital tanpa biaya apapun. Untuk fitur lebih lengkap seperti tema premium, galeri lebih banyak, dan link custom, kamu bisa upgrade ke paket Premium atau Pro.",
    },
    {
      q: "Berapa lama undangan digital saya aktif?",
      a: "Undangan digital kamu akan aktif selama 2 tahun sejak tanggal pembuatan. Kamu bisa memperpanjangnya kapan saja melalui dashboard akun.",
    },
    {
      q: "Bisakah saya mengubah tema setelah undangan dibuat?",
      a: "Tentu saja! Kamu bisa mengganti tema kapan saja tanpa kehilangan data undangan yang sudah diisi. Semua informasi pernikahan akan otomatis menyesuaikan dengan tema baru.",
    },
    {
      q: "Bagaimana cara kerja fitur RSVP?",
      a: "Tamu kamu cukup membuka link undangan dan mengisi formulir konfirmasi kehadiran. Semua data RSVP akan tersimpan di dashboard kamu dan bisa diekspor ke Excel (paket Premium/Pro).",
    },
    {
      q: "Apakah ada batasan jumlah tamu yang bisa RSVP?",
      a: "Tidak ada batasan! Semua paket mendukung jumlah tamu RSVP yang tidak terbatas. Kamu bisa mengundang sebanyak mungkin tamu tanpa khawatir.",
    },
    {
      q: "Bisakah saya menambahkan musik latar di undangan?",
      a: "Fitur musik latar tersedia di paket Premium dan Pro. Kamu bisa upload file MP3 atau pilih dari koleksi musik romantis yang sudah kami sediakan.",
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
            <a href="#" data-testid="logo" className="flex items-center gap-2 group">
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
              <Button variant="ghost" size="sm" data-testid="button-masuk">
                Masuk
              </Button>
              <Button size="sm" data-testid="button-mulai-gratis">
                Mulai Gratis
              </Button>
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
              <Button variant="outline" size="sm" data-testid="button-masuk-mobile">Masuk</Button>
              <Button size="sm" data-testid="button-mulai-gratis-mobile">Mulai Gratis</Button>
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
            Platform Undangan Digital #1 di Indonesia
          </div>

          {/* Heading */}
          <h1
            data-testid="hero-title"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight max-w-4xl mx-auto"
          >
            Undangan Pernikahan{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary">Digital</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-blue-100 rounded-sm -z-0 opacity-70" />
            </span>{" "}
            yang Elegan & Modern
          </h1>

          <p
            data-testid="hero-subtitle"
            className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            Buat undangan pernikahan digital yang memukau dalam hitungan menit.
            Tanpa keahlian desain, tanpa ribet — cukup pilih tema, isi data, dan bagikan ke semua tamu.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" data-testid="button-hero-buat-undangan" className="gap-2 px-8 text-base">
              Buat Undangan Gratis
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              data-testid="button-hero-lihat-tema"
              className="gap-2 px-8 text-base"
            >
              <Eye className="w-4 h-4" />
              Lihat Tema
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12">
            {[
              { icon: Users, value: "10.000+", label: "Pasangan" },
              { icon: Star, value: "4.9/5", label: "Rating" },
              { icon: Zap, value: "100%", label: "Gratis Mulai" },
            ].map((stat) => (
              <div
                key={stat.label}
                data-testid={`stat-${stat.label.toLowerCase()}`}
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
                  wedsaas.com/rizky-dinda
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
                <div className="text-xs text-slate-500">+3 tamu hadir</div>
              </div>
            </div>
            <div className="absolute -top-4 -left-4 sm:-left-6 bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Award className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">Rating 5 Bintang</div>
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
              Fitur lengkap untuk menciptakan undangan pernikahan digital yang tak terlupakan
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
              Mudah dalam 4 Langkah
            </h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">
              Dari daftar hingga undangan siap dibagikan, hanya butuh beberapa menit
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
              Desain yang Memukau
            </h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">
              Pilih dari ratusan tema elegan yang dirancang khusus untuk hari spesialmu
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
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`button-preview-theme-${i}`}
                      className="flex-1 text-xs"
                    >
                      Preview Demo
                    </Button>
                    <Button
                      size="sm"
                      data-testid={`button-use-theme-${i}`}
                      className="flex-1 text-xs"
                    >
                      Gunakan
                    </Button>
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
              Pilihan yang Sesuai Budget
            </h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">
              Mulai gratis, upgrade kapan saja. Tanpa biaya langganan tersembunyi.
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

                <Button
                  variant={plan.highlight ? "secondary" : plan.variant}
                  data-testid={`button-cta-pricing-${plan.name.toLowerCase()}`}
                  className={`w-full ${plan.highlight ? "bg-white text-primary font-semibold" : ""}`}
                >
                  {plan.cta}
                </Button>
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
              Kata Mereka
            </h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">
              Ribuan pasangan telah mempercayai WedSaas untuk hari spesial mereka
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
              Pertanyaan Umum
            </h2>
            <p className="mt-4 text-slate-500">
              Tidak menemukan jawaban? Hubungi kami di support@wedsaas.com
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
            Bergabung dengan 10.000+ Pasangan Bahagia
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
            Siap Membuat Undangan Impianmu?
          </h2>
          <p className="mt-5 text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed">
            Mulai gratis sekarang. Tidak perlu kartu kredit, tidak ada syarat tersembunyi.
            Buat undangan elegan dalam hitungan menit.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              data-testid="button-cta-mulai"
              className="bg-white text-primary font-semibold gap-2 px-8 text-base"
            >
              <Zap className="w-4 h-4" />
              Mulai Sekarang — Gratis
            </Button>
            <Button
              variant="outline"
              size="lg"
              data-testid="button-cta-lihat-tema"
              className="border-white/40 text-white bg-white/10 backdrop-blur-sm gap-2 px-8 text-base"
            >
              <Eye className="w-4 h-4" />
              Lihat Koleksi Tema
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            {[
              { icon: Check, text: "Gratis selamanya" },
              { icon: Check, text: "Tanpa kartu kredit" },
              { icon: Check, text: "Setup dalam 5 menit" },
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
              © 2025 WedSaas. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
