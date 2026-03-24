
'use server';

import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';
import type { ThemeColors, GlobalWebSettings } from '@/types/firestore';

export const getThemeSettings = cache(async (): Promise<ThemeColors | null> => {
    return await unstable_cache(
        async () => {
            try {
                console.log('🔄 Fetching theme settings from MySQL...');
                const rows = await db.query<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', ['theme_settings']);
                if (rows.length > 0) {
                    const data = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
                    console.log('✅ Theme settings found.');
                    return (data as GlobalWebSettings).themeColors || null;
                }
                console.log('ℹ️ No theme settings found in MySQL.');
                return null;
            } catch (error) {
                console.error("❌ Failed to fetch theme settings:", error);
                return null;
            }
        },
        ['theme-settings-data'],
        { tags: ['settings', 'theme-settings'], revalidate: 86400 }
    )();
});

export async function updateThemeSettings(themeColors: ThemeColors): Promise<void> {
    try {
        console.log('💾 Updating theme settings in MySQL...');
        const rows = await db.query<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', ['theme_settings']);
        let existingData = {};
        if (rows.length > 0) {
            existingData = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
        }

        const mergedData = { 
            ...existingData, 
            themeColors: themeColors, 
            updatedAt: new Date().toISOString() 
        };

        await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', 
            ['theme_settings', JSON.stringify(mergedData)]);

        console.log('✨ Theme settings saved. Invalidating cache...');
        revalidateTag('theme-settings');
        revalidatePath('/', 'layout');
        console.log('🚀 Cache invalidated.');

    } catch (error) {
        console.error("❌ Failed to update theme settings:", error);
        throw new Error('Could not update theme settings.');
    }
}
