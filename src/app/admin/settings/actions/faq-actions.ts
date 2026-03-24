
'use server';

import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';

export interface FaqItem {
    id?: string;
    question: string;
    answer: string;
    displayOrder: number;
    createdAt?: string;
}

export const getFaqs = cache(async (): Promise<FaqItem[]> => {
    return await unstable_cache(
        async () => {
            try {
                const rows: any = await db.query(
                    'SELECT * FROM faqs ORDER BY displayOrder ASC, createdAt ASC'
                );

                if (!rows || rows.length === 0) {
                    const defaultFaqs: Omit<FaqItem, 'id' | 'createdAt'>[] = [
                        {
                            question: 'What is the typical timeline for a new website?',
                            answer: 'A basic website typically takes 1-2 weeks. More complex projects like e-commerce stores or custom applications can take 4-8 weeks or more, depending on the requirements.',
                            displayOrder: 1,
                        },
                        {
                            question: 'Do you provide website hosting?',
                            answer: 'While we don\'t host websites directly, we deploy all our projects to Vercel, a world-class hosting platform. We can also help you configure your custom domain.',
                            displayOrder: 2,
                        },
                        {
                            question: 'What kind of support do you offer after the website is launched?',
                            answer: 'We offer one year of free technical support for all our projects. This includes bug fixes and assistance with any technical issues. We also offer paid maintenance plans for ongoing content updates and feature enhancements.',
                            displayOrder: 3,
                        },
                    ];

                    for (const faq of defaultFaqs) {
                        const id = uuidv4();
                        await db.query(
                            'INSERT INTO faqs (id, question, answer, displayOrder) VALUES (?, ?, ?, ?)',
                            [id, faq.question, faq.answer, faq.displayOrder]
                        );
                    }

                    const newRows: any = await db.query(
                        'SELECT * FROM faqs ORDER BY displayOrder ASC, createdAt ASC'
                    );
                    return newRows.map((row: any) => ({
                        ...row,
                        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString()
                    }));
                }
                
                return rows.map((row: any) => ({
                    ...row,
                    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString()
                }));
            } catch (error) {
                console.error('Failed to fetch FAQs:', error);
                return [];
            }
        },
        ['faqs-list'],
        { tags: ['settings', 'faqs-list'], revalidate: 86400 }
    )();
});

export async function updateFaqs(faqs: Omit<FaqItem, 'id' | 'createdAt'>[]): Promise<void> {
    try {
        // Delete all existing FAQs
        await db.query('DELETE FROM faqs');

        // Insert new FAQs
        for (const faq of faqs) {
            const id = uuidv4();
            await db.query(
                'INSERT INTO faqs (id, question, answer, displayOrder) VALUES (?, ?, ?, ?)',
                [id, faq.question, faq.answer, faq.displayOrder || 0]
            );
        }

        revalidateTag('faqs-list');
        revalidatePath('/');
    } catch (error) {
        console.error('Failed to update FAQs:', error);
        throw error;
    }
}
