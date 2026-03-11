import { storage } from "./storage";
import type { PricingPlan } from "@shared/schema";

export const FREE_PLAN_DEFAULTS: Omit<PricingPlan, "id" | "createdAt" | "updatedAt"> = {
  name: "Mulai Gratis",
  slug: "gratis",
  price: 0,
  description: "Untuk mencoba platform kami",
  maxInvitations: 1,
  maxGalleryPhotos: 3,
  allowPremiumTemplates: false,
  allowMusic: false,
  allowLoveStory: false,
  allowGift: false,
  allowCustomDomain: false,
  isActive: true,
};

export async function getUserActivePlan(userId: number): Promise<PricingPlan> {
  const sub = await storage.getActiveSubscription(userId);
  if (sub) return sub.plan;
  const freePlan = await storage.getPricingPlanBySlug("gratis");
  return freePlan ?? (FREE_PLAN_DEFAULTS as PricingPlan);
}

export async function canCreateInvitation(userId: number): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getUserActivePlan(userId);
  const invitations = await storage.getAllInvitations();
  const userInvitations = invitations.filter((_inv) => true);
  if (plan.maxInvitations !== 999 && userInvitations.length >= plan.maxInvitations) {
    return { allowed: false, reason: `Batas undangan paket ${plan.name} sudah tercapai (${plan.maxInvitations} undangan). Upgrade untuk menambah undangan.` };
  }
  return { allowed: true };
}

export async function canUploadGalleryCount(userId: number, currentCount: number): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getUserActivePlan(userId);
  if (plan.maxGalleryPhotos !== 999 && currentCount > plan.maxGalleryPhotos) {
    return { allowed: false, reason: `Batas foto galeri paket ${plan.name} adalah ${plan.maxGalleryPhotos} foto. Upgrade untuk menambah foto.` };
  }
  return { allowed: true };
}

export async function canUseMusic(userId: number): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getUserActivePlan(userId);
  if (!plan.allowMusic) return { allowed: false, reason: `Fitur musik hanya tersedia untuk paket Premium atau Pro.` };
  return { allowed: true };
}

export async function canUseLoveStory(userId: number): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getUserActivePlan(userId);
  if (!plan.allowLoveStory) return { allowed: false, reason: `Fitur love story hanya tersedia untuk paket Premium atau Pro.` };
  return { allowed: true };
}

export async function canUseGift(userId: number): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getUserActivePlan(userId);
  if (!plan.allowGift) return { allowed: false, reason: `Fitur amplop digital hanya tersedia untuk paket Premium atau Pro.` };
  return { allowed: true };
}

export async function canUsePremiumTemplate(userId: number): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getUserActivePlan(userId);
  if (!plan.allowPremiumTemplates) return { allowed: false, reason: `Template premium hanya tersedia untuk paket Premium atau Pro.` };
  return { allowed: true };
}

export async function canUseCustomDomain(userId: number): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getUserActivePlan(userId);
  if (!plan.allowCustomDomain) return { allowed: false, reason: `Custom domain hanya tersedia untuk paket Pro.` };
  return { allowed: true };
}

function generateOrderNumber(): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `WS-${date}-${rand}`;
}

export { generateOrderNumber };
