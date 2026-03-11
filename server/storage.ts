import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc, asc } from "drizzle-orm";
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
}

export const storage = new DatabaseStorage();
