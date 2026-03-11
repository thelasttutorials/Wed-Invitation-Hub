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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).unique().notNull(),
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
});

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

export const rsvpEntries = pgTable("rsvp_entries", {
  id: serial("id").primaryKey(),
  invitationId: integer("invitation_id").notNull(),
  guestName: text("guest_name").notNull(),
  attendance: text("attendance").notNull().default("belum_pasti"),
  guestCount: integer("guest_count").notNull().default(1),
  message: text("message").notNull().default(""),
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
});

export const guestbookEntries = pgTable("guestbook_entries", {
  id: serial("id").primaryKey(),
  invitationId: integer("invitation_id").notNull(),
  guestName: text("guest_name").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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

export const insertRsvpSchema = createInsertSchema(rsvpEntries).omit({
  id: true,
  createdAt: true,
});

export const insertGuestbookSchema = createInsertSchema(guestbookEntries).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type LoveStoryItem = typeof loveStoryItems.$inferSelect;
export type InsertLoveStoryItem = z.infer<typeof insertLoveStoryItemSchema>;
export type RsvpEntry = typeof rsvpEntries.$inferSelect;
export type InsertRsvp = z.infer<typeof insertRsvpSchema>;
export type GuestbookEntry = typeof guestbookEntries.$inferSelect;
export type InsertGuestbook = z.infer<typeof insertGuestbookSchema>;
