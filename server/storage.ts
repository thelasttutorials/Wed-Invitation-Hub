import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc, asc, and, gt } from "drizzle-orm";
import * as schema from "@shared/schema";
import type {
  Admin,
  InsertAdmin,
  LandingSetting,
  InsertLandingSetting,
  Invitation,
  InsertInvitation,
  LoveStoryItem,
  InsertLoveStoryItem,
  Rsvp,
  InsertRsvp,
  Wish,
  InsertWish,
  User,
  EmailVerification,
  PricingPlan,
  UserSubscription,
  Order,
  PaymentConfirmation,
  BankSetting,
  Template,
  InsertTemplate,
  Guest,
  InsertGuest,
  ContactMessage,
  InsertContactMessage,
} from "@shared/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// ─────────────────────────────────────────────────────────────
// Storage interface
// ─────────────────────────────────────────────────────────────
export interface IStorage {
  // Admins
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  getAdminById(id: number): Promise<Admin | undefined>;
  createAdmin(data: InsertAdmin): Promise<Admin>;

  // Landing settings
  getAllLandingSettings(): Promise<LandingSetting[]>;
  getLandingSetting(key: string): Promise<LandingSetting | undefined>;
  upsertLandingSetting(key: string, value: string): Promise<LandingSetting>;
  upsertManyLandingSettings(entries: { key: string; value: string }[]): Promise<LandingSetting[]>;

  // Invitations
  getAllInvitations(): Promise<Invitation[]>;
  getInvitationBySlug(slug: string): Promise<Invitation | undefined>;
  getInvitationById(id: number): Promise<Invitation | undefined>;
  createInvitation(data: InsertInvitation): Promise<Invitation>;
  updateInvitation(id: number, data: Partial<InsertInvitation>): Promise<Invitation | undefined>;
  deleteInvitation(id: number): Promise<boolean>;
  slugExists(slug: string): Promise<boolean>;

  // Love story
  getLoveStoryByInvitation(invitationId: number): Promise<LoveStoryItem[]>;
  createLoveStoryItem(data: InsertLoveStoryItem): Promise<LoveStoryItem>;
  updateLoveStoryItem(id: number, data: Partial<InsertLoveStoryItem>): Promise<LoveStoryItem | undefined>;
  deleteLoveStoryItem(id: number): Promise<boolean>;
  replaceLoveStory(invitationId: number, items: Omit<InsertLoveStoryItem, "invitationId">[]): Promise<LoveStoryItem[]>;

  // RSVPs
  getRsvpsByInvitation(invitationId: number): Promise<Rsvp[]>;
  createRsvp(data: InsertRsvp): Promise<Rsvp>;

  // Wishes
  getWishesByInvitation(invitationId: number): Promise<Wish[]>;
  createWish(data: InsertWish): Promise<Wish>;
  deleteWish(id: number): Promise<boolean>;

  // Users (customer accounts)
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(email: string): Promise<User>;
  verifyUser(id: number): Promise<void>;

  // Email verifications (OTP)
  createVerification(email: string, code: string, expiresAt: Date): Promise<EmailVerification>;
  findValidVerification(email: string, code: string): Promise<EmailVerification | undefined>;
  markVerificationUsed(id: number): Promise<void>;
  countRecentVerifications(email: string, since: Date): Promise<number>;

  // Pricing plans
  getAllPricingPlans(): Promise<PricingPlan[]>;
  getPricingPlanById(id: number): Promise<PricingPlan | undefined>;
  getPricingPlanBySlug(slug: string): Promise<PricingPlan | undefined>;
  updatePricingPlan(id: number, data: Partial<PricingPlan>): Promise<PricingPlan | undefined>;
  upsertPricingPlan(slug: string, data: Omit<PricingPlan, "id" | "createdAt" | "updatedAt">): Promise<PricingPlan>;

