
'use server';

import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';

export interface GeneralSettings {
    website_name: string;
    logo: string;
    favicon: string;
    footer_description: string;
    facebook_url: string;
    instagram_url: string;
    twitter_url: string;
    linkedin_url: string;
    youtube_url: string;
    loaderType: string;
}

export const getGeneralSettings = cache(async (): Promise<GeneralSettings> => {
    return await unstable_cache(
        async () => {
            try {
                const rows = await db.query<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', ['general_settings']);
                if (rows.length > 0) {
                    const data = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
                    return {
                        website_name: data.website_name || 'CineElite ADS',
                        logo: data.logo || '',
                        favicon: data.favicon || '/favicon.ico',
                        footer_description: data.footer_description || 'Redefining advertising through cinematic excellence and high-impact visual storytelling.',
                        facebook_url: data.facebook_url || '',
                        instagram_url: data.instagram_url || '',
                        twitter_url: data.twitter_url || '',
                        linkedin_url: data.linkedin_url || '',
                        youtube_url: data.youtube_url || '',
                        loaderType: data.loaderType || 'pulse',
                    };
                } else {
                    const defaultData: GeneralSettings = {
                        website_name: 'CineElite ADS',
                        logo: '',
                        favicon: '/favicon.ico',
                        footer_description: 'Redefining advertising through cinematic excellence and high-impact visual storytelling.',
                        facebook_url: '',
                        instagram_url: '',
                        twitter_url: '',
                        linkedin_url: '',
                        youtube_url: '',
                        loaderType: 'pulse',
                    };
                    await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', 
                        ['general_settings', JSON.stringify(defaultData)]);
                    return defaultData;
                }
            } catch (error) {
                console.error("Failed to fetch general settings:", error);
                return {
                    website_name: 'CineElite ADS',
                    logo: '',
                    favicon: '/favicon.ico',
                    footer_description: 'Redefining advertising through cinematic excellence and high-impact visual storytelling.',
                    facebook_url: '',
                    instagram_url: '',
                    twitter_url: '',
                    linkedin_url: '',
                    youtube_url: '',
                    loaderType: 'pulse',
                };
            }
        },
        ['general-settings'],
        { tags: ['settings', 'general-settings'], revalidate: 86400 }
    )();
});

export async function updateGeneralSettings(settings: GeneralSettings): Promise<void> {
    try {
        const rows = await db.query<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', ['general_settings']);
        let existingData = {};
        if (rows.length > 0) {
            existingData = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
        }
        const mergedData = { ...existingData, ...settings };

        await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', 
            ['general_settings', JSON.stringify(mergedData)]);
            
        revalidateTag('general-settings');
        revalidatePath('/', 'layout');
    } catch (error) {
        console.error("Failed to update general settings:", error);
        throw error;
    }
}
