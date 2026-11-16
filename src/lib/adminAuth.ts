import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const ADMIN_COOKIE = 'realic_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

const isProd = process.env.NODE_ENV === 'production';

/**
 * Credentials come from environment variables (see .env.example).
 * In development ONLY, harmless fallbacks are used so `npm run dev` works.
 * In production, missing variables disable admin login entirely.
 */
function getConfig() {
  const email = process.env.ADMIN_EMAIL || (isProd ? '' : 'admin@realicconsultant.com');
  const password = process.env.ADMIN_PASSWORD || (isProd ? '' : 'realic-dev-only');
  const secret = process.env.ADMIN_SESSION_SECRET || (isProd ? '' : 'dev-only-secret-change-me');
  return { email, password, secret, configured: Boolean(email && password && secret) };
}

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function isAdminConfigured(): boolean {
  return getConfig().configured;
}

export function verifyCredentials(email: string, password: string): boolean {
  const cfg = getConfig();
  if (!cfg.configured) return false;
  const emailOk = safeEqual(email.trim().toLowerCase(), cfg.email.trim().toLowerCase());
  const passOk = safeEqual(password, cfg.password);
  return emailOk && passOk;
}

export function createSessionToken(email: string): string {
  const { secret } = getConfig();
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ email, exp })).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string | undefined): { email: string } | null {
  const cfg = getConfig();
  if (!token || !cfg.configured) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  if (!safeEqual(sig, sign(payload, cfg.secret))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (typeof data.exp !== 'number' || data.exp < Date.now() / 1000) return null;
    return { email: String(data.email) };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
};

export async function getAdminSession(): Promise<{ email: string } | null> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

/** Call at the top of a protected route handler. Returns a 401 response if not signed in, otherwise null. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getAdminSession();
  if (session) return null;
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}
