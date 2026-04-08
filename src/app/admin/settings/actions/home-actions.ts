'use server';

import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';
import { getSeoData, updateSeoData } from '../../seo-geo-settings/actions';

export interface HomePageContent {
    h1_title: string;
    paragraph: string;
    hero_media_url: string;
    hero_media_type: 'image' | 'video';
    hero_button1_text: string;
    hero_button1_link: string;
    hero_button2_text: string;
    hero_button2_link: string;
}

export const getHomePageContent = cache(async (): Promise<HomePageContent | null> => {
    return await unstable_cache(
        async () => {
            try {
                const seoData = await getSeoData('home');
                const rows = await db.query<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', ['home_page']);
                
                let data: any = {};
                if (rows.length > 0) {
                    data = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
                }

                return {
                    h1_title: seoData.h1_title || '',
                    paragraph: seoData.paragraph || '',
                    hero_media_url: data.hero_media_url || data.hero_image || 'https://placehold.co/800x600.png',
                    hero_media_type: data.hero_media_type || 'image',
                    hero_button1_text: data.hero_button1_text || 'Get Consultation',
                    hero_button1_link: data.hero_button1_link || '/contact',
                    hero_button2_text: data.hero_button2_text || 'View Portfolio',
                    hero_button2_link: data.hero_button2_link || '/portfolio',
                };
            } catch (error) {
                console.error('Failed to fetch home page content:', error);
                const seoData = await getSeoData('home');
                return {
                    h1_title: seoData.h1_title || '',
                    paragraph: seoData.paragraph || '',
                    hero_media_url: 'https://placehold.co/800x600.png',
                    hero_media_type: 'image',
                    hero_button1_text: 'Get Consultation',
                    hero_button1_link: '/contact',
                    hero_button2_text: 'View Portfolio',
                    hero_button2_link: '/portfolio',
                };
            }
        },
        ['home-page-content'],
        { tags: ['settings', 'home-page-content', 'seo-data-home'], revalidate: false }
    )();
});

export async function updateHomePageContent(content: HomePageContent): Promise<void> {
    try {
        // Update SEO data (H1 and Paragraph)
        const currentSeo = await getSeoData('home');
        await updateSeoData('home', {
            ...currentSeo,
            h1_title: content.h1_title,
            paragraph: content.paragraph,
        });

        // Update other home page settings
        const settingsToSave = {
            hero_media_url: content.hero_media_url,
            hero_media_type: content.hero_media_type,
            hero_button1_text: content.hero_button1_text,
            hero_button1_link: content.hero_button1_link,
            hero_button2_text: content.hero_button2_text,
            hero_button2_link: content.hero_button2_link,
        };

        await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', 
            ['home_page', JSON.stringify(settingsToSave)]);
            
        revalidateTag('home-page-content');
        revalidatePath('/'); // Revalidate the home page
    } catch (error) {
        console.error('Failed to update home page content:', error);
        throw error;
    }
}
