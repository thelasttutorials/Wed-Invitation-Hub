import type { Express } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { requireUser } from "./userAuth";
import { getUserActivePlan, generateOrderNumber } from "./planHelpers";

export function registerBillingRoutes(app: Express) {
  app.get("/api/pricing", async (_req, res) => {
    try {
      const plans = await storage.getAllPricingPlans();
      res.json(plans);
    } catch {
      res.status(500).json({ error: "Gagal memuat paket." });
    }
  });

  app.get("/api/subscription/me", requireUser, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const sub = await storage.getActiveSubscription(userId);
      const plan = await getUserActivePlan(userId);
      res.json({ subscription: sub ?? null, plan });
    } catch {
      res.status(500).json({ error: "Gagal memuat data langganan." });
    }
  });

  app.post("/api/subscriptions/start-free", requireUser, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const existing = await storage.getActiveSubscription(userId);
      if (existing) {
        return res.json({ ok: true, subscription: existing, message: "Sudah memiliki paket aktif." });
      }
      const freePlan = await storage.getPricingPlanBySlug("gratis");
      if (!freePlan) return res.status(500).json({ error: "Paket gratis tidak ditemukan." });
      await storage.deactivateUserSubscriptions(userId);
      const sub = await storage.createSubscription(userId, freePlan.id, "active");
      return res.json({ ok: true, subscription: sub });
    } catch {
      res.status(500).json({ error: "Gagal mengaktifkan paket gratis." });
    }
  });

  const createOrderSchema = z.object({
    planId: z.number().int().positive(),
  });

  app.post("/api/orders", requireUser, async (req, res) => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "planId diperlukan." });
    try {
      const userId = req.session.userId!;
      const { planId } = parsed.data;
      const plan = await storage.getPricingPlanById(planId);
      if (!plan || !plan.isActive) return res.status(404).json({ error: "Paket tidak ditemukan." });
      if (plan.slug === "gratis") return res.status(400).json({ error: "Gunakan endpoint start-free untuk paket gratis." });

      const pending = await storage.getPendingOrderByUser(userId);
      if (pending) {
        const pendingPlan = await storage.getPricingPlanById(pending.planId);
        return res.json({ ok: true, order: pending, plan: pendingPlan, alreadyPending: true });
      }

      const orderNumber = generateOrderNumber();
      const order = await storage.createOrder({ userId, planId, orderNumber, amount: plan.price });
      const bank = await storage.getBankSettings();
      return res.json({ ok: true, order, plan, bank });
    } catch {
      res.status(500).json({ error: "Gagal membuat order." });
    }
  });

  app.get("/api/orders/me", requireUser, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const orders = await storage.getOrdersByUser(userId);
      const result = await Promise.all(orders.map(async (o) => {
        const plan = await storage.getPricingPlanById(o.planId);
        const confirmation = await storage.getConfirmationByOrder(o.id);
        return { ...o, plan, confirmation };
      }));
      res.json(result);
    } catch {
      res.status(500).json({ error: "Gagal memuat riwayat order." });
    }
  });

  const uploadProofSchema = z.object({
    senderName: z.string().min(1),
    senderBank: z.string().min(1),
    transferDate: z.string().min(1),
    transferAmount: z.number().int().positive(),
    proofImageUrl: z.string().min(1),
    note: z.string().default(""),
  });

  app.post("/api/orders/:id/upload-proof", requireUser, async (req, res) => {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) return res.status(400).json({ error: "ID order tidak valid." });

    const parsed = uploadProofSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

    try {
      const userId = req.session.userId!;
      const order = await storage.getOrderById(orderId);
      if (!order) return res.status(404).json({ error: "Order tidak ditemukan." });
      if (order.userId !== userId) return res.status(403).json({ error: "Bukan order Anda." });
      if (order.paymentStatus === "paid") return res.status(400).json({ error: "Order ini sudah lunas." });
      if (order.paymentStatus === "rejected") return res.status(400).json({ error: "Order ini sudah ditolak. Buat order baru." });

      const existing = await storage.getConfirmationByOrder(orderId);
      if (existing) return res.status(400).json({ error: "Bukti transfer sudah diupload. Tunggu konfirmasi admin." });

      const confirmation = await storage.createPaymentConfirmation(parsed.data);
      await storage.updateOrderStatus(orderId, "waiting_confirmation");
      res.json({ ok: true, confirmation });
    } catch {
      res.status(500).json({ error: "Gagal upload bukti transfer." });
    }
  });

  app.get("/api/bank-settings", async (_req, res) => {
    try {
      const bank = await storage.getBankSettings();
      res.json(bank ?? null);
    } catch {
      res.status(500).json({ error: "Gagal memuat info bank." });
    }
  });
}
