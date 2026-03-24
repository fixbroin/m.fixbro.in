
'use server';

import db from '@/lib/db';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';
import { PageSeoContent, defaultSeoSettings } from '@/types/seo';

const defaultContent: Record<string, PageSeoContent> = {
    home: {
        ...defaultSeoSettings,
    },
    services: {
        h1_title: 'Full-Spectrum Video Production Services',
        paragraph: 'From concept to final cut, we provide comprehensive production services including TVCs, product shoots, and corporate documentaries.',
        meta_title: 'Our Production Services | CineElite ADS',
        meta_description: 'Explore our video production services: Ad filmmaking, corporate brand films, social media content, and high-end post-production.',
        meta_keywords: 'ad filmmaking, corporate videos, product videography, post production services',
        schema_type: 'ProfessionalService',
    },
    portfolio: {
        h1_title: 'Our Cinematic Masterpieces',
        paragraph: 'Explore a gallery of our most impactful work, ranging from high-budget TV commercials to viral digital campaigns.',
        meta_title: 'Production Portfolio | CineElite ADS Showcase',
        meta_description: 'Watch our latest ad films and commercials. See how we help brands tell their stories through high-end cinematic visuals.',
        meta_keywords: 'video portfolio, ad showreel, commercial examples, cinematic work',
        schema_type: 'WebSite',
    },
    pricing: {
        h1_title: 'Production Packages & Investment',
        paragraph: 'Transparent pricing for world-class video production. We offer scalable packages tailored to your brand’s marketing goals.',
        meta_title: 'Video Production Pricing | CineElite ADS',
        meta_description: 'Find the right production package for your business. Affordable to premium ad film production rates and packages.',
        meta_keywords: 'video production cost, ad film price, corporate video packages',
        schema_type: 'WebSite',
    },
    about: {
        h1_title: 'Visionaries Behind the Lens',
        paragraph: 'CineElite ADS is a collective of storytellers, directors, and artists dedicated to pushing the boundaries of visual advertising.',
        meta_title: 'About CineElite ADS | Our Story & Vision',
        meta_description: 'Learn about CineElite ADS, our mission to redefine advertising through cinema, and the team driving our creative success.',
        meta_keywords: 'about video production company, creative agency team, film directors bangalore',
        schema_type: 'Organization',
    },
    contact: {
        h1_title: 'Pitch Your Next Big Idea',
        paragraph: 'Ready to create something legendary? Contact our production office today for a consultation or project quote.',
        meta_title: 'Contact Our Studio | CineElite ADS',
        meta_description: 'Get in touch with CineElite ADS for your next video production project. Available for global commissions and local shoots.',
        meta_keywords: 'contact ad agency, hire video production, film studio contact',
        schema_type: 'LocalBusiness',
    },
};

export const getSeoData = cache(async (pageSlug: string): Promise<PageSeoContent> => {
    return await unstable_cache(
        async () => {
            try {
                const rows: any = await db.query('SELECT * FROM page_seo WHERE slug = ?', [pageSlug]);

                if (rows && rows.length > 0) {
                    const row = rows[0];
                    return {
                        h1_title: row.h1_title || defaultSeoSettings.h1_title,
                        paragraph: row.paragraph || defaultSeoSettings.paragraph,
                        meta_title: row.title || defaultSeoSettings.meta_title,
                        meta_description: row.description || defaultSeoSettings.meta_description,
                        meta_keywords: row.keywords || defaultSeoSettings.meta_keywords,
                        og_image: row.ogImage || defaultSeoSettings.og_image,
                        schema_type: row.schema_type || defaultSeoSettings.schema_type,
                        canonical_url: row.canonical_url || defaultSeoSettings.canonical_url,
                    };
                } else {
                    const initialData = defaultContent[pageSlug] || defaultSeoSettings;
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
