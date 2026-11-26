import { jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';

export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET environment variable is required in production.');
    }
    return new TextEncoder().encode('dev-only-fixbro-secret-do-not-use-in-prod');
  }
  return new TextEncoder().encode(secret);
}

export async function verifyAdminToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function requireAdmin(): Promise<JWTPayload> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('Unauthorized: Admin session required.');
  }
  return session;
}
