import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertInvitationSchema,
  updateInvitationSchema,
  insertRsvpSchema,
  insertGuestbookSchema,
} from "@shared/schema";
import { z } from "zod";

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

  // ── Invitations ──────────────────────────────────────────────────────────────

  app.get("/api/invitations", async (_req, res) => {
    try {
      const invitations = await storage.getAllInvitations();
      res.json(invitations);
    } catch (e) {
      res.status(500).json({ error: "Gagal memuat data undangan." });
    }
  });

  app.get("/api/invitations/:slug", async (req, res) => {
    try {
      const inv = await storage.getInvitationBySlug(req.params.slug);
      if (!inv) return res.status(404).json({ error: "Undangan tidak ditemukan." });
      const loveStory = await storage.getLoveStoryByInvitation(inv.id);
      const rsvp = await storage.getRsvpByInvitation(inv.id);
      const guestbook = await storage.getGuestbookByInvitation(inv.id);
      res.json({ invitation: inv, loveStory, rsvp, guestbook });
    } catch (e) {
      res.status(500).json({ error: "Gagal memuat undangan." });
    }
  });

  app.post("/api/invitations", async (req, res) => {
    try {
      const body = req.body;
      // Auto-generate slug if not provided
      if (!body.slug) {
        const base = slugify(`${body.groomName || ""} ${body.brideName || ""}`);
        let slug = base;
        let i = 1;
        while (await storage.slugExists(slug)) {
          slug = `${base}-${i++}`;
        }
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

      // Save love story items if provided
      if (Array.isArray(body.loveStory) && body.loveStory.length > 0) {
        await storage.replaceLoveStory(inv.id, body.loveStory);
      }

      const loveStory = await storage.getLoveStoryByInvitation(inv.id);
      res.status(201).json({ invitation: inv, loveStory });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Gagal membuat undangan." });
    }
  });

  app.patch("/api/invitations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });

      const body = req.body;
      if (body.slug) body.slug = slugify(body.slug);

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
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Gagal memperbarui undangan." });
    }
  });

  app.delete("/api/invitations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
      const ok = await storage.deleteInvitation(id);
      if (!ok) return res.status(404).json({ error: "Undangan tidak ditemukan." });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Gagal menghapus undangan." });
    }
  });

  // ── RSVP ─────────────────────────────────────────────────────────────────────

  app.get("/api/invitations/:id/rsvp", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
      const entries = await storage.getRsvpByInvitation(id);
      res.json(entries);
    } catch (e) {
      res.status(500).json({ error: "Gagal memuat data RSVP." });
    }
  });

  app.post("/api/invitations/:slug/rsvp", async (req, res) => {
    try {
      const inv = await storage.getInvitationBySlug(req.params.slug);
      if (!inv) return res.status(404).json({ error: "Undangan tidak ditemukan." });

      const data = { ...req.body, invitationId: inv.id };
      const parsed = insertRsvpSchema.safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({ error: "Data tidak lengkap.", details: parsed.error.flatten() });
      }

      const entry = await storage.createRsvp(parsed.data);
      res.status(201).json(entry);
    } catch (e) {
      res.status(500).json({ error: "Gagal menyimpan RSVP." });
    }
  });

  // ── Guestbook ─────────────────────────────────────────────────────────────────

  app.get("/api/invitations/:id/guestbook", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
      const entries = await storage.getGuestbookByInvitation(id);
      res.json(entries);
    } catch (e) {
      res.status(500).json({ error: "Gagal memuat buku tamu." });
    }
  });

  app.post("/api/invitations/:slug/guestbook", async (req, res) => {
    try {
      const inv = await storage.getInvitationBySlug(req.params.slug);
      if (!inv) return res.status(404).json({ error: "Undangan tidak ditemukan." });

      const data = { ...req.body, invitationId: inv.id };
      const parsed = insertGuestbookSchema.safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({ error: "Data tidak lengkap.", details: parsed.error.flatten() });
      }

      const entry = await storage.createGuestbookEntry(parsed.data);
      res.status(201).json(entry);
    } catch (e) {
      res.status(500).json({ error: "Gagal menyimpan ucapan." });
    }
  });

  // ── Stats ─────────────────────────────────────────────────────────────────────

  app.get("/api/stats", async (_req, res) => {
    try {
      const invitations = await storage.getAllInvitations();
      let totalRsvp = 0;
      let totalGuestbook = 0;
      for (const inv of invitations) {
        const rsvp = await storage.getRsvpByInvitation(inv.id);
        const gb = await storage.getGuestbookByInvitation(inv.id);
        totalRsvp += rsvp.length;
        totalGuestbook += gb.length;
      }
      res.json({
        totalInvitations: invitations.length,
        totalRsvp,
        totalGuestbook,
        recentInvitations: invitations.slice(0, 5),
      });
    } catch (e) {
      res.status(500).json({ error: "Gagal memuat statistik." });
    }
  });

  return httpServer;
}
