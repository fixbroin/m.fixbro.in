'use server';

import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'cineelite-ads-super-secret-key-12345'
);

export async function login(formData: any) {
  const { username, password } = formData;

  try {
    const rows: any = await db.query('SELECT * FROM admin_users WHERE username = ?', [username]);

    if (rows.length === 0) {
      return { success: false, error: 'Invalid username or password.' };
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return { success: false, error: 'Invalid username or password.' };
    }

    // Create JWT
    const token = await new SignJWT({ userId: user.id, username: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(SECRET_KEY);

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    // Update last login
    await db.query('UPDATE admin_users SET last_login = NOW() WHERE id = ?', [user.id]);

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
    return { success: true };
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch (error) {
    return null;
  }
}
