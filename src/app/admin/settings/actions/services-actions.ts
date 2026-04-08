'use server';

import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';
import { getSeoData, updateSeoData } from '../../seo-geo-settings/actions';
import { deleteFile } from '@/lib/storage-actions';

export interface ServiceFeature {
    id?: string;
    name: string;
}
export interface Service {
    id?: string;
    icon: string;
    title: string;
    price: string;
    description: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    features: ServiceFeature[];
    displayOrder: number;
    createdAt?: string;
}

export interface ServicesPageContent {
    h1_title: string;
    paragraph: string;
    title: string;
    subtitle: string;
}

export const getServicesPageContent = cache(async (): Promise<ServicesPageContent> => {
    return await unstable_cache(
        async () => {
            try {
                const seoData = await getSeoData('services');
                const rows: any = await db.query(
                    'SELECT setting_value FROM settings WHERE setting_key = ?',
                    ['services_page']
                );
                
                let data: any = {};
                if (rows && rows.length > 0) {
                    const settingValue = rows[0].setting_value;
                    data = typeof settingValue === 'string' ? JSON.parse(settingValue) : settingValue;
                }

                return {
                    h1_title: seoData.h1_title || '',
                    paragraph: seoData.paragraph || '',
                    title: data.title || 'Our Services',
                    subtitle: data.subtitle || 'We offer a wide range of web development services to meet your business needs.',
                };
            } catch (error) {
                console.error("Failed to fetch services page content:", error);
                const seoData = await getSeoData('services');
                return {
                    h1_title: seoData.h1_title || '',
                    paragraph: seoData.paragraph || '',
                    title: 'Our Services',
                    subtitle: 'We offer a wide range of web development services to meet your business needs.',
                };
            }
        },
        ['services-page-content'],
        { tags: ['settings', 'services-page-content', 'seo-data-services'], revalidate: false }
    )();
});

export async function updateServicesPageContent(content: ServicesPageContent): Promise<void> {
    try {
        // Update SEO data (H1 and Paragraph)
        const currentSeo = await getSeoData('services');
        await updateSeoData('services', {
            ...currentSeo,
            h1_title: content.h1_title,
            paragraph: content.paragraph,
        });

        const { h1_title, paragraph, ...settingsToSave } = content;

        await db.query(
            'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
            ['services_page', JSON.stringify(settingsToSave), JSON.stringify(settingsToSave)]
        );
        revalidateTag('services-page-content');
        revalidateTag('seo-data-services');
        revalidatePath('/services');
        revalidatePath('/');
    } catch (error) {
        console.error('Failed to update services page content:', error);
        throw error;
    }
}


export const getServices = cache(async (): Promise<Service[]> => {
    return await unstable_cache(
        async () => {
            try {
                const rows: any = await db.query(
                    'SELECT * FROM services ORDER BY displayOrder ASC, createdAt ASC'
                );

                if(!rows || rows.length === 0) {
                    const defaultServices = [{
                        icon: 'Briefcase',
                        title: 'Business Websites', 
                        price: 'Starting at ₹4999', 
                        description: 'A professional online presence is crucial. We build beautiful, fast, and secure websites that represent your brand and attract customers.', 
                        mediaUrl: 'https://placehold.co/600x400.png', 
                        mediaType: 'image' as const,
                        features: [{ name: 'Custom Design' }, { name: 'Mobile-Friendly' }],
                        displayOrder: 1,
                    }];
                    
                    for (const service of defaultServices) {
                        const id = uuidv4();
                        await db.query(
                            'INSERT INTO services (id, icon, title, price, description, mediaUrl, mediaType, features, displayOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                            [id, service.icon, service.title, service.price, service.description, service.mediaUrl, service.mediaType, JSON.stringify(service.features), service.displayOrder]
                        );
                    }
                    
                    const newRows: any = await db.query(
                        'SELECT * FROM services ORDER BY displayOrder ASC, createdAt ASC'
                    );
                    return newRows.map((row: any) => ({
                        ...row,
                        features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features,
                        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString()
                    }));
                }

                return rows.map((row: any) => ({
                    ...row,
                    features: row.features ? (typeof row.features === 'string' ? JSON.parse(row.features) : row.features) : [],
                    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString()
                }));
            } catch (error) {
                console.error('Failed to fetch services:', error);
                return [];
            }
        },
        ['services-list'],
        { tags: ['settings', 'services-list'], revalidate: false }
    )();
});

export async function updateServices(services: Omit<Service, 'id' | 'createdAt'>[]): Promise<void> {
    try {
        // Get existing services to check for files to delete
        const oldServices = await getServices();
        const newUrls = new Set(services.map(s => s.mediaUrl).filter(Boolean));

        for (const old of oldServices) {
            if (old.mediaUrl && !newUrls.has(old.mediaUrl)) {
                await deleteFile(old.mediaUrl);
            }
        }

        // Delete all existing services
        await db.query('DELETE FROM services');

        // Insert new services
        for (const service of services) {
            const id = uuidv4();
            await db.query(
                'INSERT INTO services (id, icon, title, price, description, mediaUrl, mediaType, features, displayOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id, service.icon, service.title, service.price, service.description, service.mediaUrl, service.mediaType, JSON.stringify(service.features), service.displayOrder]
            );
        }

        revalidateTag('services-list');
        revalidatePath('/services');
        revalidatePath('/');
    } catch (error) {
        console.error('Failed to update services:', error);
        throw error;
    }
}
