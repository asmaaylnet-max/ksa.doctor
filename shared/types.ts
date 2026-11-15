export type Locale = 'ar' | 'en';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type UserRole = 'member' | 'admin';

export type SocialPlatform =
  | 'x'
  | 'linkedin'
  | 'instagram'
  | 'snapchat'
  | 'tiktok'
  | 'facebook'
  | 'youtube'
  | 'whatsapp'
  | 'telegram'
  | 'threads'
  | 'email'
  | 'phone';

export interface SocialLink {
  platform: SocialPlatform;
  value: string;
}

export interface Service {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: string;
}

export interface CustomButton {
  id: string;
  labelAr: string;
  labelEn: string;
  url: string;
  icon: string;
  color: string;
}

export interface VideoItem {
  id: string;
  url: string;
  videoId: string;
  titleAr: string;
  titleEn: string;
}

export interface MediaItem {
  key: string;
  captionAr?: string;
  captionEn?: string;
}

export interface UserPublic {
  id: number;
  memberNo: string;
  handle: string;
  fullNameAr: string;
  fullNameEn: string;
  specialtyAr: string;
  specialtyEn: string;
  titleAr: string;
  titleEn: string;
  bioAr: string;
  bioEn: string;
  city: string;
  phone: string;
  whatsapp: string;
  publicEmail: string;
  website: string;
  avatarKey: string;
  coverKey: string;
  accent: string;
  socials: SocialLink[];
  services: Service[];
  buttons: CustomButton[];
  videos: VideoItem[];
  skills: MediaItem[];
  works: MediaItem[];
  featured: boolean;
  views: number;
  createdAt: string;
  approvedAt: string | null;
}

export interface UserPrivate extends UserPublic {
  email: string;
  status: UserStatus;
  role: UserRole;
  visible: boolean;
  rejectionReason: string;
  updatedAt: string;
  lastLoginAt: string | null;
  profileCompletion: number;
}

export interface AdminMember extends Omit<UserPrivate, 'socials' | 'services' | 'buttons' | 'videos' | 'skills' | 'works' | 'avatarKey' | 'coverKey'> {
  avatarKey: string;
  coverKey: string;
  skillsCount: number;
  worksCount: number;
  servicesCount: number;
}

export interface SearchResult {
  handle: string;
  fullNameAr: string;
  fullNameEn: string;
  specialtyAr: string;
  specialtyEn: string;
  city: string;
  avatarKey: string;
  bioAr: string;
  bioEn: string;
  featured: boolean;
}

export interface SearchResponse {
  items: SearchResult[];
  total: number;
  page: number;
  pages: number;
}

export interface MetaResponse {
  members: number;
  specialties: { ar: string; en: string; count: number }[];
  cities: { key: string; count: number }[];
  announcement: { ar: string; en: string } | null;
}

export interface AdminStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  suspended: number;
  views: number;
  searches: number;
  signups7d: number;
  visits14d: { day: string; count: number }[];
  recent: { id: number; handle: string; fullNameAr: string; email: string; status: UserStatus; createdAt: string }[];
}

export interface ApiError {
  error: { code: string; message: string; fields?: Record<string, string> };
}
