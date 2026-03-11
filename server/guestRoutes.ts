import { type Express } from "express";
import { storage } from "./storage";
import { requireUser } from "./userAuth";
import { insertGuestSchema } from "@shared/schema";
import { z } from "zod";

// Simple nanoid-like generator
function generateGuestCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 0, 1 to avoid confusion
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function registerGuestRoutes(app: Express) {
  // GET /api/guests?invitationId=X
  app.get("/api/guests", requireUser, async (req, res) => {
    try {
      const invitationId = parseInt(req.query.invitationId as string);
      if (isNaN(invitationId)) {
        return res.status(400).json({ error: "invitationId is required" });
      }

      const invitation = await storage.getInvitationById(invitationId);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      // Check if user owns this invitation
      if (invitation.userId !== req.session.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const guests = await storage.getGuestsByInvitation(invitationId);
      res.json(guests);
    } catch (error) {
      console.error("[guestRoutes] Error fetching guests:", error);
      res.status(500).json({ error: "Failed to fetch guests" });
    }
  });

  // POST /api/guests
  app.post("/api/guests", requireUser, async (req, res) => {
    try {
      const { invitationId, ...guestData } = req.body;
      if (!invitationId) {
        return res.status(400).json({ error: "invitationId is required" });
      }

      const invitation = await storage.getInvitationById(invitationId);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      if (invitation.userId !== req.session.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      let guestCode = generateGuestCode(8);
      // Ensure unique guestCode
      while (await storage.getGuestByCode(guestCode)) {
        guestCode = generateGuestCode(8);
      }

      const parsed = insertGuestSchema.safeParse({
        ...guestData,
        invitationId,
        guestCode
      });

      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      }

      const guest = await storage.createGuest(parsed.data);
      res.status(201).json(guest);
    } catch (error) {
      console.error("[guestRoutes] Error creating guest:", error);
      res.status(500).json({ error: "Failed to create guest" });
    }
  });

  // PATCH /api/guests/:id
  app.patch("/api/guests/:id", requireUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      const existingGuest = await storage.getGuestById(id);
      if (!existingGuest) return res.status(404).json({ error: "Guest not found" });

      const invitation = await storage.getInvitationById(existingGuest.invitationId);
      if (!invitation || invitation.userId !== req.session.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const guest = await storage.updateGuest(id, req.body);
      res.json(guest);
    } catch (error) {
      console.error("[guestRoutes] Error updating guest:", error);
      res.status(500).json({ error: "Failed to update guest" });
    }
  });

  // DELETE /api/guests/:id
  app.delete("/api/guests/:id", requireUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      const existingGuest = await storage.getGuestById(id);
      if (!existingGuest) return res.status(404).json({ error: "Guest not found" });

      const invitation = await storage.getInvitationById(existingGuest.invitationId);
      if (!invitation || invitation.userId !== req.session.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await storage.deleteGuest(id);
      res.json({ success: true });
    } catch (error) {
      console.error("[guestRoutes] Error deleting guest:", error);
      res.status(500).json({ error: "Failed to delete guest" });
    }
  });

  // POST /api/guests/import
  app.post("/api/guests/import", requireUser, async (req, res) => {
    try {
      const { invitationId, guests: guestsArray } = req.body;
      if (!invitationId || !Array.isArray(guestsArray)) {
        return res.status(400).json({ error: "invitationId and guests array are required" });
      }

      const invitation = await storage.getInvitationById(invitationId);
      if (!invitation || invitation.userId !== req.session.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const guestsToInsert = [];
      for (const guest of guestsArray) {
        let guestCode = generateGuestCode(8);
        while (await storage.getGuestByCode(guestCode)) {
          guestCode = generateGuestCode(8);
        }

        const parsed = insertGuestSchema.safeParse({
          ...guest,
          invitationId,
          guestCode
        });

        if (parsed.success) {
          guestsToInsert.push(parsed.data);
        }
      }

      if (guestsToInsert.length === 0) {
        return res.status(400).json({ error: "No valid guests to import" });
      }

      const createdGuests = await storage.bulkCreateGuests(guestsToInsert);
      res.status(201).json(createdGuests);
    } catch (error) {
      console.error("[guestRoutes] Error importing guests:", error);
      res.status(500).json({ error: "Failed to import guests" });
    }
  });

  // GET /api/public/guests/:code — no auth, for public invite pages
  app.get("/api/public/guests/:code", async (req, res) => {
    try {
      const guest = await storage.getGuestByCode(req.params.code as string);
      if (!guest) return res.status(404).json({ error: "Guest not found" });
      res.json({ id: guest.id, name: guest.name, maxGuest: guest.maxGuest, checkinStatus: guest.checkinStatus });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch guest" });
    }
  });

  // POST /api/guests/:id/checkin
  app.post("/api/guests/:id/checkin", requireUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      const existingGuest = await storage.getGuestById(id);
      if (!existingGuest) return res.status(404).json({ error: "Guest not found" });

      const invitation = await storage.getInvitationById(existingGuest.invitationId);
      if (!invitation || invitation.userId !== req.session.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const guest = await storage.checkinGuest(id);
      res.json(guest);
    } catch (error) {
      console.error("[guestRoutes] Error checking in guest:", error);
      res.status(500).json({ error: "Failed to check in guest" });
    }
  });
}
