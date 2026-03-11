import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc, asc } from "drizzle-orm";
import * as schema from "@shared/schema";
import type {
  User,
  InsertUser,
  Invitation,
  InsertInvitation,
  LoveStoryItem,
  InsertLoveStoryItem,
  RsvpEntry,
  InsertRsvp,
  GuestbookEntry,
  InsertGuestbook,
} from "@shared/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Invitations
  getAllInvitations(): Promise<Invitation[]>;
  getInvitationBySlug(slug: string): Promise<Invitation | undefined>;
  getInvitationById(id: number): Promise<Invitation | undefined>;
  createInvitation(data: InsertInvitation): Promise<Invitation>;
  updateInvitation(id: number, data: Partial<InsertInvitation>): Promise<Invitation | undefined>;
  deleteInvitation(id: number): Promise<boolean>;
  slugExists(slug: string): Promise<boolean>;

  // Love Story
  getLoveStoryByInvitation(invitationId: number): Promise<LoveStoryItem[]>;
  createLoveStoryItem(data: InsertLoveStoryItem): Promise<LoveStoryItem>;
  updateLoveStoryItem(id: number, data: Partial<InsertLoveStoryItem>): Promise<LoveStoryItem | undefined>;
  deleteLoveStoryItem(id: number): Promise<boolean>;
  replaceLoveStory(invitationId: number, items: Omit<InsertLoveStoryItem, "invitationId">[]): Promise<LoveStoryItem[]>;

  // RSVP
  getRsvpByInvitation(invitationId: number): Promise<RsvpEntry[]>;
  createRsvp(data: InsertRsvp): Promise<RsvpEntry>;

  // Guestbook
  getGuestbookByInvitation(invitationId: number): Promise<GuestbookEntry[]>;
  createGuestbookEntry(data: InsertGuestbook): Promise<GuestbookEntry>;
}

class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return result[0];
  }
  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0];
  }

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
    const result = await db.select({ id: schema.invitations.id }).from(schema.invitations).where(eq(schema.invitations.slug, slug));
    return result.length > 0;
  }

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

  async getRsvpByInvitation(invitationId: number): Promise<RsvpEntry[]> {
    return db.select().from(schema.rsvpEntries)
      .where(eq(schema.rsvpEntries.invitationId, invitationId))
      .orderBy(desc(schema.rsvpEntries.createdAt));
  }
  async createRsvp(data: InsertRsvp): Promise<RsvpEntry> {
    const result = await db.insert(schema.rsvpEntries).values(data).returning();
    return result[0];
  }

  async getGuestbookByInvitation(invitationId: number): Promise<GuestbookEntry[]> {
    return db.select().from(schema.guestbookEntries)
      .where(eq(schema.guestbookEntries.invitationId, invitationId))
      .orderBy(desc(schema.guestbookEntries.createdAt));
  }
  async createGuestbookEntry(data: InsertGuestbook): Promise<GuestbookEntry> {
    const result = await db.insert(schema.guestbookEntries).values(data).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
