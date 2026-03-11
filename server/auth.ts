import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { PricingPlan } from "@shared/schema";

// ─────────────────────────────────────────────────────────────
// Extend express-session to carry adminId
// ─────────────────────────────────────────────────────────────
declare module "express-session" {
  interface SessionData {
    adminId: number;
  }
}

// ─────────────────────────────────────────────────────────────
// Middleware — protects any route that requires admin session
// ─────────────────────────────────────────────────────────────
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.adminId) {
    return res.status(401).json({ error: "Tidak terautentikasi. Silakan login terlebih dahulu." });
  }
  next();
}

// ─────────────────────────────────────────────────────────────
// Seed default admin on first startup
// ─────────────────────────────────────────────────────────────
export async function seedDefaultAdmin() {
  try {
    const existing = await storage.getAdminByEmail("admin@wedhub.com");
    if (!existing) {
      const passwordHash = await bcrypt.hash("admin123", 12);
      await storage.createAdmin({
        email: "admin@wedhub.com",
        passwordHash,
        name: "Super Admin",
      });
      console.log("[auth] Default admin created: admin@wedhub.com");
    }
  } catch (e) {
    console.error("[auth] Failed to seed default admin:", e);
  }
}

// ─────────────────────────────────────────────────────────────
// Seed demo invitation on first startup
// ─────────────────────────────────────────────────────────────
const DEMO_INVITATIONS = [
  {
    slug: "demo-luxury-gold",
    groomName: "Ardhian Kusuma",
    brideName: "Nadya Permata",
    groomParents: "Bp. Kusuma Wijaya & Ibu Sri Handayani",
    brideParents: "Bp. Permata Alam & Ibu Dewi Sartika",
    akadDate: "2026-12-12",
    akadTime: "08.00 - 10.00 WIB",
    receptionDate: "2026-12-12",
    receptionTime: "11.00 - 14.00 WIB",
    venueName: "The Ritz-Carlton Ballroom",
    venueAddress: "Jl. MH Thamrin No. 9, Jakarta Pusat",
    openingQuote: "Dan di antara tanda-tanda kekuasaan-Nya, Dia menciptakan pasangan untukmu agar kamu merasa tenteram. — QS. Ar-Rum: 21",
    coverPhotoUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80",
    galleryPhotos: [
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600",
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=600",
      "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600",
    ],
    additionalNotes: "Dresscode: Gold & Ivory. Mohon konfirmasi paling lambat H-7.",
    loveStory: [
      { dateLabel: "Januari 2020", title: "Pertemuan Pertama", description: "Kami pertama bertemu di sebuah gala dinner perusahaan. Senyumnya yang hangat langsung mencuri perhatian.", sortOrder: 0 },
      { dateLabel: "Maret 2021", title: "Jatuh Cinta", description: "Perjalanan bersama ke Bali menjadi titik balik — kami sadar bahwa ini bukan sekadar pertemanan biasa.", sortOrder: 1 },
      { dateLabel: "November 2024", title: "Lamaran Mewah", description: "Di rooftop bintang lima dengan rangkaian mawar, dia melamar dengan cincin yang paling indah.", sortOrder: 2 },
      { dateLabel: "Desember 2026", title: "Hari Istimewa", description: "Bersama keluarga dan sahabat tercinta, kami memulai babak baru kehidupan yang penuh kasih.", sortOrder: 3 },
    ],
  },
  {
    slug: "demo-romantic-floral",
    groomName: "Bagas Saputra",
    brideName: "Kinanti Ayu",
    groomParents: "Bp. Saputra Hadi & Ibu Wulan Sari",
    brideParents: "Bp. Ayu Pratama & Ibu Melati Indah",
    akadDate: "2026-09-21",
    akadTime: "08.30 - 10.00 WIB",
    receptionDate: "2026-09-21",
    receptionTime: "11.00 - 15.00 WIB",
    venueName: "Taman Bunga Nusantara",
    venueAddress: "Jl. Mariwati Km 7, Cipanas, Cianjur, Jawa Barat",
    openingQuote: "Cinta adalah persahabatan yang telah terbakar api. — Susan Anspach",
    coverPhotoUrl: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&q=80",
    galleryPhotos: [
      "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600",
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=600",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600",
    ],
    additionalNotes: "Dresscode: Dusty Rose & Sage Green. Acara outdoor, disarankan pakai alas kaki nyaman.",
    loveStory: [
      { dateLabel: "April 2021", title: "Bertemu di Kebun", description: "Pertama kali bertemu saat festival bunga tahunan. Di antara hamparan anyelir, tatapan kami bertemu.", sortOrder: 0 },
      { dateLabel: "Agustus 2022", title: "Kencan Pertama", description: "Berjalan-jalan sore di taman kota, berbagi es krim dan cerita masa kecil.", sortOrder: 1 },
      { dateLabel: "Februari 2025", title: "Dilamar di Taman", description: "Di bawah pohon sakura yang sedang mekar, dia melamar dengan cincin dan setangkai lavender.", sortOrder: 2 },
      { dateLabel: "September 2026", title: "Hari Bunga Kami", description: "Menikah di taman bunga yang indah, dikelilingi keluarga dan sahabat yang kami cintai.", sortOrder: 3 },
    ],
  },
  {
    slug: "demo-minimal-modern",
    groomName: "Rizky Pratama",
    brideName: "Dinda Maharani",
    groomParents: "Bp. Hendra Santoso & Ibu Wati Lestari",
    brideParents: "Bp. Agus Salim & Ibu Rina Puspita",
    akadDate: "2026-08-17",
    akadTime: "08.00 - 10.00 WIB",
    receptionDate: "2026-08-17",
    receptionTime: "11.00 - 14.00 WIB",
    venueName: "The Grand Ballroom",
    venueAddress: "Jl. Sudirman No. 1, Jakarta Pusat, DKI Jakarta",
    openingQuote: "Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di hari bahagia kami. — QS. Ar-Rum: 21",
    coverPhotoUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
    galleryPhotos: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=600",
      "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600",
    ],
    additionalNotes: "Dresscode: All White & Navy. Mohon konfirmasi kehadiran paling lambat 7 hari sebelum acara.",
    loveStory: [
      { dateLabel: "Maret 2021", title: "Pertama Bertemu", description: "Kami pertama kali bertemu di sebuah acara seminar kampus. Satu tatapan penuh makna yang mengubah segalanya.", sortOrder: 0 },
      { dateLabel: "Desember 2022", title: "Kencan Pertama", description: "Kencan pertama kami di tepi danau Situ Gintung. Berbagi cerita, tawa, dan harapan hingga larut malam.", sortOrder: 1 },
      { dateLabel: "Juni 2024", title: "Lamaran", description: "Di bawah sinar bintang dan doa kedua keluarga, dia berlutut dan mengucapkan kata yang mengubah hidup kami selamanya.", sortOrder: 2 },
      { dateLabel: "Agustus 2026", title: "Hari Bahagia", description: "Hari ini kami resmi mengikat janji suci di hadapan Allah SWT dan kedua keluarga yang kami cintai.", sortOrder: 3 },
    ],
  },
  {
    slug: "demo-classic-elegant",
    groomName: "Farhan Hidayat",
    brideName: "Salsabila Putri",
    groomParents: "Bp. Hidayat Nugraha & Ibu Siti Aminah",
    brideParents: "Bp. Putri Santoso & Ibu Fatimah Zahra",
    akadDate: "2026-11-07",
    akadTime: "09.00 - 10.30 WIB",
    receptionDate: "2026-11-07",
    receptionTime: "12.00 - 16.00 WIB",
    venueName: "Pendopo Agung Keraton",
    venueAddress: "Jl. Raya Kuta No. 8, Yogyakarta",
    openingQuote: "Maha Suci Allah yang telah menciptakan pasangan-pasangan semuanya, baik dari apa yang ditumbuhkan oleh bumi. — QS. Yasin: 36",
    coverPhotoUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80",
    galleryPhotos: [
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600",
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=600",
      "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600",
    ],
    additionalNotes: "Dresscode: Batik & Kebaya. Kami sangat menghargai kehadiran Bapak/Ibu/Saudara/i.",
    loveStory: [
      { dateLabel: "Juni 2020", title: "Takdir Bertemu", description: "Dipertemukan melalui keluarga dalam sebuah acara pengajian. Dari situ, kami mulai saling mengenal.", sortOrder: 0 },
      { dateLabel: "Oktober 2021", title: "Taaruf", description: "Proses taaruf yang penuh doa dan restu keluarga membawa kami semakin yakin satu sama lain.", sortOrder: 1 },
      { dateLabel: "Maret 2025", title: "Khitbah", description: "Dengan ijin Allah dan restu kedua keluarga, khitbah berjalan dengan penuh kebahagiaan.", sortOrder: 2 },
      { dateLabel: "November 2026", title: "Ijab Qabul", description: "Satu kalimat sakral yang mengikat dua jiwa menjadi satu, insya Allah hingga akhir hayat.", sortOrder: 3 },
    ],
  },
];

