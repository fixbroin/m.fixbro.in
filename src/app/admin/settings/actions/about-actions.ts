'use server';

import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

export interface Skill {
    id?: string;
    name: string;
    level: number;
}
export interface AboutPageContent {
    mission_title: string;
    mission_description: string;
    mission_image: string;
    stack_title: string;
    stack_description: string;
    skills: Skill[];
}

export async function getAboutPageContent(): Promise<AboutPageContent | null> {
    try {
        const settingsResult = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', ['about_page']);
        let aboutData: Omit<AboutPageContent, 'skills'>;

        if (settingsResult.length > 0) {
            aboutData = typeof settingsResult[0].setting_value === 'string' 
                ? JSON.parse(settingsResult[0].setting_value) 
                : settingsResult[0].setting_value;
        } else {
            aboutData = {
                mission_title: 'Our Mission',
                mission_description: 'At CineElite ADS, our mission is to empower businesses...',
                mission_image: 'https://placehold.co/600x800.png',
                stack_title: 'Our Tech Stack',
                stack_description: 'We use a modern, robust tech stack...',
            };
            await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)', ['about_page', JSON.stringify(aboutData)]);
        }

        const skills = await db.query('SELECT * FROM skills ORDER BY createdAt ASC');

        if (skills.length === 0) {
            // Seed default skills
            const defaultSkills = [
                { id: uuidv4(), name: 'Next.js', level: 90 },
                { id: uuidv4(), name: 'React', level: 95 },
                { id: uuidv4(), name: 'MySQL', level: 85 }
            ];
            for (const skill of defaultSkills) {
                await db.query('INSERT INTO skills (id, name, level) VALUES (?, ?, ?)', [skill.id, skill.name, skill.level]);
            }
            return { ...aboutData, skills: defaultSkills };
        }

        return { ...aboutData, skills };

    } catch (error) {
        console.error('Failed to fetch about page content:', error);
        return {
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
        const { skills, ...aboutData } = content;
        
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

        revalidatePath('/about');
        revalidatePath('/admin/settings');
    } catch (error) {
        console.error('Failed to update about page content:', error);
        throw error;
    }
}
