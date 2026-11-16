import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  createSessionToken,
  isAdminConfigured,
  sessionCookieOptions,
  verifyCredentials,
} from '@/lib/adminAuth';

// Simple in-memory brute-force limiter: 5 failures per IP per 15 minutes.
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Admin login is not configured on the server (set ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET).' },
      { status: 503 }
    );
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && rec.resetAt > now && rec.count >= MAX_FAILS) {
    return NextResponse.json(
      { success: false, error: 'Too many attempts. Please try again in a few minutes.' },
      { status: 429 }
    );
  }

  let body: { email?: string; password?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }

  const email = String(body.email || '');
  const password = String(body.password || '');

  if (!verifyCredentials(email, password)) {
    const next = rec && rec.resetAt > now ? rec : { count: 0, resetAt: now + WINDOW_MS };
    next.count += 1;
    attempts.set(ip, next);
    return NextResponse.json(
      { success: false, error: 'Invalid credentials. Please verify your email and security key.' },
      { status: 401 }
    );
  }

  attempts.delete(ip);
  const res = NextResponse.json({ success: true, email: email.trim().toLowerCase() });
  res.cookies.set(ADMIN_COOKIE, createSessionToken(email.trim().toLowerCase()), sessionCookieOptions);
  return res;
}
