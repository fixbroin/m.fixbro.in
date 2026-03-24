'use server';

import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';

export interface WhyChooseUsFeature {
    id?: string;
    icon: string;
    title: string;
    description: string;
    createdAt?: string;
}

export interface WhyChooseUsContent {
    title: string;
    subtitle: string;
    media_url: string;
    media_type: 'image' | 'video';
    features: WhyChooseUsFeature[];
}

export const getWhyChooseUsContent = cache(async (): Promise<WhyChooseUsContent> => {
    return await unstable_cache(
        async () => {
            try {
                const settingsResult = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', ['why_choose_us']);
                let contentData: Omit<WhyChooseUsContent, 'features'>;

                if (settingsResult.length > 0) {
                    contentData = typeof settingsResult[0].setting_value === 'string'
                        ? JSON.parse(settingsResult[0].setting_value)
                        : settingsResult[0].setting_value;
                } else {
                    contentData = {
                        title: 'Why Choose CineElite ADS?',
                        subtitle: 'We are committed to delivering excellence and innovation in every project.',
                        media_url: 'https://placehold.co/600x800.png',
                        media_type: 'image'
                    };
                    await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)', ['why_choose_us', JSON.stringify(contentData)]);
                }

                const features = await db.query('SELECT * FROM why_choose_us_features ORDER BY createdAt ASC');
                
                const formattedFeatures: WhyChooseUsFeature[] = features.map((f: any) => ({
                    ...f,
                    createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : f.createdAt
                }));

                if (formattedFeatures.length === 0) {
                    const defaultFeatures = [
                        { id: uuidv4(), icon: 'Zap', title: 'Blazing Fast Performance', description: 'We build websites with Next.js for optimal speed and user experience.' },
                        { id: uuidv4(), icon: 'Smartphone', title: 'Fully Responsive Design', description: 'Your website will look perfect on all devices, from desktops to smartphones.' },
                        { id: uuidv4(), icon: 'Search', title: 'SEO-Optimized', description: 'Built-in SEO best practices to help you rank higher on search engines.' },
                        { id: uuidv4(), icon: 'CircleCheckBig', title: 'Modern Tech Stack', description: 'Leveraging the power of React, Next.js, and Tailwind CSS for robust solutions.' },
                    ];
                    for (const feature of defaultFeatures) {
                        await db.query('INSERT INTO why_choose_us_features (id, icon, title, description) VALUES (?, ?, ?, ?)', 
                            [feature.id, feature.icon, feature.title, feature.description]);
                    }
                    return { ...contentData, features: defaultFeatures.map(f => ({ ...f, createdAt: new Date().toISOString() })) };
                }

                return { ...contentData, features: formattedFeatures };

            } catch (error) {
                console.error('Failed to fetch Why Choose Us content:', error);
                return {
                    title: 'Why Choose CineElite ADS?',
                    subtitle: 'We are committed to delivering excellence and innovation in every project.',
                    media_url: 'https://placehold.co/600x800.png',
                    media_type: 'image',
                    features: [
                        { id: uuidv4(), icon: 'Zap', title: 'Blazing Fast Performance', description: 'We build websites with Next.js for optimal speed and user experience.' },
                        { id: uuidv4(), icon: 'Smartphone', title: 'Fully Responsive Design', description: 'Your website will look perfect on all devices, from desktops to smartphones.' },
                        { id: uuidv4(), icon: 'Search', title: 'SEO-Optimized', description: 'Built-in SEO best practices to help you rank higher on search engines.' },
                        { id: uuidv4(), icon: 'CircleCheckBig', title: 'Modern Tech Stack', description: 'Leveraging the power of React, Next.js, and Tailwind CSS for robust solutions.' },
                    ].map(f => ({ ...f, createdAt: new Date().toISOString() }))
                };
            }
        },
        ['why-choose-us-content'],
        { tags: ['settings', 'why-choose-us-content'], revalidate: 86400 }
    )();
});

export async function updateWhyChooseUsContent(content: Omit<WhyChooseUsContent, 'features'> & { features: Omit<WhyChooseUsFeature, 'id' | 'createdAt'>[] }): Promise<void> {
    try {
        const { features, ...pageData } = content;
        
        await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
            ['why_choose_us', JSON.stringify(pageData), JSON.stringify(pageData)]);

        await db.query('DELETE FROM why_choose_us_features');

        for (const feature of features) {
            await db.query('INSERT INTO why_choose_us_features (id, icon, title, description) VALUES (?, ?, ?, ?)',
                [uuidv4(), feature.icon, feature.title, feature.description]);
        }

        revalidateTag('why-choose-us-content');
        revalidatePath('/');
        revalidatePath('/admin/settings');
    } catch (error) {
        console.error('Failed to update Why Choose Us content:', error);
        throw error;
    }
}