export async function seedDemoInvitation() {
  for (const demo of DEMO_INVITATIONS) {
    try {
      const existing = await storage.getInvitationBySlug(demo.slug);
      if (existing) continue;

      const inv = await storage.createInvitation({
        slug: demo.slug,
        groomName: demo.groomName,
        brideName: demo.brideName,
        groomParents: demo.groomParents,
        brideParents: demo.brideParents,
        akadDate: demo.akadDate,
        akadTime: demo.akadTime,
        receptionDate: demo.receptionDate,
        receptionTime: demo.receptionTime,
        venueName: demo.venueName,
        venueAddress: demo.venueAddress,
        mapsUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.521260322283!2d106.8195613!3d-6.2087634!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMTInMzEuNiJTIDEwNsKwNDknMTAuNCJF!5e0!3m2!1sid!2sid!4v1600000000000!5m2!1sid!2sid",
        openingQuote: demo.openingQuote,
        coverPhotoUrl: demo.coverPhotoUrl,
        galleryPhotos: demo.galleryPhotos,
        musicUrl: "",
        videoUrl: "",
        additionalNotes: demo.additionalNotes,
        isPublished: true,
      });

      await storage.replaceLoveStory(inv.id, demo.loveStory.map(item => ({
        dateLabel: item.dateLabel,
        title: item.title,
        description: item.description,
        photoUrl: "",
        sortOrder: item.sortOrder,
      })));

      console.log(`[seed] Demo invitation created: ${demo.slug}`);
    } catch (e) {
      console.error(`[seed] Failed to seed ${demo.slug}:`, e);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Auth routes: login / logout / me
// ─────────────────────────────────────────────────────────────
export function registerAuthRoutes(app: Express) {
  // POST /api/admin/login
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email dan password diperlukan." });
      }

      const admin = await storage.getAdminByEmail(email.toLowerCase().trim());
      if (!admin) {
        return res.status(401).json({ error: "Email atau password salah." });
      }

      const valid = await bcrypt.compare(password, admin.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Email atau password salah." });
      }

      req.session.adminId = admin.id;
      res.json({ id: admin.id, email: admin.email, name: admin.name });
    } catch (e) {
      console.error("[auth] Login error:", e);
      res.status(500).json({ error: "Gagal login. Coba lagi." });
    }
  });

  // POST /api/admin/logout
  app.post("/api/admin/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  // GET /api/admin/me
  app.get("/api/admin/me", async (req: Request, res: Response) => {
    if (!req.session?.adminId) {
      return res.status(401).json({ error: "Tidak terautentikasi." });
    }
    try {
      const admin = await storage.getAdminById(req.session.adminId);
      if (!admin) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: "Sesi tidak valid." });
      }
      res.json({ id: admin.id, email: admin.email, name: admin.name });
    } catch {
      res.status(500).json({ error: "Gagal memuat data admin." });
    }
  });
}

