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
