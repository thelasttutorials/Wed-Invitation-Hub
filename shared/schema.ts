import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  serial,
  integer,
  boolean,
  date,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// admins
// Super-admin accounts. Password stored as bcrypt hash.
// ─────────────────────────────────────────────────────────────
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default("Admin"),
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
});

// ─────────────────────────────────────────────────────────────
// landing_settings
// Key-value store for all editable landing page content.
// One row per setting key (e.g. "hero_title", "hero_subtitle").
// ─────────────────────────────────────────────────────────────
export const landingSettings = pgTable("landing_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().default(sql`NOW()`),
});

// ─────────────────────────────────────────────────────────────
// invitations
// Core wedding invitation data.
// ─────────────────────────────────────────────────────────────
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull(),
  groomName: text("groom_name").notNull(),
  brideName: text("bride_name").notNull(),
  groomParents: text("groom_parents").notNull().default(""),
  brideParents: text("bride_parents").notNull().default(""),
  akadDate: date("akad_date"),
  receptionDate: date("reception_date"),
  akadTime: text("akad_time").notNull().default(""),
  receptionTime: text("reception_time").notNull().default(""),
  venueName: text("venue_name").notNull().default(""),
  venueAddress: text("venue_address").notNull().default(""),
  mapsUrl: text("maps_url").notNull().default(""),
  openingQuote: text("opening_quote").notNull().default(""),
  coverPhotoUrl: text("cover_photo_url").notNull().default(""),
  musicUrl: text("music_url").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  galleryPhotos: text("gallery_photos").array().notNull().default(sql`'{}'`),
  additionalNotes: text("additional_notes").notNull().default(""),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`NOW()`),
}, (table) => ({
  // Matches the existing DB constraint name to prevent Drizzle from renaming it
  slugKey: uniqueIndex("invitations_slug_key").on(table.slug),
}));

// ─────────────────────────────────────────────────────────────
// love_story_items
// Timeline entries per invitation.
// ─────────────────────────────────────────────────────────────
export const loveStoryItems = pgTable("love_story_items", {
  id: serial("id").primaryKey(),
  invitationId: integer("invitation_id").notNull(),
  dateLabel: text("date_label").notNull().default(""),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  photoUrl: text("photo_url").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
});

// ─────────────────────────────────────────────────────────────
// rsvps  (table name: rsvp_entries — kept for backward compat)
// Guest attendance confirmations.
// ─────────────────────────────────────────────────────────────
export const rsvps = pgTable("rsvp_entries", {
  id: serial("id").primaryKey(),
  invitationId: integer("invitation_id").notNull(),
  guestName: text("guest_name").notNull(),
  attendance: text("attendance").notNull().default("belum_pasti"),
  guestCount: integer("guest_count").notNull().default(1),
  message: text("message").notNull().default(""),
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
});

// ─────────────────────────────────────────────────────────────
// wishes  (table name: guestbook_entries — kept for backward compat)
// Guest messages and congratulations.
// ─────────────────────────────────────────────────────────────
export const wishes = pgTable("guestbook_entries", {
  id: serial("id").primaryKey(),
  invitationId: integer("invitation_id").notNull(),
  guestName: text("guest_name").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
});

// ─────────────────────────────────────────────────────────────
// Legacy alias — keeps existing server/storage.ts code working
// without any changes.
// ─────────────────────────────────────────────────────────────
export const rsvpEntries = rsvps;
export const guestbookEntries = wishes;

// ─────────────────────────────────────────────────────────────
// users
// Customer accounts. No password — authentication via OTP email.
// ─────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
});

// ─────────────────────────────────────────────────────────────
// email_verifications
// Short-lived OTP codes used for passwordless login.
// ─────────────────────────────────────────────────────────────
export const emailVerifications = pgTable("email_verifications", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
});

// ─────────────────────────────────────────────────────────────
// Insert schemas (Zod)
// ─────────────────────────────────────────────────────────────
export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

export const insertLandingSettingSchema = createInsertSchema(landingSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertInvitationSchema = createInsertSchema(invitations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateInvitationSchema = insertInvitationSchema.partial();

export const insertLoveStoryItemSchema = createInsertSchema(loveStoryItems).omit({
  id: true,
  createdAt: true,
});

export const insertRsvpSchema = createInsertSchema(rsvps).omit({
  id: true,
  createdAt: true,
});

export const insertWishSchema = createInsertSchema(wishes).omit({
  id: true,
  createdAt: true,
});

// Legacy aliases — keeps existing code using old names working
export const insertGuestbookSchema = insertWishSchema;

// ─────────────────────────────────────────────────────────────
// TypeScript types
// ─────────────────────────────────────────────────────────────
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;

export type LandingSetting = typeof landingSettings.$inferSelect;
export type InsertLandingSetting = z.infer<typeof insertLandingSettingSchema>;

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;

export type LoveStoryItem = typeof loveStoryItems.$inferSelect;
export type InsertLoveStoryItem = z.infer<typeof insertLoveStoryItemSchema>;

export type Rsvp = typeof rsvps.$inferSelect;
export type InsertRsvp = z.infer<typeof insertRsvpSchema>;

export type Wish = typeof wishes.$inferSelect;
export type InsertWish = z.infer<typeof insertWishSchema>;

// Legacy type aliases
export type RsvpEntry = Rsvp;
export type GuestbookEntry = Wish;
export type InsertGuestbook = InsertWish;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertEmailVerificationSchema = createInsertSchema(emailVerifications).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type EmailVerification = typeof emailVerifications.$inferSelect;
export type InsertEmailVerification = z.infer<typeof insertEmailVerificationSchema>;