  // Subscriptions
  getActiveSubscription(userId: number): Promise<(UserSubscription & { plan: PricingPlan }) | undefined>;
  createSubscription(userId: number, planId: number, status?: string): Promise<UserSubscription>;
  deactivateUserSubscriptions(userId: number): Promise<void>;
  activateSubscription(subscriptionId: number): Promise<void>;

  // Orders
  createOrder(data: { userId: number; planId: number; orderNumber: string; amount: number }): Promise<Order>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getAllOrders(): Promise<(Order & { user: User; plan: PricingPlan; confirmation?: PaymentConfirmation })[]>;
  updateOrderStatus(id: number, status: string): Promise<void>;
  updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined>;
  getPendingOrderByUser(userId: number): Promise<Order | undefined>;

  // Payment confirmations
  createPaymentConfirmation(data: {
    orderId: number;
    senderName: string;
    senderBank: string;
    transferDate: string;
    transferAmount: number;
    proofImageUrl: string;
    note: string;
  }): Promise<PaymentConfirmation>;
  getConfirmationByOrder(orderId: number): Promise<PaymentConfirmation | undefined>;

  // Bank settings
  getBankSettings(): Promise<BankSetting | undefined>;
  upsertBankSettings(data: { bankName: string; accountNumber: string; accountHolder: string; paymentNote: string }): Promise<BankSetting>;

  // Templates
  getAllTemplates(): Promise<Template[]>;
  getTemplateById(id: number): Promise<Template | undefined>;
  getTemplateBySlug(slug: string): Promise<Template | undefined>;
  createTemplate(data: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, data: Partial<InsertTemplate>): Promise<Template | undefined>;
  deleteTemplate(id: number): Promise<boolean>;
  upsertTemplate(slug: string, data: Omit<Template, "id" | "createdAt" | "updatedAt">): Promise<Template>;

  // Contact messages
  createContactMessage(data: schema.InsertContactMessage): Promise<schema.ContactMessage>;
  getAllContactMessages(): Promise<schema.ContactMessage[]>;

  // Guests
  getGuestsByInvitation(invitationId: number): Promise<Guest[]>;
  getGuestById(id: number): Promise<Guest | undefined>;
  getGuestByCode(guestCode: string): Promise<Guest | undefined>;
  createGuest(data: InsertGuest): Promise<Guest>;
  updateGuest(id: number, data: Partial<InsertGuest>): Promise<Guest | undefined>;
  deleteGuest(id: number): Promise<boolean>;
  bulkCreateGuests(data: InsertGuest[]): Promise<Guest[]>;
  checkinGuest(id: number): Promise<Guest | undefined>;

  // Invitations (Updated)
  getInvitationsByUser(userId: number): Promise<Invitation[]>;
}

// ─────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────
class DatabaseStorage implements IStorage {

