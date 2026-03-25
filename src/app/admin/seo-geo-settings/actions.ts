
'use server';

import db from '@/lib/db';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';
import { PageSeoContent, defaultSeoSettings } from '@/types/seo';
import { WEBSITE_URL } from '@/lib/config';

const defaultContent: Record<string, PageSeoContent> = {
    home: {
        ...defaultSeoSettings,
        canonical_url: WEBSITE_URL,
    },
    services: {
        h1_title: 'Full-Spectrum Interior Design Services',
        paragraph: 'From concept to final walkthrough, we provide comprehensive design services including space planning, renovation, and bespoke decor.',
        meta_title: 'Our Design Services | FixBro Interiors',
        meta_description: 'Explore our interior design services: Residential design, commercial interiors, kitchen renovations, and luxury decor consulting.',
        meta_keywords: 'interior design services, home renovation, space planning, kitchen design, office interiors',
        schema_type: 'ProfessionalService',
        canonical_url: `${WEBSITE_URL}/services`,
    },
    portfolio: {
        h1_title: 'Our Design Masterpieces',
        paragraph: 'Explore a gallery of our most stunning work, ranging from luxury residential homes to modern commercial spaces.',
        meta_title: 'Design Portfolio | FixBro Interiors Showcase',
        meta_description: 'View our latest design projects. See how we transform spaces into beautiful, functional works of art.',
        meta_keywords: 'design portfolio, interior design gallery, home renovation examples, commercial design showreel',
        schema_type: 'WebSite',
        canonical_url: `${WEBSITE_URL}/portfolio`,
    },
    pricing: {
        h1_title: 'Design Packages & Investment',
        paragraph: 'Transparent pricing for world-class interior design. We offer scalable packages tailored to your vision and budget.',
        meta_title: 'Design Packages | FixBro Interiors',
        meta_description: 'Find the right design package for your home or business. Professional consultation to full turnkey renovation rates.',
        meta_keywords: 'interior design cost, renovation price, design consultation packages',
        schema_type: 'WebSite',
        canonical_url: `${WEBSITE_URL}/pricing`,
    },
    about: {
        h1_title: 'Visionaries of Space & Style',
        paragraph: 'FixBro Interiors is a collective of visionary designers, architects, and craftsmen dedicated to creating exceptional living spaces.',
        meta_title: 'About FixBro Interiors | Our Vision & Craft',
        meta_description: 'Learn about FixBro Interiors, our passion for design excellence, and the team creating your dream spaces.',
        meta_keywords: 'about interior design firm, creative design team, interior designers bangalore',
        schema_type: 'Organization',
        canonical_url: `${WEBSITE_URL}/about`,
    },
    contact: {
        h1_title: 'Design Your Dream Space',
        paragraph: 'Ready to transform your home? Contact our design office today for a consultation or project quote.',
        meta_title: 'Contact Our Designers | FixBro Interiors',
        meta_description: 'Get in touch with FixBro Interiors for your next renovation project. Available for residential and commercial consultations.',
        meta_keywords: 'contact interior designer, hire design firm, renovation consultation',
        schema_type: 'LocalBusiness',
        canonical_url: `${WEBSITE_URL}/contact`,
    },
    'privacy-policy': {
        ...defaultSeoSettings,
        h1_title: 'Privacy Policy',
        meta_title: 'Privacy Policy | FixBro Interiors',
        canonical_url: `${WEBSITE_URL}/privacy-policy`,
    },
    'terms': {
        ...defaultSeoSettings,
        h1_title: 'Terms of Service',
        meta_title: 'Terms of Service | FixBro Interiors',
        canonical_url: `${WEBSITE_URL}/terms`,
    },
    'refund-policy': {
        ...defaultSeoSettings,
        h1_title: 'Refund Policy',
        meta_title: 'Refund Policy | FixBro Interiors',
        canonical_url: `${WEBSITE_URL}/refund-policy`,
    },
    'cancellation-policy': {
        ...defaultSeoSettings,
        h1_title: 'Cancellation Policy',
        meta_title: 'Cancellation Policy | FixBro Interiors',
        canonical_url: `${WEBSITE_URL}/cancellation-policy`,
    }
};

export const getSeoData = cache(async (pageSlug: string): Promise<PageSeoContent> => {
    return await unstable_cache(
        async () => {
            try {
                const rows: any = await db.query('SELECT * FROM page_seo WHERE slug = ?', [pageSlug]);

                if (rows && rows.length > 0) {
                    const row = rows[0];
                    return {
                        h1_title: row.h1_title ?? defaultSeoSettings.h1_title,
                        paragraph: row.paragraph ?? defaultSeoSettings.paragraph,
                        meta_title: row.title || defaultSeoSettings.meta_title,
                        meta_description: row.description || defaultSeoSettings.meta_description,
                        meta_keywords: row.keywords || defaultSeoSettings.meta_keywords,
                        og_image: row.ogImage || defaultSeoSettings.og_image,
                        schema_type: row.schema_type || defaultSeoSettings.schema_type,
                        canonical_url: row.canonical_url || (defaultContent[pageSlug]?.canonical_url || defaultSeoSettings.canonical_url),
                    };
                } else {
                    const initialData = defaultContent[pageSlug] || defaultSeoSettings;
                    // Auto-insert defaults if not found, making them editable in admin
                    await db.query(
                        'INSERT INTO page_seo (slug, title, description, keywords, ogImage, h1_title, paragraph, schema_type, canonical_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [
                            pageSlug, 
                            initialData.meta_title, 
                            initialData.meta_description, 
                            initialData.meta_keywords, 
                            initialData.og_image,
                            initialData.h1_title,
                            initialData.paragraph,
                            initialData.schema_type,
                            initialData.canonical_url
                        ]
                    );
                    return initialData;
                }
            } catch (error) {
                console.error(`Failed to fetch SEO data for ${pageSlug}:`, error);
                return defaultContent[pageSlug] || defaultSeoSettings;
            }
        },
        [`seo-data-${pageSlug}`],
        { tags: ['settings', 'seo-data', `seo-data-${pageSlug}`], revalidate: 86400 }
    )();
});

export async function updateSeoData(pageSlug: string, data: PageSeoContent): Promise<{ success: boolean; error?: string }> {
    try {
        await db.query(
            'INSERT INTO page_seo (slug, title, description, keywords, ogImage, h1_title, paragraph, schema_type, canonical_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title = ?, description = ?, keywords = ?, ogImage = ?, h1_title = ?, paragraph = ?, schema_type = ?, canonical_url = ?',
            [
                pageSlug, data.meta_title, data.meta_description, data.meta_keywords, data.og_image, data.h1_title, data.paragraph, data.schema_type, data.canonical_url,
                data.meta_title, data.meta_description, data.meta_keywords, data.og_image, data.h1_title, data.paragraph, data.schema_type, data.canonical_url
            ]
        );

        revalidateTag(`seo-data-${pageSlug}`);
        const pathToRevalidate = pageSlug === 'home' ? '/' : `/${pageSlug}`;
        revalidatePath(pathToRevalidate, 'page');
        revalidatePath(pathToRevalidate, 'layout');
        revalidatePath('/admin/seo-geo-settings');

        return { success: true };
    } catch (error) {
        console.error(`Failed to update SEO data for ${pageSlug}:`, error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}
