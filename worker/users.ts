import type { AdminMember, UserPrivate, UserPublic, UserRole, UserStatus } from '../shared/types';
import type { CustomButton, MediaItem, Service, SocialLink, VideoItem } from '../shared/types';
import { parseArray } from './util';

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  handle: string;
  full_name_ar: string;
  full_name_en: string;
  specialty_ar: string;
  specialty_en: string;
  title_ar: string;
  title_en: string;
  bio_ar: string;
  bio_en: string;
  city: string;
  phone: string;
  whatsapp: string;
  public_email: string;
  website: string;
  avatar_key: string;
  cover_key: string;
  accent: string;
  socials: string;
  services: string;
  buttons: string;
  videos: string;
  skills: string;
  works: string;
  visible: number;
  featured: number;
  views: number;
  rejection_reason: string;
  approved_at: string | null;
  approved_by: number | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  consent: string;
}

export function memberNo(id: number): string {
  return `C${String(id).padStart(6, '0')}`;
}

export function profileCompletion(row: UserRow): number {
  let score = 0;
  if (row.avatar_key) score += 10;
  if (row.cover_key) score += 5;
  if (row.bio_ar.trim().length >= 40) score += 15;
  if (row.specialty_ar.trim()) score += 10;
  if (row.city.trim()) score += 5;
  if (row.phone.trim() || row.whatsapp.trim() || row.public_email.trim()) score += 10;
  if (parseArray<SocialLink>(row.socials).length) score += 10;
  if (parseArray<Service>(row.services).length) score += 10;
  if (parseArray<MediaItem>(row.skills).length) score += 10;
  if (parseArray<MediaItem>(row.works).length) score += 10;
  if (parseArray<VideoItem>(row.videos).length) score += 5;
  return Math.min(100, score);
}

export function toPublic(row: UserRow): UserPublic {
  return {
    id: row.id,
    memberNo: memberNo(row.id),
    handle: row.handle,
    fullNameAr: row.full_name_ar,
    fullNameEn: row.full_name_en,
    specialtyAr: row.specialty_ar,
    specialtyEn: row.specialty_en,
    titleAr: row.title_ar,
    titleEn: row.title_en,
    bioAr: row.bio_ar,
    bioEn: row.bio_en,
    city: row.city,
    phone: row.phone,
    whatsapp: row.whatsapp,
    publicEmail: row.public_email,
    website: row.website,
    avatarKey: row.avatar_key,
    coverKey: row.cover_key,
    accent: row.accent,
    socials: parseArray<SocialLink>(row.socials),
    services: parseArray<Service>(row.services),
    buttons: parseArray<CustomButton>(row.buttons),
    videos: parseArray<VideoItem>(row.videos),
    skills: parseArray<MediaItem>(row.skills),
    works: parseArray<MediaItem>(row.works),
    featured: !!row.featured,
    views: row.views,
    createdAt: row.created_at,
    approvedAt: row.approved_at
  };
}

export function toPrivate(row: UserRow): UserPrivate {
  return {
    ...toPublic(row),
    email: row.email,
    status: row.status,
    role: row.role,
    visible: !!row.visible,
    rejectionReason: row.rejection_reason,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
    profileCompletion: profileCompletion(row)
  };
}

export function toAdminMember(row: UserRow): AdminMember {
  const base = toPrivate(row);
  return {
    ...base,
    skillsCount: parseArray<MediaItem>(row.skills).length,
    worksCount: parseArray<MediaItem>(row.works).length,
    servicesCount: parseArray<Service>(row.services).length
  };
}

export const USER_COLUMNS = `id, email, password_hash, role, status, handle, full_name_ar, full_name_en,
  specialty_ar, specialty_en, title_ar, title_en, bio_ar, bio_en, city, phone, whatsapp, public_email,
  website, avatar_key, cover_key, accent, socials, services, buttons, videos, skills, works, visible,
  featured, views, rejection_reason, approved_at, approved_by, last_login_at, created_at, updated_at, consent`;

export async function getUserById(env: { DB: D1Database }, id: number): Promise<UserRow | null> {
  return env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`).bind(id).first<UserRow>();
}

export async function getUserByHandle(env: { DB: D1Database }, handle: string): Promise<UserRow | null> {
  return env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE handle = ? COLLATE NOCASE`).bind(handle).first<UserRow>();
}
