import { z } from 'zod';
import { RESERVED_HANDLES } from './data';

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'handle_min')
  .max(24, 'handle_max')
  .regex(/^[a-z0-9]+$/, 'handle_format')
  .refine((v) => !RESERVED_HANDLES.has(v), 'handle_reserved');

export const emailSchema = z.string().trim().toLowerCase().email('email_invalid').max(160);
export const proofSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'proof_invalid');

export const passwordInputSchema = z.string().min(8, 'password_min').max(128, 'password_max');

export const registerSchema = z.object({
  fullNameAr: z.string().trim().min(2, 'name_min').max(80, 'name_max'),
  email: emailSchema,
  handle: handleSchema,
  proof: proofSchema,
  locale: z.enum(['ar', 'en']).default('ar')
});

export const loginSchema = z.object({
  email: emailSchema,
  proof: proofSchema
});

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z.object({
  token: z.string().min(20).max(100),
  email: emailSchema,
  proof: proofSchema
});

export const changePasswordSchema = z.object({
  currentProof: proofSchema,
  newProof: proofSchema
});

export const profileUpdateSchema = z.object({
  fullNameAr: z.string().trim().min(2, 'name_min').max(80, 'name_max'),
  fullNameEn: z.string().trim().max(80).default(''),
  specialtyAr: z.string().trim().min(2, 'specialty_required').max(80),
  specialtyEn: z.string().trim().max(80).default(''),
  titleAr: z.string().trim().max(80).default(''),
  titleEn: z.string().trim().max(80).default(''),
  bioAr: z.string().trim().max(1200).default(''),
  bioEn: z.string().trim().max(1200).default(''),
  city: z.string().trim().max(40).default(''),
  phone: z.string().trim().max(30).default(''),
  whatsapp: z.string().trim().max(30).default(''),
  publicEmail: z.union([z.string().trim().email('email_invalid').max(160), z.literal('')]).default(''),
  website: z.string().trim().max(200).default(''),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'accent_invalid').default('#006830')
});

const httpUrl = z.string().trim().max(500).refine((v) => {
  if (!v) return true;
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}, 'url_invalid');

export const socialsSchema = z
  .array(z.object({ platform: z.string().max(20), value: z.string().trim().max(300) }))
  .max(12)
  .default([]);

export const servicesSchema = z
  .array(
    z.object({
      id: z.string().max(40),
      titleAr: z.string().trim().min(2).max(80),
      titleEn: z.string().trim().max(80).default(''),
      descAr: z.string().trim().max(240).default(''),
      descEn: z.string().trim().max(240).default(''),
      icon: z.string().max(40).default('stethoscope')
    })
  )
  .max(8)
  .default([]);

export const buttonsSchema = z
  .array(
    z.object({
      id: z.string().max(40),
      labelAr: z.string().trim().min(1).max(60),
      labelEn: z.string().trim().max(60).default(''),
      url: httpUrl,
      icon: z.string().max(40).default('link'),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#006830')
    })
  )
  .max(6)
  .default([]);

export const videosSchema = z
  .array(
    z.object({
      id: z.string().max(40),
      url: z.string().trim().max(500),
      videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
      titleAr: z.string().trim().max(120).default(''),
      titleEn: z.string().trim().max(120).default('')
    })
  )
  .max(6)
  .default([]);

export const linksUpdateSchema = z.object({
  socials: socialsSchema,
  services: servicesSchema,
  buttons: buttonsSchema,
  videos: videosSchema
});

export const adminRejectSchema = z.object({
  reason: z.string().trim().min(3, 'reason_required').max(500)
});

export const adminSettingsSchema = z.object({
  registrationOpen: z.boolean().default(true),
  announcementAr: z.string().trim().max(300).default(''),
  announcementEn: z.string().trim().max(300).default(''),
  adminNotify: z.boolean().default(true)
});

export const handleChangeSchema = z.object({ handle: handleSchema });

export const consentSchema = z.object({
  necessary: z.literal(true),
  preferences: z.boolean(),
  analytics: z.boolean(),
  version: z.number().int().min(1)
});

export const trackSchema = z.object({
  path: z.string().max(120),
  kind: z.enum(['page', 'search', 'profile']).default('page')
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type LinksUpdateInput = z.infer<typeof linksUpdateSchema>;
export type AdminSettingsInput = z.infer<typeof adminSettingsSchema>;
