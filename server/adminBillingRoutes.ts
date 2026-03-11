import type { Express } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { requireAdmin } from "./auth";
import { sendPaymentApprovedEmail, sendPaymentRejectedEmail } from "./emailService";

export function registerAdminBillingRoutes(app: Express) {
  app.get("/api/admin/pricing", requireAdmin, async (_req, res) => {
    try {
      const plans = await storage.getAllPricingPlans();
      res.json(plans);
    } catch {
      res.status(500).json({ error: "Gagal memuat paket." });
    }
  });

  const updatePlanSchema = z.object({
    price: z.number().int().min(0).optional(),
    description: z.string().optional(),
    maxInvitations: z.number().int().min(1).optional(),
    maxGalleryPhotos: z.number().int().min(1).optional(),
    allowMusic: z.boolean().optional(),
    allowLoveStory: z.boolean().optional(),
    allowGift: z.boolean().optional(),
    allowPremiumTemplates: z.boolean().optional(),
    allowCustomDomain: z.boolean().optional(),
  });

  app.patch("/api/admin/pricing/:id", requireAdmin, async (req, res) => {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
    const parsed = updatePlanSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    try {
      const updated = await storage.updatePricingPlan(id, parsed.data);
      if (!updated) return res.status(404).json({ error: "Paket tidak ditemukan." });
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Gagal update paket." });
    }
  });

  app.get("/api/admin/orders", requireAdmin, async (_req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch {
      res.status(500).json({ error: "Gagal memuat order." });
    }
  });

  app.get("/api/admin/orders/:id", requireAdmin, async (req, res) => {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
    try {
      const order = await storage.getOrderById(id);
      if (!order) return res.status(404).json({ error: "Order tidak ditemukan." });
      const user = await storage.getUserById(order.userId);
      const plan = await storage.getPricingPlanById(order.planId);
      const confirmation = await storage.getConfirmationByOrder(id);
      res.json({ ...order, user, plan, confirmation });
    } catch {
      res.status(500).json({ error: "Gagal memuat order." });
    }
  });

  app.patch("/api/admin/orders/:id/approve", requireAdmin, async (req, res) => {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
    try {
      const order = await storage.getOrderById(id);
      if (!order) return res.status(404).json({ error: "Order tidak ditemukan." });
      if (order.paymentStatus === "paid") return res.status(400).json({ error: "Order ini sudah di-approve sebelumnya." });
      if (order.paymentStatus === "rejected") return res.status(400).json({ error: "Order sudah ditolak, tidak bisa di-approve." });

      await storage.updateOrder(id, { 
        paymentStatus: "paid", 
        orderStatus: "completed",
        adminNote: req.body.adminNote || order.adminNote
      });
      await storage.deactivateUserSubscriptions(order.userId);
      await storage.createSubscription(order.userId, order.planId, "active");

      // Kirim email notifikasi
      const user = await storage.getUserById(order.userId);
      if (user) {
        await sendPaymentApprovedEmail(user.email, order.orderNumber);
      }

      res.json({ ok: true, message: "Pembayaran berhasil di-approve. Langganan user telah diaktifkan." });
    } catch {
      res.status(500).json({ error: "Gagal approve order." });
    }
  });

  app.patch("/api/admin/orders/:id/reject", requireAdmin, async (req, res) => {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
    try {
      const order = await storage.getOrderById(id);
      if (!order) return res.status(404).json({ error: "Order tidak ditemukan." });
      if (order.paymentStatus === "paid") return res.status(400).json({ error: "Order sudah lunas, tidak bisa ditolak." });

      const adminNote = req.body.adminNote || "";
      await storage.updateOrder(id, { 
        paymentStatus: "rejected",
        adminNote: adminNote
      });

      // Kirim email notifikasi
      const user = await storage.getUserById(order.userId);
      if (user) {
        await sendPaymentRejectedEmail(user.email, order.orderNumber, adminNote);
      }

      res.json({ ok: true, message: "Pembayaran telah ditolak." });
    } catch {
      res.status(500).json({ error: "Gagal reject order." });
    }
  });

  app.patch("/api/admin/orders/:id/review", requireAdmin, async (req, res) => {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
    try {
      const updated = await storage.updateOrder(id, { orderStatus: "reviewing", adminNote: req.body.adminNote });
      if (!updated) return res.status(404).json({ error: "Order tidak ditemukan." });
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Gagal review order." });
    }
  });

  app.patch("/api/admin/orders/:id/complete", requireAdmin, async (req, res) => {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
    try {
      const updated = await storage.updateOrder(id, { orderStatus: "completed", adminNote: req.body.adminNote });
      if (!updated) return res.status(404).json({ error: "Order tidak ditemukan." });
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Gagal complete order." });
    }
  });

  const bankSettingsSchema = z.object({
    bankName: z.string().min(1),
    accountNumber: z.string().min(1),
    accountHolder: z.string().min(1),
    paymentNote: z.string().default(""),
  });

  app.get("/api/admin/bank-settings", requireAdmin, async (_req, res) => {
    try {
      const bank = await storage.getBankSettings();
      res.json(bank ?? null);
    } catch {
      res.status(500).json({ error: "Gagal memuat pengaturan bank." });
    }
  });

  app.patch("/api/admin/bank-settings", requireAdmin, async (req, res) => {
    const parsed = bankSettingsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    try {
      const bank = await storage.upsertBankSettings(parsed.data);
      res.json(bank);
    } catch {
      res.status(500).json({ error: "Gagal update pengaturan bank." });
    }
  });
}