  // ── Admins ─────────────────────────────────────────────────

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const result = await db.select().from(schema.admins).where(eq(schema.admins.email, email));
    return result[0];
  }

  async getAdminById(id: number): Promise<Admin | undefined> {
    const result = await db.select().from(schema.admins).where(eq(schema.admins.id, id));
    return result[0];
  }

  async createAdmin(data: InsertAdmin): Promise<Admin> {
    const result = await db.insert(schema.admins).values(data).returning();
    return result[0];
  }

  // ── Landing settings ────────────────────────────────────────

  async getAllLandingSettings(): Promise<LandingSetting[]> {
    return db.select().from(schema.landingSettings).orderBy(asc(schema.landingSettings.key));
  }

  async getLandingSetting(key: string): Promise<LandingSetting | undefined> {
    const result = await db.select().from(schema.landingSettings).where(eq(schema.landingSettings.key, key));
    return result[0];
  }

  async upsertLandingSetting(key: string, value: string): Promise<LandingSetting> {
    const result = await db
      .insert(schema.landingSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: schema.landingSettings.key,
        set: { value, updatedAt: new Date() },
      })
      .returning();
    return result[0];
  }

  async upsertManyLandingSettings(entries: { key: string; value: string }[]): Promise<LandingSetting[]> {
    if (entries.length === 0) return [];
    const results: LandingSetting[] = [];
    for (const entry of entries) {
      results.push(await this.upsertLandingSetting(entry.key, entry.value));
    }
    return results;
  }

  // ── Invitations ─────────────────────────────────────────────

  async getAllInvitations(): Promise<Invitation[]> {
    return db.select().from(schema.invitations).orderBy(desc(schema.invitations.createdAt));
  }

  async getInvitationBySlug(slug: string): Promise<Invitation | undefined> {
    const result = await db.select().from(schema.invitations).where(eq(schema.invitations.slug, slug));
    return result[0];
  }

  async getInvitationById(id: number): Promise<Invitation | undefined> {
    const result = await db.select().from(schema.invitations).where(eq(schema.invitations.id, id));
    return result[0];
  }

  async createInvitation(data: InsertInvitation): Promise<Invitation> {
    const result = await db.insert(schema.invitations).values(data).returning();
    return result[0];
  }

  async updateInvitation(id: number, data: Partial<InsertInvitation>): Promise<Invitation | undefined> {
    const result = await db
      .update(schema.invitations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.invitations.id, id))
      .returning();
    return result[0];
  }

  async deleteInvitation(id: number): Promise<boolean> {
    const result = await db.delete(schema.invitations).where(eq(schema.invitations.id, id)).returning();
    return result.length > 0;
  }

  async slugExists(slug: string): Promise<boolean> {
    const result = await db
      .select({ id: schema.invitations.id })
      .from(schema.invitations)
      .where(eq(schema.invitations.slug, slug));
    return result.length > 0;
  }

  // ── Love story ──────────────────────────────────────────────

  async getLoveStoryByInvitation(invitationId: number): Promise<LoveStoryItem[]> {
    return db.select().from(schema.loveStoryItems)
      .where(eq(schema.loveStoryItems.invitationId, invitationId))
      .orderBy(asc(schema.loveStoryItems.sortOrder));
  }

  async createLoveStoryItem(data: InsertLoveStoryItem): Promise<LoveStoryItem> {
    const result = await db.insert(schema.loveStoryItems).values(data).returning();
    return result[0];
  }

  async updateLoveStoryItem(id: number, data: Partial<InsertLoveStoryItem>): Promise<LoveStoryItem | undefined> {
    const result = await db.update(schema.loveStoryItems).set(data).where(eq(schema.loveStoryItems.id, id)).returning();
    return result[0];
  }

  async deleteLoveStoryItem(id: number): Promise<boolean> {
    const result = await db.delete(schema.loveStoryItems).where(eq(schema.loveStoryItems.id, id)).returning();
    return result.length > 0;
  }

  async replaceLoveStory(invitationId: number, items: Omit<InsertLoveStoryItem, "invitationId">[]): Promise<LoveStoryItem[]> {
    await db.delete(schema.loveStoryItems).where(eq(schema.loveStoryItems.invitationId, invitationId));
    if (items.length === 0) return [];
    const toInsert = items.map((item, i) => ({ ...item, invitationId, sortOrder: i }));
    return db.insert(schema.loveStoryItems).values(toInsert).returning();
  }

  // ── RSVPs ───────────────────────────────────────────────────

  async getRsvpsByInvitation(invitationId: number): Promise<Rsvp[]> {
    return db.select().from(schema.rsvps)
      .where(eq(schema.rsvps.invitationId, invitationId))
      .orderBy(desc(schema.rsvps.createdAt));
  }

  async createRsvp(data: InsertRsvp): Promise<Rsvp> {
    const result = await db.insert(schema.rsvps).values(data).returning();
    return result[0];
  }

  // ── Wishes ──────────────────────────────────────────────────

  async getWishesByInvitation(invitationId: number): Promise<Wish[]> {
    return db.select().from(schema.wishes)
      .where(eq(schema.wishes.invitationId, invitationId))
      .orderBy(desc(schema.wishes.createdAt));
  }

  async createWish(data: InsertWish): Promise<Wish> {
    const result = await db.insert(schema.wishes).values(data).returning();
    return result[0];
  }

  async deleteWish(id: number): Promise<boolean> {
    const result = await db.delete(schema.wishes).where(eq(schema.wishes.id, id)).returning();
    return result.length > 0;
  }

  // ── Users ────────────────────────────────────────────────────

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return result[0];
  }

  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async createUser(email: string): Promise<User> {
    const result = await db.insert(schema.users).values({ email, isVerified: true }).returning();
    return result[0];
  }

  async verifyUser(id: number): Promise<void> {
    await db.update(schema.users).set({ isVerified: true }).where(eq(schema.users.id, id));
  }

  // ── Email verifications ──────────────────────────────────────

  async createVerification(email: string, code: string, expiresAt: Date): Promise<EmailVerification> {
    const result = await db
      .insert(schema.emailVerifications)
      .values({ email, code, expiresAt })
      .returning();
    return result[0];
  }

  async findValidVerification(email: string, code: string): Promise<EmailVerification | undefined> {
    const result = await db
      .select()
      .from(schema.emailVerifications)
      .where(
        and(
          eq(schema.emailVerifications.email, email),
          eq(schema.emailVerifications.code, code),
          gt(schema.emailVerifications.expiresAt, new Date()),
        ),
      );
    return result.find((r) => r.usedAt === null);
  }

  async markVerificationUsed(id: number): Promise<void> {
    await db
      .update(schema.emailVerifications)
      .set({ usedAt: new Date() })
      .where(eq(schema.emailVerifications.id, id));
  }

  async countRecentVerifications(email: string, since: Date): Promise<number> {
    const result = await db
      .select()
      .from(schema.emailVerifications)
      .where(
        and(
          eq(schema.emailVerifications.email, email),
          gt(schema.emailVerifications.createdAt, since),
        ),
      );
    return result.length;
  }

  // ── Pricing plans ────────────────────────────────────────────

  async getAllPricingPlans(): Promise<PricingPlan[]> {
    return db.select().from(schema.pricingPlans).where(eq(schema.pricingPlans.isActive, true)).orderBy(asc(schema.pricingPlans.price));
  }

  async getPricingPlanById(id: number): Promise<PricingPlan | undefined> {
    const result = await db.select().from(schema.pricingPlans).where(eq(schema.pricingPlans.id, id));
    return result[0];
  }

  async getPricingPlanBySlug(slug: string): Promise<PricingPlan | undefined> {
    const result = await db.select().from(schema.pricingPlans).where(eq(schema.pricingPlans.slug, slug));
    return result[0];
  }

  async updatePricingPlan(id: number, data: Partial<PricingPlan>): Promise<PricingPlan | undefined> {
    const result = await db.update(schema.pricingPlans).set({ ...data, updatedAt: new Date() }).where(eq(schema.pricingPlans.id, id)).returning();
    return result[0];
  }

  async upsertPricingPlan(slug: string, data: Omit<PricingPlan, "id" | "createdAt" | "updatedAt">): Promise<PricingPlan> {
    const result = await db.insert(schema.pricingPlans)
      .values({ ...data, slug })
      .onConflictDoUpdate({ target: schema.pricingPlans.slug, set: { ...data, updatedAt: new Date() } })
      .returning();
    return result[0];
  }

  // ── Subscriptions ────────────────────────────────────────────

  async getActiveSubscription(userId: number): Promise<(UserSubscription & { plan: PricingPlan }) | undefined> {
    const result = await db
      .select({ sub: schema.userSubscriptions, plan: schema.pricingPlans })
      .from(schema.userSubscriptions)
      .innerJoin(schema.pricingPlans, eq(schema.userSubscriptions.planId, schema.pricingPlans.id))
      .where(and(eq(schema.userSubscriptions.userId, userId), eq(schema.userSubscriptions.status, "active")))
      .orderBy(desc(schema.userSubscriptions.createdAt));
    if (!result[0]) return undefined;
    return { ...result[0].sub, plan: result[0].plan };
  }

  async createSubscription(userId: number, planId: number, status = "active"): Promise<UserSubscription> {
    const result = await db.insert(schema.userSubscriptions).values({ userId, planId, status }).returning();
    return result[0];
  }

  async deactivateUserSubscriptions(userId: number): Promise<void> {
    await db.update(schema.userSubscriptions).set({ status: "cancelled", updatedAt: new Date() }).where(eq(schema.userSubscriptions.userId, userId));
  }

  async activateSubscription(subscriptionId: number): Promise<void> {
    await db.update(schema.userSubscriptions).set({ status: "active", startedAt: new Date(), updatedAt: new Date() }).where(eq(schema.userSubscriptions.id, subscriptionId));
  }

  // ── Orders ───────────────────────────────────────────────────

  async createOrder(data: { userId: number; planId: number; orderNumber: string; amount: number }): Promise<Order> {
    const result = await db.insert(schema.orders).values({ ...data, paymentMethod: "bank_transfer", paymentStatus: "pending" }).returning();
    return result[0];
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const result = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    return result[0];
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return db.select().from(schema.orders).where(eq(schema.orders.userId, userId)).orderBy(desc(schema.orders.createdAt));
  }

  async getAllOrders(): Promise<(Order & { user: User; plan: PricingPlan; confirmation?: PaymentConfirmation })[]> {
    const rows = await db
      .select({ order: schema.orders, user: schema.users, plan: schema.pricingPlans })
      .from(schema.orders)
      .innerJoin(schema.users, eq(schema.orders.userId, schema.users.id))
      .innerJoin(schema.pricingPlans, eq(schema.orders.planId, schema.pricingPlans.id))
      .orderBy(desc(schema.orders.createdAt));

    const results = await Promise.all(rows.map(async (row) => {
      const confirmation = await this.getConfirmationByOrder(row.order.id);
      return { ...row.order, user: row.user, plan: row.plan, confirmation };
    }));
    return results;
  }

  async updateOrderStatus(id: number, status: string): Promise<void> {
    await db.update(schema.orders).set({ paymentStatus: status, updatedAt: new Date() }).where(eq(schema.orders.id, id));
  }

  async updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined> {
    const result = await db.update(schema.orders).set({ ...data, updatedAt: new Date() }).where(eq(schema.orders.id, id)).returning();
    return result[0];
  }

  async getPendingOrderByUser(userId: number): Promise<Order | undefined> {
    const result = await db.select().from(schema.orders)
      .where(and(eq(schema.orders.userId, userId), eq(schema.orders.paymentStatus, "pending")))
      .orderBy(desc(schema.orders.createdAt));
    return result[0];
  }

  // ── Payment confirmations ────────────────────────────────────

  async createPaymentConfirmation(data: {
    orderId: number; senderName: string; senderBank: string; transferDate: string;
    transferAmount: number; proofImageUrl: string; note: string;
  }): Promise<PaymentConfirmation> {
    const result = await db.insert(schema.paymentConfirmations).values(data).returning();
    return result[0];
  }

  async getConfirmationByOrder(orderId: number): Promise<PaymentConfirmation | undefined> {
    const result = await db.select().from(schema.paymentConfirmations).where(eq(schema.paymentConfirmations.orderId, orderId));
    return result[0];
  }

  // ── Bank settings ────────────────────────────────────────────

  async getBankSettings(): Promise<BankSetting | undefined> {
    const result = await db.select().from(schema.bankSettings).orderBy(desc(schema.bankSettings.id));
    return result[0];
  }

  async upsertBankSettings(data: { bankName: string; accountNumber: string; accountHolder: string; paymentNote: string }): Promise<BankSetting> {
    const existing = await this.getBankSettings();
    if (existing) {
      const result = await db.update(schema.bankSettings).set({ ...data, updatedAt: new Date() }).where(eq(schema.bankSettings.id, existing.id)).returning();
      return result[0];
    }
    const result = await db.insert(schema.bankSettings).values(data).returning();
    return result[0];
  }

  // ── Templates ────────────────────────────────────────────────

  async getAllTemplates(): Promise<Template[]> {
    return db.select().from(schema.templates).orderBy(asc(schema.templates.id));
  }

  async getTemplateById(id: number): Promise<Template | undefined> {
    const result = await db.select().from(schema.templates).where(eq(schema.templates.id, id));
    return result[0];
  }

  async getTemplateBySlug(slug: string): Promise<Template | undefined> {
    const result = await db.select().from(schema.templates).where(eq(schema.templates.slug, slug));
    return result[0];
  }

  async createTemplate(data: InsertTemplate): Promise<Template> {
    const result = await db.insert(schema.templates).values(data).returning();
    return result[0];
  }

  async updateTemplate(id: number, data: Partial<InsertTemplate>): Promise<Template | undefined> {
    const result = await db.update(schema.templates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.templates.id, id))
      .returning();
    return result[0];
  }

  async deleteTemplate(id: number): Promise<boolean> {
    const result = await db.delete(schema.templates).where(eq(schema.templates.id, id)).returning();
    return result.length > 0;
  }

  async upsertTemplate(slug: string, data: Omit<Template, "id" | "createdAt" | "updatedAt">): Promise<Template> {
    const existing = await this.getTemplateBySlug(slug);
    if (existing) {
      const result = await db.update(schema.templates)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.templates.slug, slug))
        .returning();
      return result[0];
    }
    const result = await db.insert(schema.templates).values(data).returning();
    return result[0];
  }

  // ── Contact messages ─────────────────────────────────────────

  async createContactMessage(data: schema.InsertContactMessage): Promise<schema.ContactMessage> {
    const result = await db.insert(schema.contactMessages).values(data).returning();
    return result[0];
  }

  async getAllContactMessages(): Promise<schema.ContactMessage[]> {
    return db.select().from(schema.contactMessages).orderBy(desc(schema.contactMessages.createdAt));
  }

  // ── Guests ───────────────────────────────────────────────────

  async getGuestsByInvitation(invitationId: number): Promise<Guest[]> {
    return db.select().from(schema.guests)
      .where(eq(schema.guests.invitationId, invitationId))
      .orderBy(asc(schema.guests.name));
  }

  async getGuestById(id: number): Promise<Guest | undefined> {
    const result = await db.select().from(schema.guests).where(eq(schema.guests.id, id));
    return result[0];
  }

  async getGuestByCode(guestCode: string): Promise<Guest | undefined> {
    const result = await db.select().from(schema.guests).where(eq(schema.guests.guestCode, guestCode));
    return result[0];
  }

  async createGuest(data: InsertGuest): Promise<Guest> {
    const result = await db.insert(schema.guests).values(data).returning();
    return result[0];
  }

  async updateGuest(id: number, data: Partial<InsertGuest>): Promise<Guest | undefined> {
    const result = await db.update(schema.guests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.guests.id, id))
      .returning();
    return result[0];
  }

  async deleteGuest(id: number): Promise<boolean> {
    const result = await db.delete(schema.guests).where(eq(schema.guests.id, id)).returning();
    return result.length > 0;
  }

  async bulkCreateGuests(data: InsertGuest[]): Promise<Guest[]> {
    if (data.length === 0) return [];
    return db.insert(schema.guests).values(data).returning();
  }

  async checkinGuest(id: number): Promise<Guest | undefined> {
    const result = await db.update(schema.guests)
      .set({
        checkinStatus: "checked_in",
        checkedInAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(schema.guests.id, id))
      .returning();
    return result[0];
  }

  // ── Invitations (Updated) ───────────────────────────────────

  async getInvitationsByUser(userId: number): Promise<Invitation[]> {
    return db.select().from(schema.invitations)
      .where(eq(schema.invitations.userId, userId))
      .orderBy(desc(schema.invitations.createdAt));
  }
}

export const storage = new DatabaseStorage();
