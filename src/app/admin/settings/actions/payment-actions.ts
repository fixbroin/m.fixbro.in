
'use server';

import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { revalidatePath } from 'next/cache';

export interface PaymentSettings {
    razorpay_key_id: string;
    razorpay_key_secret: string;
    enable_online_payments: boolean;
    enable_pay_later: boolean;
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
    const defaultData: PaymentSettings = {
        razorpay_key_id: 'rzp_test_12345',
        razorpay_key_secret: 'your_secret_key',
        enable_online_payments: true,
        enable_pay_later: false,
    };

    try {
        const rows = await db.query<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', ['payment_settings']);
        if (rows.length > 0) {
            const data = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
            return {
                razorpay_key_id: data.razorpay_key_id || '',
                razorpay_key_secret: data.razorpay_key_secret || '',
                enable_online_payments: data.enable_online_payments === true,
                enable_pay_later: data.enable_pay_later === true,
            } as PaymentSettings;
        } else {
            await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', 
                ['payment_settings', JSON.stringify(defaultData)]);
            return defaultData;
        }
    } catch (error) {
        console.error('Failed to fetch payment settings:', error);
        return defaultData;
    }
}

export async function updatePaymentSettings(settings: PaymentSettings): Promise<void> {
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
