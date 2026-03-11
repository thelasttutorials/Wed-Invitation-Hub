import type { Express } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { requireAdmin } from "./auth";
import type { Template } from "@shared/schema";

const DEFAULT_SECTION_IDS = [
  "cover", "hero", "couple", "countdown", "event",
  "love_story", "gallery", "rsvp", "wishes", "gift", "maps", "closing",
];
const DEFAULT_SECTION_VISIBLE: Record<string, boolean> = {
  cover: true, hero: true, couple: true, countdown: true, event: true,
  love_story: true, gallery: true, rsvp: true, wishes: true,
  gift: false, maps: true, closing: true,
};

function defaultSectionsJson(): string {
  return JSON.stringify(
    DEFAULT_SECTION_IDS.map((id, i) => ({ id, visible: DEFAULT_SECTION_VISIBLE[id] ?? true, order: i }))
  );
}

const DEFAULT_TEMPLATES: Omit<Template, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Luxury Gold",
    slug: "luxury-gold",
    description: "Mewah, elegan, kesan premium dengan aksen emas",
    badge: "Premium",
    thumbnailUrl: "",
    themeSlug: "luxury-gold",
    sectionsConfig: defaultSectionsJson(),
    themeConfig: null,
    isPublished: true,
  },
  {
    name: "Romantic Floral",
    slug: "romantic-floral",
    description: "Romantis, feminin, nuansa dusty pink yang hangat",
    badge: "Populer",
    thumbnailUrl: "",
    themeSlug: "romantic-floral",
    sectionsConfig: defaultSectionsJson(),
    themeConfig: null,
    isPublished: true,
  },
  {
    name: "Minimal Modern",
    slug: "minimal-modern",
    description: "Bersih, modern, elegan dengan banyak whitespace",
    badge: "Baru",
    thumbnailUrl: "",
    themeSlug: "minimal-modern",
    sectionsConfig: defaultSectionsJson(),
    themeConfig: null,
    isPublished: true,
  },
  {
    name: "Classic Elegant",
    slug: "classic-elegant",
    description: "Formal, timeless, classy dengan nuansa navy & silver",
    badge: "",
    thumbnailUrl: "",
    themeSlug: "classic-elegant",
    sectionsConfig: defaultSectionsJson(),
    themeConfig: null,
    isPublished: true,
  },
];

export async function seedDefaultTemplates() {
  for (const tmpl of DEFAULT_TEMPLATES) {
    try {
      await storage.upsertTemplate(tmpl.slug, tmpl);
    } catch (e) {
      console.error(`[templates] Failed to seed template ${tmpl.slug}:`, e);
    }
  }
  console.log("[templates] Default templates seeded.");
}

export function registerAdminTemplateRoutes(app: Express) {
  app.get("/api/admin/templates", requireAdmin, async (_req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch {
      res.status(500).json({ error: "Gagal memuat template." });
    }
  });

  app.get("/api/admin/templates/:id", requireAdmin, async (req, res) => {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
    try {
      const tmpl = await storage.getTemplateById(id);
      if (!tmpl) return res.status(404).json({ error: "Template tidak ditemukan." });
      res.json(tmpl);
    } catch {
      res.status(500).json({ error: "Gagal memuat template." });
    }
  });

  const updateSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    badge: z.string().optional(),
    themeSlug: z.string().optional(),
    sectionsConfig: z.string().optional(),
    themeConfig: z.string().nullable().optional(),
    isPublished: z.boolean().optional(),
  });

  app.patch("/api/admin/templates/:id", requireAdmin, async (req, res) => {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    try {
      const updated = await storage.updateTemplate(id, parsed.data);
      if (!updated) return res.status(404).json({ error: "Template tidak ditemukan." });
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Gagal memperbarui template." });
    }
  });

  app.post("/api/admin/templates", requireAdmin, async (req, res) => {
    const schema = z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().default(""),
      badge: z.string().default(""),
      themeSlug: z.string().default("romantic-floral"),
      sectionsConfig: z.string().optional(),
      themeConfig: z.string().nullable().optional(),
      isPublished: z.boolean().default(true),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    try {
      const tmpl = await storage.createTemplate({ ...parsed.data, thumbnailUrl: "" });
      res.json(tmpl);
    } catch {
      res.status(500).json({ error: "Gagal membuat template." });
    }
  });

  app.delete("/api/admin/templates/:id", requireAdmin, async (req, res) => {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
    try {
      const ok = await storage.deleteTemplate(id);
      if (!ok) return res.status(404).json({ error: "Template tidak ditemukan." });
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Gagal menghapus template." });
    }
  });

  // Public endpoint — used by invite page
  app.get("/api/templates", async (_req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates.filter(t => t.isPublished));
    } catch {
      res.status(500).json({ error: "Gagal memuat template." });
    }
  });

  app.get("/api/templates/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const templates = await storage.getAllTemplates();
      const tmpl = templates.find(t => t.slug === slug);
      if (!tmpl) return res.status(404).json({ error: "Template tidak ditemukan." });
      res.json(tmpl);
    } catch {
      res.status(500).json({ error: "Gagal memuat template." });
    }
  });
}
