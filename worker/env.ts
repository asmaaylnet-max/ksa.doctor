import type { UserRow } from './users';

export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  APP_URL: string;
  FROM_EMAIL: string;
  ADMIN_EMAIL: string;
  ENVIRONMENT: string;
  SESSION_SECRET: string;
  PASSWORD_PEPPER: string;
  RESEND_API_KEY?: string;
}

export interface Variables {
  user: UserRow | null;
  sessionId: string | null;
  ip: string;
  ua: string;
}

export type AppEnv = {
  Bindings: Env;
  Variables: Variables;
};
