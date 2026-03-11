import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpEmail(email: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[userAuth] OTP untuk ${email}: ${code} (RESEND_API_KEY belum diset — email tidak dikirim)`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: "WedSaas <noreply@wedsaas.id>",
    to: [email],
    subject: "Kode Login Undangan Pernikahan",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#1e293b;margin-bottom:8px;">Kode Verifikasi WedSaas</h2>
        <p style="color:#64748b;margin-bottom:24px;">
          Gunakan kode berikut untuk masuk ke akun kamu:
        </p>
        <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;">
          <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#1e293b;">
            ${code}
          </span>
        </div>
        <p style="color:#94a3b8;font-size:13px;margin-top:20px;">
          Kode ini berlaku selama 5 menit dan hanya dapat digunakan sekali.
          Jika kamu tidak meminta kode ini, abaikan email ini.
        </p>
      </div>
    `,
  });
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Silakan login terlebih dahulu." });
  }
  next();
}

export function registerUserAuthRoutes(app: Express) {
  const requestCodeSchema = z.object({
    email: z.string().email("Email tidak valid"),
  });

  const verifyCodeSchema = z.object({
    email: z.string().email("Email tidak valid"),
    code: z.string().length(6, "Kode harus 6 digit"),
  });

  app.post("/api/auth/request-code", async (req, res) => {
    const parsed = requestCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }
    const { email } = parsed.data;
    const emailLower = email.toLowerCase();

    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recentCount = await storage.countRecentVerifications(emailLower, windowStart);
    if (recentCount >= RATE_LIMIT_MAX) {
      return res.status(429).json({
        error: "Terlalu banyak permintaan. Tunggu 10 menit sebelum mencoba lagi.",
      });
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    await storage.createVerification(emailLower, code, expiresAt);

    try {
      await sendOtpEmail(emailLower, code);
    } catch (err) {
      console.error("[userAuth] Gagal kirim email:", err);
      return res.status(500).json({ error: "Gagal mengirim email. Coba lagi." });
    }

    return res.json({ ok: true, message: "Kode verifikasi telah dikirim ke email kamu." });
  });

  app.post("/api/auth/verify-code", async (req, res) => {
    const parsed = verifyCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }
    const { email, code } = parsed.data;
    const emailLower = email.toLowerCase();

    const verification = await storage.findValidVerification(emailLower, code);
    if (!verification) {
      return res.status(400).json({
        error: "Kode tidak valid atau sudah kadaluarsa. Minta kode baru.",
      });
    }

    await storage.markVerificationUsed(verification.id);

    let user = await storage.getUserByEmail(emailLower);
    const isNew = !user;
    if (!user) {
      user = await storage.createUser(emailLower);
    } else if (!user.isVerified) {
      await storage.verifyUser(user.id);
      user = (await storage.getUserById(user.id))!;
    }

    if (isNew) {
      try {
        const freePlan = await storage.getPricingPlanBySlug("gratis");
        if (freePlan) await storage.createSubscription(user.id, freePlan.id, "active");
      } catch {}
    }

    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        console.error("[userAuth] Gagal menyimpan sesi:", err);
        return res.status(500).json({ error: "Gagal menyimpan sesi. Coba lagi." });
      }
      return res.json({ ok: true, user: { id: user.id, email: user.email } });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Tidak terautentikasi." });
    }
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "Sesi tidak valid." });
    }
    return res.json({ id: user.id, email: user.email });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ ok: true });
    });
  });
}
