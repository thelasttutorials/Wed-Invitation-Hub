import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";

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
export async function seedDemoInvitation() {
  try {
    const existing = await storage.getInvitationBySlug("demo-wedding");
    if (existing) return;

    const inv = await storage.createInvitation({
      slug: "demo-wedding",
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
      mapsUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.521260322283!2d106.8195613!3d-6.2087634!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMTInMzEuNiJTIDEwNsKwNDknMTAuNCJF!5e0!3m2!1sid!2sid!4v1600000000000!5m2!1sid!2sid",
      openingQuote: "Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di hari bahagia kami. — QS. Ar-Rum: 21",
      coverPhotoUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
      galleryPhotos: [
        "https://images.unsplash.com/photo-1519741497674-611481863552?w=600",
        "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600",
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600",
        "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600",
      ],
      musicUrl: "",
      videoUrl: "",
      additionalNotes: "Mohon konfirmasi kehadiran Anda paling lambat 7 hari sebelum acara. Dresscode: Soft Pink & Navy Blue.",
      isPublished: true,
    });

    await storage.replaceLoveStory(inv.id, [
      { dateLabel: "Maret 2021", title: "Pertama Bertemu", description: "Kami pertama kali bertemu di sebuah acara seminar kampus. Satu tatapan penuh makna yang mengubah segalanya.", photoUrl: "", sortOrder: 0 },
      { dateLabel: "Desember 2022", title: "Kencan Pertama", description: "Kencan pertama kami di tepi danau Situ Gintung. Berbagi cerita, tawa, dan harapan hingga larut malam.", photoUrl: "", sortOrder: 1 },
      { dateLabel: "Juni 2024", title: "Lamaran", description: "Di bawah sinar bintang dan doa kedua keluarga, dia berlutut dan mengucapkan kata yang mengubah hidup kami selamanya.", photoUrl: "", sortOrder: 2 },
      { dateLabel: "Agustus 2026", title: "Hari Bahagia", description: "Hari ini kami resmi mengikat janji suci di hadapan Allah SWT dan kedua keluarga yang kami cintai.", photoUrl: "", sortOrder: 3 },
    ]);

    console.log("[seed] Demo invitation created: demo-wedding");
  } catch (e) {
    console.error("[seed] Failed to seed demo invitation:", e);
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
