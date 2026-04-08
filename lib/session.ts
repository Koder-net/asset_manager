import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.SESSION_SECRET || 'fallback-dev-secret-min-32-chars-long!!';
const encodedKey = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  expiresAt?: Date;
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = ''): Promise<SessionPayload | null> {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
  const session = await encrypt({ ...payload, expiresAt });
  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  return decrypt(session);
}

export async function updateSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get('session')?.value;
  const payload = await decrypt(sessionValue);
  if (!payload) return;
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const newSession = await encrypt({ ...payload, expiresAt });
  cookieStore.set('session', newSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}