// ─────────────────────────────────────────────────────────────
// Seed default pricing plans on first startup
// ─────────────────────────────────────────────────────────────
export async function seedPricingPlans() {
  type PlanSeed = Omit<PricingPlan, "id" | "createdAt" | "updatedAt">;
  const plans: PlanSeed[] = [
    {
      name: "Mulai Gratis",
      slug: "gratis",
      price: 0,
      description: "Coba buat undangan digital pertama kamu",
      maxInvitations: 1,
      maxGalleryPhotos: 3,
      allowPremiumTemplates: false,
      allowMusic: false,
      allowLoveStory: false,
      allowGift: false,
      allowCustomDomain: false,
      isActive: true,
    },
    {
      name: "Premium",
      slug: "premium",
      price: 99000,
      description: "Untuk pasangan yang menginginkan undangan lebih lengkap",
      maxInvitations: 5,
      maxGalleryPhotos: 15,
      allowPremiumTemplates: true,
      allowMusic: true,
      allowLoveStory: true,
      allowGift: true,
      allowCustomDomain: false,
      isActive: true,
    },
    {
      name: "Pro",
      slug: "pro",
      price: 199000,
      description: "Fitur lengkap tanpa batas untuk hari istimewa Anda",
      maxInvitations: 999,
      maxGalleryPhotos: 999,
      allowPremiumTemplates: true,
      allowMusic: true,
      allowLoveStory: true,
      allowGift: true,
      allowCustomDomain: true,
      isActive: true,
    },
  ];

  for (const plan of plans) {
    try {
      await storage.upsertPricingPlan(plan.slug, plan);
    } catch (e) {
      console.error(`[auth] Failed to seed plan ${plan.slug}:`, e);
    }
  }
  console.log("[auth] Pricing plans seeded.");
}

// ─────────────────────────────────────────────────────────────
// Seed default bank settings on first startup
// ─────────────────────────────────────────────────────────────
export async function seedBankSettings() {
  try {
    const existing = await storage.getBankSettings();
    if (!existing) {
      await storage.upsertBankSettings({
        bankName: "BCA",
        accountNumber: "1234567890",
        accountHolder: "Wed Invitation Hub",
        paymentNote: "Transfer sesuai nominal lalu upload bukti pembayaran",
      });
      console.log("[auth] Default bank settings seeded.");
    }
  } catch (e) {
    console.error("[auth] Failed to seed bank settings:", e);
  }
}
