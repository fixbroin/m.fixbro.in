'use server';

import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getSeoData, updateSeoData } from '../../seo-geo-settings/actions';

export interface Skill {
    id?: string;
    name: string;
    level: number;
}
export interface AboutPageContent {
    h1_title: string;
    paragraph: string;
    mission_title: string;
    mission_description: string;
    mission_image: string;
    stack_title: string;
    stack_description: string;
    skills: Skill[];
}

export async function getAboutPageContent(): Promise<AboutPageContent | null> {
    try {
        const seoData = await getSeoData('about');
        const settingsResult = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', ['about_page']);
        let aboutData: any = {};

        if (settingsResult.length > 0) {
            aboutData = typeof settingsResult[0].setting_value === 'string' 
                ? JSON.parse(settingsResult[0].setting_value) 
                : settingsResult[0].setting_value;
        }

        const skills = await db.query('SELECT * FROM skills ORDER BY createdAt ASC');

        return { 
            h1_title: seoData.h1_title || '',
            paragraph: seoData.paragraph || '',
            mission_title: aboutData.mission_title || 'Our Mission',
            mission_description: aboutData.mission_description || 'At CineElite ADS, our mission is to empower businesses...',
            mission_image: aboutData.mission_image || 'https://placehold.co/600x800.png',
            stack_title: aboutData.stack_title || 'Our Tech Stack',
            stack_description: aboutData.stack_description || 'We use a modern, robust tech stack...',
            skills: skills.length > 0 ? skills : [
                { id: uuidv4(), name: 'Next.js', level: 90 },
                { id: uuidv4(), name: 'React', level: 95 },
                { id: uuidv4(), name: 'MySQL', level: 85 }
            ]
        };

    } catch (error) {
        console.error('Failed to fetch about page content:', error);
        const seoData = await getSeoData('about');
        return {
            h1_title: seoData.h1_title || '',
            paragraph: seoData.paragraph || '',
            mission_title: 'Our Mission',
            mission_description: 'At CineElite ADS, our mission is to empower businesses...',
            mission_image: 'https://placehold.co/600x800.png',
            stack_title: 'Our Tech Stack',
            stack_description: 'We use a modern, robust tech stack...',
            skills: [
                { id: uuidv4(), name: 'Next.js', level: 90 },
                { id: uuidv4(), name: 'React', level: 95 },
                { id: uuidv4(), name: 'MySQL', level: 85 }
            ]
        };
    }
}

export async function updateAboutPageContent(content: AboutPageContent): Promise<void> {
    try {
        // Update SEO data (H1 and Paragraph)
        const currentSeo = await getSeoData('about');
        await updateSeoData('about', {
            ...currentSeo,
            h1_title: content.h1_title,
            paragraph: content.paragraph,
        });

        const { skills, h1_title, paragraph, ...aboutData } = content;
        
        // Update main content in settings table
        await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', 
            ['about_page', JSON.stringify(aboutData), JSON.stringify(aboutData)]);

        // Sync skills: Delete all and re-insert
        await db.query('DELETE FROM skills');

        for (const skill of skills) {
            if (skill.name) {
                await db.query('INSERT INTO skills (id, name, level) VALUES (?, ?, ?)', 
                    [uuidv4(), skill.name, skill.level || 0]);
            }
        }

        revalidateTag('seo-data-about');
        revalidatePath('/about');
        revalidatePath('/admin/settings');
    } catch (error) {
        console.error('Failed to update about page content:', error);
        throw error;
    }
}
