'use server';

import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

export interface Notification {
    id?: string;
    type: 'visit' | 'submission' | 'order';
    message: string;
    isRead: boolean;
    createdAt: string;
}

export async function createNotification(data: { type: Notification['type']; message: string }) {
    try {
        const id = uuidv4();
        await db.query(
            'INSERT INTO notifications (id, type, message, isRead) VALUES (?, ?, ?, ?)',
            [id, data.type, data.message, false]
        );
        revalidatePath('/admin/header'); // To update notification count
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
}

export async function getNotifications(): Promise<Notification[]> {
    try {
        const rows: any = await db.query('SELECT * FROM notifications ORDER BY createdAt DESC');
        return rows.map((row: any) => ({
            id: row.id,
            type: row.type,
            message: row.message,
            isRead: !!row.isRead,
            createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
        })) as Notification[];
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return [];
    }
}

export async function getUnreadNotificationsCount(): Promise<number> {
    try {
        const rows: any = await db.query('SELECT COUNT(*) as count FROM notifications WHERE isRead = FALSE');
        return rows[0].count;
    } catch (error) {
        console.error('Failed to get unread notifications count:', error);
        return 0;
    }
}

export async function markAllNotificationsAsRead() {
    try {
        await db.query('UPDATE notifications SET isRead = TRUE WHERE isRead = FALSE');
        revalidatePath('/admin/header');
        revalidatePath('/admin/notifications');
    } catch (error) {
        console.error('Failed to mark notifications as read:', error);
    }
}


export async function clearAllNotifications(): Promise<{ success: boolean, error?: string}> {
    try {
        await db.query('DELETE FROM notifications');
        revalidatePath('/admin/notifications');
        revalidatePath('/admin/header');
        return { success: true };
    } catch (error: any) {
        console.error("Failed to clear notifications:", error);
        return { success: false, error: `An unexpected error occurred: ${error.message}` };
    }
}
