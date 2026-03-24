
'use server';

import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';

export interface HomePageContent {
    hero_media_url: string;
    hero_media_type: 'image' | 'video';
}

export const getHomePageContent = cache(async (): Promise<HomePageContent | null> => {
    return await unstable_cache(
        async () => {
            try {
                const rows = await db.query<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', ['home_page']);
                if (rows.length > 0) {
                    const data = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
                    return {
                        hero_media_url: data.hero_media_url || data.hero_image || 'https://placehold.co/800x600.png',
                        hero_media_type: data.hero_media_type || 'image',
                    };
                } else {
                    const defaultData: HomePageContent = {
                        hero_media_url: 'https://placehold.co/800x600.png',
                        hero_media_type: 'image',
                    };
                    await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', 
                        ['home_page', JSON.stringify(defaultData)]);
                    return defaultData;
                }
            } catch (error) {
                console.error('Failed to fetch home page content:', error);
                return {
                    hero_media_url: 'https://placehold.co/800x600.png',
                    hero_media_type: 'image',
                };
            }
        },
        ['home-page-content'],
        { tags: ['settings', 'home-page-content'], revalidate: 86400 }
    )();
});

export async function updateHomePageContent(content: HomePageContent): Promise<void> {
    try {
        const rows = await db.query<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', ['home_page']);
        let existingData = {};
        if (rows.length > 0) {
            existingData = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
        }
        
        const mergedData = { 
            ...existingData,
            hero_media_url: content.hero_media_url,
            hero_media_type: content.hero_media_type 
        };

        await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', 
            ['home_page', JSON.stringify(mergedData)]);
            
        revalidateTag('home-page-content');
        revalidatePath('/'); // Revalidate the home page
    } catch (error) {
        console.error('Failed to update home page content:', error);
        throw error;
    }
}
