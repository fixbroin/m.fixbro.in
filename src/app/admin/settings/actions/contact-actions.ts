
'use server';

import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { revalidatePath } from 'next/cache';

export interface ContactDetails {
    email: string;
    phone: string;
    location: string;
    whatsAppNumber: string;
    whatsAppMessage: string;
    enableFloatingButtons: boolean;
    buttonPosition: 'bottom-right' | 'bottom-left';
    animationStyle: 'none' | 'shake' | 'pulse' | 'bounce' | 'tada' | 'jello' | 'swing';
}

export async function getContactDetails(): Promise<ContactDetails> {
    try {
        const rows = await db.query<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', ['contact_details']);
        if (rows.length > 0) {
            const data = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
            return {
                email: data.email || 'fixbro.in@gmail.com',
                phone: data.phone || '+917353145565',
                location: data.location || 'Bengaluru, India',
                whatsAppNumber: data.whatsAppNumber || '917353145565',
                whatsAppMessage: data.whatsAppMessage || "Hi, I'm interested in your services.",
                enableFloatingButtons: data.enableFloatingButtons !== false, // default to true
                buttonPosition: data.buttonPosition || 'bottom-right',
                animationStyle: data.animationStyle || 'shake',
            };
        } else {
            const defaultData: ContactDetails = {
                email: 'fixbro.in@gmail.com',
                phone: '+917353145565',
                location: 'Bengaluru, India',
                whatsAppNumber: '917353145565',
                whatsAppMessage: "Hi, I'm interested in your services.",
                enableFloatingButtons: true,
                buttonPosition: 'bottom-right',
                animationStyle: 'shake',
            };
            await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', 
                ['contact_details', JSON.stringify(defaultData)]);
            return defaultData;
        }
    } catch (error) {
        console.error("Failed to fetch contact details:", error);
        throw error;
    }
}

export async function updateContactDetails(details: Partial<ContactDetails>): Promise<void> {
    try {
        const rows = await db.query<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', ['contact_details']);
        let existingData = {};
        if (rows.length > 0) {
            existingData = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
        }
        const mergedData = { ...existingData, ...details };
        
        await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', 
            ['contact_details', JSON.stringify(mergedData)]);
            
        revalidatePath('/contact');
        revalidatePath('/', 'layout'); // For footer and floating buttons
    } catch (error) {
        console.error("Failed to update contact details:", error);
        throw error;
    }
}
