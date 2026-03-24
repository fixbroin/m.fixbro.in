
'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface LegalPage {
    id?: string;
    title: string;
    slug: string;
    content: string;
}

export async function getLegalPages(): Promise<LegalPage[]> {
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
            return newRows.map((row: any) => ({ id: row.slug, ...row } as LegalPage));
        }

        return rows.map((row: any) => ({ id: row.slug, ...row } as LegalPage));
    } catch (error) {
        console.error('Failed to fetch legal pages:', error);
        return [];
    }
}

export async function getLegalPageContent(slug: string): Promise<LegalPage | null> {
    try {
        const rows: any = await db.query('SELECT * FROM legal_pages WHERE slug = ?', [slug]);
        if (rows && rows.length > 0) {
            const row = rows[0];
            return { id: row.slug, ...row } as LegalPage;
        }
        // If not found, check if it should exist and create it
        const pages = await getLegalPages();
        const pageExists = pages.find(p => p.slug === slug);
        if (pageExists) {
             return getLegalPageContent(slug);
        }
        return null;
    } catch (error) {
        console.error(`Failed to fetch content for slug ${slug}:`, error);
        return null;
    }
}

export async function updateLegalPageContent(page: { slug: string; content: string }): Promise<void> {
    try {
        await db.query(
            'UPDATE legal_pages SET content = ? WHERE slug = ?',
            [page.content, page.slug]
        );
        revalidatePath(`/${page.slug}`);
    } catch (error) {
        console.error(`Failed to update content for slug ${page.slug}:`, error);
        throw error;
    }
}
