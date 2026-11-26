import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export interface InternalPaymentSettings {
  razorpay_key_id: string;
  razorpay_key_secret: string;
  razorpay_webhook_secret: string;
  enable_online_payments: boolean;
  enable_pay_later: boolean;
}

export interface InternalEmailSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password?: string;
  smtp_sender_email: string;
}

/**
 * Server-only helper to read payment settings including secrets.
 * Never expose this directly as a 'use server' action.
 */
export async function getPaymentSettingsInternal(): Promise<InternalPaymentSettings> {
  const defaultData: InternalPaymentSettings = {
    razorpay_key_id: 'rzp_test_12345',
    razorpay_key_secret: 'your_secret_key',
    razorpay_webhook_secret: '',
    enable_online_payments: true,
    enable_pay_later: false,
  };

  try {
    const rows = await db.query<RowDataPacket[]>(
      'SELECT setting_value FROM settings WHERE setting_key = ?',
      ['payment_settings']
    );
    if (rows.length > 0) {
      const data =
        typeof rows[0].setting_value === 'string'
          ? JSON.parse(rows[0].setting_value)
          : rows[0].setting_value;
      return {
        razorpay_key_id: data.razorpay_key_id || '',
        razorpay_key_secret: data.razorpay_key_secret || '',
        razorpay_webhook_secret: data.razorpay_webhook_secret || '',
        enable_online_payments: data.enable_online_payments === true,
        enable_pay_later: data.enable_pay_later === true,
      };
    } else {
      await db.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
        ['payment_settings', JSON.stringify(defaultData)]
      );
      return defaultData;
    }
  } catch (error) {
    console.error('Failed to fetch payment settings:', error);
    return defaultData;
  }
}

/**
 * Server-only helper to read email settings including SMTP password.
 * Never expose this directly as a 'use server' action.
 */
export async function getEmailSettingsInternal(): Promise<InternalEmailSettings> {
  const rows = await db.query<RowDataPacket[]>(
    'SELECT setting_value FROM settings WHERE setting_key = ?',
    ['email_settings']
  );
  if (rows.length > 0) {
    const data =
      typeof rows[0].setting_value === 'string'
        ? JSON.parse(rows[0].setting_value)
        : rows[0].setting_value;
    return {
      ...data,
      smtp_port: Number(data.smtp_port) || 587,
      smtp_password: data.smtp_password || '',
    };
  }
  const defaultData: InternalEmailSettings = {
    smtp_host: 'smtp.example.com',
    smtp_port: 587,
    smtp_user: 'user@example.com',
    smtp_password: 'your-password',
    smtp_sender_email: 'noreply@example.com',
  };
  await db.query(
    'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
    ['email_settings', JSON.stringify(defaultData)]
  );
  return defaultData;
}
