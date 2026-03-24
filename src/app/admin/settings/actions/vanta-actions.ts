
'use server';

import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';
import type { VantaSettings } from '@/types/firestore';

const defaultSectionSettings = {
    enabled: false,
    effect: 'WAVES',
    color1: '#0055ff',
    color2: '#00aaff',
};

const defaultVantaSettings: VantaSettings = {
    globalEnable: true,
    sections: {
        hero: { ...defaultSectionSettings, enabled: true, effect: 'GLOBE' },
        services: { ...defaultSectionSettings },
        whyChooseUs: { ...defaultSectionSettings },
        portfolio: { ...defaultSectionSettings },
        pricing: { ...defaultSectionSettings },
        testimonials: { ...defaultSectionSettings },
        faq: { ...defaultSectionSettings },
        contact: { ...defaultSectionSettings },
        footer: { ...defaultSectionSettings },
    }
};

export const getVantaSettings = cache(async (): Promise<VantaSettings> => {
    return await unstable_cache(
        async () => {
            try {
                const rows = await db.query<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', ['vanta_settings']);
                if (rows.length > 0) {
                    const dbSettings = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
                    const settings = {
                        ...defaultVantaSettings,
                        ...dbSettings,
                        sections: {
                            ...defaultVantaSettings.sections,
                            ...dbSettings.sections,
                        },
                    };
                    return settings;
                } else {
                    await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', 
                        ['vanta_settings', JSON.stringify(defaultVantaSettings)]);
                    return defaultVantaSettings;
                }
            } catch (error) {
                console.error("Failed to fetch vanta settings:", error);
                return defaultVantaSettings;
            }
        },
        ['vanta-settings'],
        { tags: ['settings', 'vanta-settings'], revalidate: 86400 }
    )();
});

export async function updateVantaSettings(settings: VantaSettings): Promise<{ success: boolean; error?: string }> {
    try {
        const rows = await db.query<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', ['vanta_settings']);
        let existingData = {};
        if (rows.length > 0) {
            existingData = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
        }

        const mergedData = { ...existingData, ...settings };

        await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', 
            ['vanta_settings', JSON.stringify(mergedData)]);
            
        revalidateTag('vanta-settings');
        // Revalidate the entire site since vanta backgrounds can be on any page
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error("Failed to update vanta settings:", error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}
