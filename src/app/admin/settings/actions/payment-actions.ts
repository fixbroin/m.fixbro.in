
'use server';

import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { getPaymentSettingsInternal } from '@/lib/server-settings';

export interface PaymentSettings {
    razorpay_key_id: string;
    razorpay_key_secret: string;
    razorpay_webhook_secret: string;
    enable_online_payments: boolean;
    enable_pay_later: boolean;
}

export interface PublicPaymentSettings {
    razorpay_key_id: string;
    enable_online_payments: boolean;
    enable_pay_later: boolean;
}

export async function getPublicPaymentSettings(): Promise<PublicPaymentSettings> {
    const data = await getPaymentSettingsInternal();
    return {
        razorpay_key_id: data.razorpay_key_id,
        enable_online_payments: data.enable_online_payments,
        enable_pay_later: data.enable_pay_later,
    };
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
    await requireAdmin();
    return getPaymentSettingsInternal();
}

export async function updatePaymentSettings(settings: PaymentSettings): Promise<void> {
    await requireAdmin();
    try {
        const rows = await db.query<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', ['payment_settings']);
        let existingData: any = {};
        if (rows.length > 0) {
            existingData = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
        }

        const dataToUpdate: any = { ...settings };
        
        // If the user submits a blank secret, keep the existing one.
        if (!settings.razorpay_key_secret) {
            dataToUpdate.razorpay_key_secret = existingData.razorpay_key_secret || '';
        }
        
        if (!settings.razorpay_webhook_secret) {
            dataToUpdate.razorpay_webhook_secret = existingData.razorpay_webhook_secret || '';
        }

        const mergedData = { ...existingData, ...dataToUpdate };

        await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', 
            ['payment_settings', JSON.stringify(mergedData)]);
        
        revalidatePath('/pricing');
        revalidatePath('/admin/settings');
    } catch (error) {
        console.error('Failed to update payment settings:', error);
        throw error;
    }
}
