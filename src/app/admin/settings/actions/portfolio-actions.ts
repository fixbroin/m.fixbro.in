'use server';

import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';
import { getSeoData, updateSeoData } from '../../seo-geo-settings/actions';

export interface PortfolioItem {
    id?: string;
    title: string;
    category: string;
    mediaType: 'image' | 'video';
    mediaUrl: string;
    link?: string;
    displayOrder: number;
    createdAt?: string;
}

export interface PortfolioPageContent {
    h1_title: string;
    paragraph: string;
    title: string;
    subtitle: string;
}

export const getPortfolioPageContent = cache(async (): Promise<PortfolioPageContent> => {
    return await unstable_cache(
        async () => {
            try {
                const seoData = await getSeoData('portfolio');
                const settingsResult = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', ['portfolio_page']);
                
                let data: any = {};
                if (settingsResult.length > 0) {
                    data = typeof settingsResult[0].setting_value === 'string'
                        ? JSON.parse(settingsResult[0].setting_value)
                        : settingsResult[0].setting_value;
                }

                return {
                    h1_title: seoData.h1_title || '',
                    paragraph: seoData.paragraph || '',
                    title: data.title || 'Our Recent Work',
                    subtitle: data.subtitle || 'Check out some of the stunning websites we\'ve delivered to our clients.',
                };
            } catch (error) {
                console.error("Failed to fetch portfolio page content:", error);
                const seoData = await getSeoData('portfolio');
                return {
                    h1_title: seoData.h1_title || '',
                    paragraph: seoData.paragraph || '',
                    title: 'Our Recent Work',
                    subtitle: 'Check out some of the stunning websites we\'ve delivered to our clients.',
                };
            }
        },
        ['portfolio-page-content'],
        { tags: ['settings', 'portfolio-page-content', 'seo-data-portfolio'], revalidate: 86400 }
    )();
});

export async function updatePortfolioPageContent(content: PortfolioPageContent): Promise<void> {
    try {
        // Update SEO data (H1 and Paragraph)
        const currentSeo = await getSeoData('portfolio');
        await updateSeoData('portfolio', {
            ...currentSeo,
            h1_title: content.h1_title,
            paragraph: content.paragraph,
        });

        const { h1_title, paragraph, ...settingsToSave } = content;

        await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
            ['portfolio_page', JSON.stringify(settingsToSave), JSON.stringify(settingsToSave)]);
            
        revalidateTag('portfolio-page-content');
        revalidateTag('seo-data-portfolio');
        revalidatePath('/'); // For home page portfolio section
        revalidatePath('/portfolio');
    } catch (error) {
        console.error('Failed to update portfolio page content:', error);
        throw error;
    }
}

export const getPortfolioItems = cache(async (): Promise<PortfolioItem[]> => {
    return await unstable_cache(
        async () => {
            try {
                // We use imageUrl as mediaUrl for compatibility with the schema
                const items = await db.query('SELECT *, imageUrl as mediaUrl FROM portfolio_items ORDER BY displayOrder ASC, createdAt ASC');

                return items.map((item: any) => ({
                    ...item,
                    mediaType: item.mediaType || 'image',
                    displayOrder: item.displayOrder || 0,
                    createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt
                }));
            } catch (error) {
                console.error('Failed to fetch portfolio items:', error);
                return [];
            }
        },
        ['portfolio-items'],
        { tags: ['settings', 'portfolio-items'], revalidate: 86400 }
    )();
});

export async function updatePortfolioItems(items: Omit<PortfolioItem, 'id' | 'createdAt'>[]): Promise<void> {
    try {
        await db.query('DELETE FROM portfolio_items');

        for (const item of items) {
            await db.query('INSERT INTO portfolio_items (id, title, category, imageUrl, mediaType, link, displayOrder) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [uuidv4(), item.title, item.category, item.mediaUrl, item.mediaType, item.link || null, item.displayOrder]);
        }
        
        revalidateTag('portfolio-items');
        revalidatePath('/portfolio');
        revalidatePath('/');
    } catch (error) {
        console.error('Failed to update portfolio items:', error);
        throw error;
    }
}
