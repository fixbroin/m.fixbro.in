
'use server';

import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';

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
    title: string;
    subtitle: string;
}

export const getServicesPageContent = cache(async (): Promise<ServicesPageContent> => {
    return await unstable_cache(
        async () => {
            try {
                const rows: any = await db.query(
                    'SELECT setting_value FROM settings WHERE setting_key = ?',
                    ['services_page']
                );
                
                if (rows && rows.length > 0) {
                    const settingValue = rows[0].setting_value;
                    return (typeof settingValue === 'string' ? JSON.parse(settingValue) : settingValue) as ServicesPageContent;
                } else {
                    const defaultData: ServicesPageContent = {
                        title: 'Our Services',
                        subtitle: 'We offer a wide range of web development services to meet your business needs.',
                    };
                    await db.query(
                        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                        ['services_page', JSON.stringify(defaultData), JSON.stringify(defaultData)]
                    );
                    return defaultData;
                }
            } catch (error) {
                console.error("Failed to fetch services page content:", error);
                return {
                    title: 'Our Services',
                    subtitle: 'We offer a wide range of web development services to meet your business needs.',
                };
            }
        },
        ['services-page-content'],
        { tags: ['settings', 'services-page-content'], revalidate: 86400 }
    )();
});

export async function updateServicesPageContent(content: ServicesPageContent): Promise<void> {
    try {
        await db.query(
            'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
            ['services_page', JSON.stringify(content), JSON.stringify(content)]
        );
        revalidateTag('services-page-content');
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
        { tags: ['settings', 'services-list'], revalidate: 86400 }
    )();
});

export async function updateServices(services: Omit<Service, 'id' | 'createdAt'>[]): Promise<void> {
    try {
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
