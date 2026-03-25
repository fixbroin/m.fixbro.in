'use server';

import db from '@/lib/db';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';
import { getSeoData, updateSeoData } from '../../seo-geo-settings/actions';

export interface LegalPage {
    id?: string;
    title: string;
    slug: string;
    content: string;
    h1_title?: string;
    paragraph?: string;
}

export const getLegalPages = cache(async (): Promise<LegalPage[]> => {
    return await unstable_cache(
        async () => {
            try {
                const rows: any = await db.query('SELECT * FROM legal_pages');

                if (!rows || rows.length === 0) {
                    const defaultPages: Omit<LegalPage, 'id'>[] = [
                        { title: 'Terms and Conditions', slug: 'terms', content: 'Please add your terms and conditions here.' },
                        { title: 'Privacy Policy', slug: 'privacy-policy', content: 'Please add your privacy policy here.' },
                        { title: 'Cancellation Policy', slug: 'cancellation-policy', content: 'Please add your cancellation policy here.' },
                        { title: 'Refund Policy', slug: 'refund-policy', content: 'Please add your refund policy here.' }
                    ];
                    for (const page of defaultPages) {
                        await db.query(
                            'INSERT INTO legal_pages (slug, title, content) VALUES (?, ?, ?)',
                            [page.slug, page.title, page.content]
                        );
                    }
                    const newRows: any = await db.query('SELECT * FROM legal_pages');
                    const pages = [];
                    for (const row of newRows) {
                        const seoData = await getSeoData(row.slug);
                        pages.push({ id: row.slug, ...row, h1_title: seoData.h1_title, paragraph: seoData.paragraph });
                    }
                    return pages;
                }

                const pages = [];
                for (const row of rows) {
                    const seoData = await getSeoData(row.slug);
                    pages.push({ id: row.slug, ...row, h1_title: seoData.h1_title, paragraph: seoData.paragraph });
                }
                return pages;
            } catch (error) {
                console.error('Failed to fetch legal pages:', error);
                return [];
            }
        },
        ['legal-pages'],
        { tags: ['legal-pages', 'seo-data'], revalidate: 86400 }
    )();
});

export const getLegalPageContent = cache(async (slug: string): Promise<LegalPage | null> => {
    return await unstable_cache(
        async () => {
            try {
                const rows: any = await db.query('SELECT * FROM legal_pages WHERE slug = ?', [slug]);
                if (rows && rows.length > 0) {
                    const row = rows[0];
                    const seoData = await getSeoData(slug);
                    return { id: row.slug, ...row, h1_title: seoData.h1_title, paragraph: seoData.paragraph } as LegalPage;
                }
                return null;
            } catch (error) {
                console.error(`Failed to fetch content for slug ${slug}:`, error);
                return null;
            }
        },
        [`legal-page-${slug}`],
        { tags: [`legal-page-${slug}`, 'legal-pages', `seo-data-${slug}`], revalidate: 86400 }
    )();
});

export async function updateLegalPageContent(page: { slug: string; title: string; content: string; h1_title: string; paragraph?: string }): Promise<void> {
    try {
        // Update SEO data
        const currentSeo = await getSeoData(page.slug);
        await updateSeoData(page.slug, {
            ...currentSeo,
            h1_title: page.h1_title,
            paragraph: page.paragraph || '',
        });

        await db.query(
            'UPDATE legal_pages SET title = ?, content = ? WHERE slug = ?',
            [page.title, page.content, page.slug]
        );
        
        revalidateTag('legal-pages');
        revalidateTag(`legal-page-${page.slug}`);
        revalidateTag(`seo-data-${page.slug}`);
        revalidatePath(`/${page.slug}`);
        revalidatePath('/', 'layout');
    } catch (error) {
        console.error(`Failed to update content for slug ${page.slug}:`, error);
        throw error;
    }
}
