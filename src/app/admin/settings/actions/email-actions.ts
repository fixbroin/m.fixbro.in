
'use server';

import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { revalidatePath } from 'next/cache';

export interface EmailSettings {
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_password?: string;
    smtp_sender_email: string;
}

export async function getEmailSettings(): Promise<EmailSettings> {
    try {
        const rows = await db.query<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', ['email_settings']);
        if (rows.length > 0) {
            const data = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
            return {
                ...data,
                smtp_port: Number(data.smtp_port) || 587,
                smtp_password: data.smtp_password || '',
            };
        } else {
            const defaultData: EmailSettings = {
                smtp_host: 'smtp.example.com',
                smtp_port: 587,
                smtp_user: 'user@example.com',
                smtp_password: 'your-password',
                smtp_sender_email: 'noreply@example.com',
            };
            await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', 
                ['email_settings', JSON.stringify(defaultData)]);
            return defaultData;
        }
    } catch (error) {
        console.error("Failed to fetch email settings:", error);
        throw error;
    }
}

export async function updateEmailSettings(settings: Omit<EmailSettings, 'smtp_password'> & { smtp_password?: string }): Promise<void> {
    try {
        const rows = await db.query<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', ['email_settings']);
        let existingData: any = {};
        if (rows.length > 0) {
            existingData = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
        }

        const dataToUpdate: any = { ...settings };
        
        if (settings.smtp_password === '' || !settings.smtp_password) {
            dataToUpdate.smtp_password = existingData.smtp_password || '';
        }

        const mergedData = { ...existingData, ...dataToUpdate };
        
        await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', 
            ['email_settings', JSON.stringify(mergedData)]);
            
        revalidatePath('/admin/settings');
    } catch (error) {
        console.error("Failed to update email settings:", error);
        throw error;
    }
}
