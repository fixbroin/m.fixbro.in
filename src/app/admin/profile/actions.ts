'use server';

import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { getSession } from '../login/auth-actions';

export async function updateAdminProfile(data: { username: string, email: string }) {
    try {
        const session: any = await getSession();
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        const userId = session.userId;

        // Check if username is already taken by another user
        const existing: any = await db.query('SELECT id FROM admin_users WHERE username = ? AND id != ?', [data.username, userId]);
        if (existing.length > 0) {
            return { success: false, error: 'Username already taken.' };
        }

        await db.query(
            'UPDATE admin_users SET username = ?, email = ? WHERE id = ?',
            [data.username, data.email, userId]
        );

        revalidatePath('/admin/profile');
        return { success: true };
    } catch (error: any) {
        console.error("Profile update error:", error);
        return { success: false, error: 'Failed to update profile.' };
    }
}

export async function updateAdminPassword(data: { currentPass: string, newPass: string }) {
    try {
        const session: any = await getSession();
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        const userId = session.userId;

        // Get user to verify current password
        const rows: any = await db.query('SELECT password FROM admin_users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            return { success: false, error: 'User not found.' };
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(data.currentPass, user.password);
        if (!isMatch) {
            return { success: false, error: 'Current password is incorrect.' };
        }

        const hashedNewPassword = await bcrypt.hash(data.newPass, 10);
        await db.query('UPDATE admin_users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

        return { success: true };
    } catch (error: any) {
        console.error("Password update error:", error);
        return { success: false, error: 'Failed to update password.' };
    }
}

export async function getAdminUserData() {
    try {
        const session: any = await getSession();
        if (!session) return null;

        const rows: any = await db.query('SELECT id, username, email FROM admin_users WHERE id = ?', [session.userId]);
        if (rows.length > 0) {
            return rows[0];
        }
        return null;
    } catch (error) {
        console.error("Error fetching admin user data:", error);
        return null;
    }
}
