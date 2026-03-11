import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { requireAdmin } from "./auth";
import { requireUser } from "./userAuth";
import {
  insertInvitationSchema,
  updateInvitationSchema,
  insertRsvpSchema,
  insertWishSchema,
  insertContactMessageSchema,
} from "@shared/schema";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .substring(0, 80);
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ── Contact Messages ───────────────────────────────────────────────────────────

  app.post("/api/contact", async (req, res) => {
    try {
      const parsed = insertContactMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Data tidak valid.", details: parsed.error.flatten() });
      }
      const message = await storage.createContactMessage(parsed.data);
      res.json(message);
    } catch (err) {
      res.status(500).json({ error: "Gagal mengirim pesan." });
    }
  });

  app.get("/api/admin/contact-messages", requireAdmin, async (_req, res) => {
    try {
      const messages = await storage.getAllContactMessages();
      res.json(messages);
    } catch (err) {
      res.status(500).json({ error: "Gagal memuat pesan." });
    }
  });

  // ── Invitations ───────────────────────────────────────────────────────────────

  app.get("/api/invitations", requireAdmin, async (_req, res) => {
    try {
      const invitations = await storage.getAllInvitations();
      res.json(invitations);
    } catch {
      res.status(500).json({ error: "Gagal memuat data undangan." });
    }
  });

  // User-specific invitation list — for customer dashboard
  app.get("/api/my-invitations", requireUser, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const invitations = await storage.getInvitationsByUser(userId);
      res.json(invitations);
    } catch {
      res.status(500).json({ error: "Gagal memuat data undangan." });
    }
  });

  // Create invitation as authenticated customer
  app.post("/api/my-invitations", requireUser, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const sub = await storage.getActiveSubscription(userId);
      const plan = sub?.plan;
      const existing = await storage.getInvitationsByUser(userId);
      const realCount = existing.filter(inv => !inv.slug.startsWith("demo-")).length;
      const maxInv = plan?.maxInvitations ?? 1;
      if (realCount >= maxInv) {
        return res.status(403).json({ error: `Batas undangan paket ${plan?.name ?? "Gratis"} sudah tercapai (${maxInv}). Upgrade paket untuk menambah lebih banyak.` });
      }
      const body = sanitizeDates({ ...req.body, userId, isPublished: false });
      const parsed = insertInvitationSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Data tidak valid.", details: parsed.error.flatten() });
      }
      // Check slug uniqueness
      const slugBase = parsed.data.slug || slugify(`${parsed.data.groomName}-${parsed.data.brideName}`);
      let slug = slugBase;
      let attempt = 0;
      while (true) {
        const existing = await storage.getInvitationBySlug(slug);
        if (!existing) break;
        attempt++;
        slug = `${slugBase}-${attempt}`;
      }
      const inv = await storage.createInvitation({ ...parsed.data, slug });
      res.json(inv);
    } catch (err) {
      res.status(500).json({ error: "Gagal membuat undangan." });
    }
  });

  // Delete invitation owned by customer
  app.delete("/api/my-invitations/:id", requireUser, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
      const inv = await storage.getInvitationById(id);
      if (!inv) return res.status(404).json({ error: "Undangan tidak ditemukan." });
      if (inv.userId !== userId) return res.status(403).json({ error: "Bukan milik Anda." });
      await storage.deleteInvitation(id);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Gagal menghapus undangan." });
    }
  });

  // Customer stats summary
  app.get("/api/my-stats", requireUser, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const invitations = await storage.getInvitationsByUser(userId);
      const realInvitations = invitations.filter(inv => !inv.slug.startsWith("demo-"));
      let rsvpCount = 0;
      let wishCount = 0;
      let guestCount = 0;
      await Promise.all(realInvitations.map(async (inv) => {
        const [rsvps, wishes, guests] = await Promise.all([
          storage.getRsvpsByInvitation(inv.id),
          storage.getWishesByInvitation(inv.id),
          storage.getGuestsByInvitation(inv.id),
        ]);
        rsvpCount += rsvps.length;
        wishCount += wishes.length;
        guestCount += guests.length;
      }));
      res.json({
        invitationCount: realInvitations.length,
        rsvpCount,
        wishCount,
        guestCount,
      });
    } catch {
      res.status(500).json({ error: "Gagal memuat statistik." });
    }
  });

  // Customer RSVP list — all RSVP from user's invitations
  app.get("/api/my-rsvp", requireUser, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const invitations = await storage.getInvitationsByUser(userId);
      const realInvitations = invitations.filter(inv => !inv.slug.startsWith("demo-"));
      const results = await Promise.all(
        realInvitations.map(async (inv) => {
          const rsvps = await storage.getRsvpsByInvitation(inv.id);
          return { invitation: inv, rsvps };
        })
      );
      res.json(results.filter(r => r.rsvps.length > 0));
    } catch {
      res.status(500).json({ error: "Gagal memuat data RSVP." });
    }
  });

  // Customer wishes list — all wishes from user's invitations
  app.get("/api/my-wishes", requireUser, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const invitations = await storage.getInvitationsByUser(userId);
      const realInvitations = invitations.filter(inv => !inv.slug.startsWith("demo-"));
      const results = await Promise.all(
        realInvitations.map(async (inv) => {
          const wishes = await storage.getWishesByInvitation(inv.id);
          return { invitation: inv, wishes };
        })
      );
      res.json(results.filter(r => r.wishes.length > 0));
    } catch {
      res.status(500).json({ error: "Gagal memuat ucapan tamu." });
    }
  });

  // Must come before /:slug to avoid "id" being treated as a slug
  app.get("/api/invitations/id/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
      const inv = await storage.getInvitationById(id);
      if (!inv) return res.status(404).json({ error: "Undangan tidak ditemukan." });
      const loveStory = await storage.getLoveStoryByInvitation(inv.id);
      res.json({ invitation: inv, loveStory });
    } catch {
      res.status(500).json({ error: "Gagal memuat undangan." });
    }
  });

  app.get("/api/invitations/:slug", async (req, res) => {
    try {
      const inv = await storage.getInvitationBySlug(req.params.slug);
      if (!inv) return res.status(404).json({ error: "Undangan tidak ditemukan." });
      const [loveStory, rsvp, guestbook] = await Promise.all([
        storage.getLoveStoryByInvitation(inv.id),
        storage.getRsvpsByInvitation(inv.id),
        storage.getWishesByInvitation(inv.id),
      ]);
      res.json({ invitation: inv, loveStory, rsvp, guestbook });
    } catch {
      res.status(500).json({ error: "Gagal memuat undangan." });
    }
  });

  // Converts empty-string date fields to null so PostgreSQL doesn't reject them
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function sanitizeDates(body: any): any {
    for (const key of ["akadDate", "receptionDate"]) {
      if (body[key] === "" || body[key] === undefined) body[key] = null;
    }
    return body;
  }

  app.post("/api/invitations", requireAdmin, async (req, res) => {
    try {
      const body = sanitizeDates({ ...req.body });
      if (!body.slug) {
        const base = slugify(`${body.groomName || ""} ${body.brideName || ""}`);
        let slug = base;
        let i = 1;
        while (await storage.slugExists(slug)) slug = `${base}-${i++}`;
        body.slug = slug;
      } else {
        body.slug = slugify(body.slug);
        if (await storage.slugExists(body.slug)) {
          return res.status(400).json({ error: "Slug sudah digunakan. Pilih nama yang berbeda." });
        }
      }

      const parsed = insertInvitationSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Data tidak valid.", details: parsed.error.flatten() });
      }

      const inv = await storage.createInvitation(parsed.data);

      if (Array.isArray(body.loveStory) && body.loveStory.length > 0) {
        await storage.replaceLoveStory(inv.id, body.loveStory);
      }

      const loveStory = await storage.getLoveStoryByInvitation(inv.id);
      res.status(201).json({ invitation: inv, loveStory });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Gagal membuat undangan." });
    }
  });

  app.patch("/api/invitations/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });

      const body = sanitizeDates({ ...req.body });
      if (body.slug) {
        body.slug = slugify(body.slug);
        // Ensure the slug isn't already taken by a DIFFERENT invitation
        const existing = await storage.getInvitationBySlug(body.slug);
        if (existing && existing.id !== id) {
          return res.status(400).json({ error: "Slug sudah digunakan. Pilih nama yang berbeda." });
        }
      }

      const parsed = updateInvitationSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Data tidak valid.", details: parsed.error.flatten() });
      }

      const inv = await storage.updateInvitation(id, parsed.data);
      if (!inv) return res.status(404).json({ error: "Undangan tidak ditemukan." });

      if (Array.isArray(body.loveStory)) {
        await storage.replaceLoveStory(inv.id, body.loveStory);
      }

      const loveStory = await storage.getLoveStoryByInvitation(inv.id);
      res.json({ invitation: inv, loveStory });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Gagal memperbarui undangan." });
    }
  });

  app.delete("/api/invitations/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
      const ok = await storage.deleteInvitation(id);
      if (!ok) return res.status(404).json({ error: "Undangan tidak ditemukan." });
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Gagal menghapus undangan." });
    }
  });

  // ── RSVP ──────────────────────────────────────────────────────────────────────

  app.get("/api/invitations/:id/rsvp", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
      const entries = await storage.getRsvpsByInvitation(id);
      res.json(entries);
    } catch {
      res.status(500).json({ error: "Gagal memuat data RSVP." });
    }
  });

  app.post("/api/invitations/:slug/rsvp", async (req, res) => {
    try {
      const inv = await storage.getInvitationBySlug(req.params.slug);
      if (!inv) return res.status(404).json({ error: "Undangan tidak ditemukan." });

      const parsed = insertRsvpSchema.safeParse({ ...req.body, invitationId: inv.id });
      if (!parsed.success) {
        return res.status(400).json({ error: "Data tidak lengkap.", details: parsed.error.flatten() });
      }

      const entry = await storage.createRsvp(parsed.data);
      res.status(201).json(entry);
    } catch {
      res.status(500).json({ error: "Gagal menyimpan RSVP." });
    }
  });

  // ── Public RSVP (canonical endpoint for /invite/:slug page) ──────────────────

  app.post("/api/public/invitations/:slug/rsvp", async (req, res) => {
    try {
      const inv = await storage.getInvitationBySlug(req.params.slug);
      if (!inv) return res.status(404).json({ error: "Undangan tidak ditemukan." });

      const { guest_name, attendance_status, guest_count, note } = req.body;

      const parsed = insertRsvpSchema.safeParse({
        invitationId:  inv.id,
        guestName:     guest_name     ?? req.body.guestName     ?? "",
        attendance:    attendance_status ?? req.body.attendance ?? "belum_pasti",
        guestCount:    guest_count    ?? req.body.guestCount    ?? 1,
        message:       note           ?? req.body.message       ?? "",
      });

      if (!parsed.success) {
        return res.status(400).json({ error: "Data tidak lengkap.", details: parsed.error.flatten() });
      }

      const entry = await storage.createRsvp(parsed.data);
      res.status(201).json(entry);
    } catch {
      res.status(500).json({ error: "Gagal menyimpan RSVP." });
    }
  });

  // ── Public Wishes (canonical endpoint for /invite/:slug page) ───────────────

  app.post("/api/public/invitations/:slug/wishes", async (req, res) => {
    try {
      const inv = await storage.getInvitationBySlug(req.params.slug);
      if (!inv) return res.status(404).json({ error: "Undangan tidak ditemukan." });

      const { guest_name, message } = req.body;

      const parsed = insertWishSchema.safeParse({
        invitationId: inv.id,
        guestName:    guest_name ?? req.body.guestName ?? "",
        message:      message    ?? "",
      });

      if (!parsed.success) {
        return res.status(400).json({ error: "Data tidak lengkap.", details: parsed.error.flatten() });
      }

      const entry = await storage.createWish(parsed.data);
      res.status(201).json(entry);
    } catch {
      res.status(500).json({ error: "Gagal menyimpan ucapan." });
    }
  });

  // ── Wishes (guestbook) ────────────────────────────────────────────────────────

  app.get("/api/invitations/:id/guestbook", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
      const entries = await storage.getWishesByInvitation(id);
      res.json(entries);
    } catch {
      res.status(500).json({ error: "Gagal memuat buku tamu." });
    }
  });

  app.post("/api/invitations/:slug/guestbook", async (req, res) => {
    try {
      const inv = await storage.getInvitationBySlug(req.params.slug);
      if (!inv) return res.status(404).json({ error: "Undangan tidak ditemukan." });

      const parsed = insertWishSchema.safeParse({ ...req.body, invitationId: inv.id });
      if (!parsed.success) {
        return res.status(400).json({ error: "Data tidak lengkap.", details: parsed.error.flatten() });
      }

      const entry = await storage.createWish(parsed.data);
      res.status(201).json(entry);
    } catch {
      res.status(500).json({ error: "Gagal menyimpan ucapan." });
    }
  });

  // ── Landing (public hero data) ────────────────────────────────────────────────

  const HERO_DEFAULTS = {
    hero_title:         "Undangan Pernikahan Digital yang Tak Terlupakan",
    hero_subtitle:      "Platform undangan pernikahan online terbaik di Indonesia. Elegan, personal, dan mudah dibagikan.",
    hero_cta_primary:   "Buat Undangan Sekarang",
    hero_cta_secondary: "Lihat Contoh",
    hero_cta_link:      "/admin/new",
  };

  app.get("/api/landing", async (_req, res) => {
    try {
      const settings = await storage.getAllLandingSettings();
      const map: Record<string, string> = {};
      for (const s of settings) map[s.key] = s.value;
      res.json({
        hero_title:         map.hero_title         || HERO_DEFAULTS.hero_title,
        hero_subtitle:      map.hero_subtitle      || HERO_DEFAULTS.hero_subtitle,
        hero_cta_primary:   map.hero_cta_primary   || HERO_DEFAULTS.hero_cta_primary,
        hero_cta_secondary: map.hero_cta_secondary || HERO_DEFAULTS.hero_cta_secondary,
        hero_cta_link:      map.hero_cta_link      || HERO_DEFAULTS.hero_cta_link,
      });
    } catch {
      res.json(HERO_DEFAULTS);
    }
  });

  // ── Admin landing hero CRUD ────────────────────────────────────────────────────

  const heroSettingSchema = z.object({
    hero_title:       z.string().min(1, "Judul wajib diisi"),
    hero_subtitle:    z.string().min(1, "Subjudul wajib diisi"),
    hero_cta_primary: z.string().min(1, "Teks tombol wajib diisi"),
    hero_cta_link:    z.string().min(1, "Link tombol wajib diisi"),
  });

  app.get("/api/admin/landing", requireAdmin, async (_req, res) => {
    try {
      const settings = await storage.getAllLandingSettings();
      const map: Record<string, string> = {};
      for (const s of settings) map[s.key] = s.value;
      res.json({
        hero_title:       map.hero_title       || HERO_DEFAULTS.hero_title,
        hero_subtitle:    map.hero_subtitle    || HERO_DEFAULTS.hero_subtitle,
        hero_cta_primary: map.hero_cta_primary || HERO_DEFAULTS.hero_cta_primary,
        hero_cta_link:    map.hero_cta_link    || HERO_DEFAULTS.hero_cta_link,
      });
    } catch {
      res.status(500).json({ error: "Gagal memuat pengaturan." });
    }
  });

  app.patch("/api/admin/landing", requireAdmin, async (req, res) => {
    const parsed = heroSettingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }
    const { hero_title, hero_subtitle, hero_cta_primary, hero_cta_link } = parsed.data;
    try {
      await storage.upsertManyLandingSettings([
        { key: "hero_title",       value: hero_title },
        { key: "hero_subtitle",    value: hero_subtitle },
        { key: "hero_cta_primary", value: hero_cta_primary },
        { key: "hero_cta_link",    value: hero_cta_link },
      ]);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Gagal menyimpan pengaturan." });
    }
  });

  // ── Landing settings ──────────────────────────────────────────────────────────

  app.get("/api/landing-settings", async (_req, res) => {
    try {
      const settings = await storage.getAllLandingSettings();
      // Return as a key→value map for easy frontend consumption
      const map: Record<string, string> = {};
      for (const s of settings) map[s.key] = s.value;
      res.json(map);
    } catch {
      res.status(500).json({ error: "Gagal memuat pengaturan landing page." });
    }
  });

  // ── Stats ─────────────────────────────────────────────────────────────────────

  app.get("/api/stats", requireAdmin, async (_req, res) => {
    try {
      const invitations = await storage.getAllInvitations();
      let totalRsvp = 0;
      let totalWishes = 0;
      await Promise.all(
        invitations.map(async (inv) => {
          const [r, w] = await Promise.all([
            storage.getRsvpsByInvitation(inv.id),
            storage.getWishesByInvitation(inv.id),
          ]);
          totalRsvp += r.length;
          totalWishes += w.length;
        }),
      );
      res.json({
        totalInvitations: invitations.length,
        totalRsvp,
        totalGuestbook: totalWishes,
        recentInvitations: invitations.slice(0, 5),
      });
    } catch {
      res.status(500).json({ error: "Gagal memuat statistik." });
    }
  });

  return httpServer;
}
