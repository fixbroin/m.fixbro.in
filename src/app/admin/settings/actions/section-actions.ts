
'use server';

import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';

export interface SectionSettings {
    // Error Section
    error_title: string;
    error_subtitle: string;
    error_button1_text: string;
    error_button1_link: string;
    error_button2_text: string;
    error_button2_link: string;

    // Review Section
    review_title: string;
    review_subtitle: string;

    // FAQ Section
    faq_badge: string;
    faq_title: string;
    faq_subtitle: string;

    // Contact Section (Shared)
    contact_badge: string;
    contact_title: string;
    contact_description: string;
    contact_h1: string;
    contact_h1_paragraph: string;
    contact_form_title: string;
    contact_form_button: string;

    // Footer CTA
    footer_cta_title: string;
    footer_cta_description: string;
    footer_cta_button: string;
    footer_copyright_text: string;
}

export const getSectionSettings = cache(async (): Promise<SectionSettings> => {
    return await unstable_cache(
        async () => {
            try {
                const rows = await db.query<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', ['section_settings']);
                if (rows.length > 0) {
                    const data = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
                    return {
                        error_title: data.error_title || '404 - Page Not Found',
                        error_subtitle: data.error_subtitle || "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
                        error_button1_text: data.error_button1_text || 'Back to Home',
                        error_button1_link: data.error_button1_link || '/',
                        error_button2_text: data.error_button2_text || 'Contact Support',
                        error_button2_link: data.error_button2_link || '/contact',

                        review_title: data.review_title || 'Customer Reviews',
                        review_subtitle: data.review_subtitle || 'See what our customers say about our interior work, quality, and service experience.',

                        faq_badge: data.faq_badge || 'Support Center',
                        faq_title: data.faq_title || 'Frequently Asked Questions',
                        faq_subtitle: data.faq_subtitle || 'Get answers to common questions about our interior services, pricing, and project process.',

                        contact_badge: data.contact_badge || 'Get in Touch',
                        contact_title: data.contact_title || 'Start Your Home Interior Project',
                        contact_description: data.contact_description || 'Looking to upgrade your home? Get expert interior solutions including modular kitchen, wardrobes, furniture, and complete home interiors. Contact us for a free site visit and quotation.',
                        contact_h1: data.contact_h1 || 'Contact Our Design Experts',
                        contact_h1_paragraph: data.contact_h1_paragraph || 'Have a project in mind? Let\'s discuss how we can transform your space.',
                        contact_form_title: data.contact_form_title || 'Book Consultation',
                        contact_form_button: data.contact_form_button || 'Book Site Visit',

                        footer_cta_title: data.footer_cta_title || 'Transform Your Home Interiors Today.',
                        footer_cta_description: data.footer_cta_description || 'Book a consultation and get expert guidance for your modular kitchen, wardrobes, and complete home interiors.',
                        footer_cta_button: data.footer_cta_button || 'Book Site Visit',
                        footer_copyright_text: data.footer_copyright_text || 'Engineered with precision.',
                    };
                } else {
                    const defaultData: SectionSettings = {
                        error_title: '404 - Page Not Found',
                        error_subtitle: "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
                        error_button1_text: 'Back to Home',
                        error_button1_link: '/',
                        error_button2_text: 'Contact Support',
                        error_button2_link: '/contact',
                        review_title: 'Customer Reviews',
                        review_subtitle: 'See what our customers say about our interior work, quality, and service experience.',
                        faq_badge: 'Support Center',
                        faq_title: 'Frequently Asked Questions',
                        faq_subtitle: 'Get answers to common questions about our interior services, pricing, and project process.',
                        contact_badge: 'Get in Touch',
                        contact_title: 'Start Your Home Interior Project',
                        contact_description: 'Looking to upgrade your home? Get expert interior solutions including modular kitchen, wardrobes, furniture, and complete home interiors. Contact us for a free site visit and quotation.',
                        contact_h1: 'Contact Our Design Experts',
                        contact_h1_paragraph: 'Have a project in mind? Let\'s discuss how we can transform your space.',
                        contact_form_title: 'Book Consultation',
                        contact_form_button: 'Book Site Visit',
                        footer_cta_title: 'Transform Your Home Interiors Today.',
                        footer_cta_description: 'Book a consultation and get expert guidance for your modular kitchen, wardrobes, and complete home interiors.',
                        footer_cta_button: 'Book Site Visit',
                        footer_copyright_text: 'Engineered with precision.',
                    };
                    await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', 
                        ['section_settings', JSON.stringify(defaultData)]);
                    return defaultData;
                }
            } catch (error) {
                console.error("Failed to fetch section settings:", error);
                return {
                    error_title: '404 - Page Not Found',
                    error_subtitle: "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
                    error_button1_text: 'Back to Home',
                    error_button1_link: '/',
                    error_button2_text: 'Contact Support',
                    error_button2_link: '/contact',
                    review_title: 'Customer Reviews',
                    review_subtitle: 'See what our customers say about our interior work, quality, and service experience.',
                    faq_badge: 'Support Center',
                    faq_title: 'Frequently Asked Questions',
                    faq_subtitle: 'Get answers to common questions about our interior services, pricing, and project process.',
                    contact_badge: 'Get in Touch',
                    contact_title: 'Start Your Home Interior Project',
                    contact_description: 'Looking to upgrade your home? Get expert interior solutions including modular kitchen, wardrobes, furniture, and complete home interiors. Contact us for a free site visit and quotation.',
                    contact_h1: 'Contact Our Design Experts',
                    contact_h1_paragraph: 'Have a project in mind? Let\'s discuss how we can transform your space.',
                    contact_form_title: 'Book Consultation',
                    contact_form_button: 'Book Site Visit',
                    footer_cta_title: 'Transform Your Home Interiors Today.',
                    footer_cta_description: 'Book a consultation and get expert guidance for your modular kitchen, wardrobes, and complete home interiors.',
                    footer_cta_button: 'Book Site Visit',
                    footer_copyright_text: 'Engineered with precision.',
                };
            }
        },
        ['section-settings'],
        { tags: ['settings', 'section-settings'], revalidate: false }
    )();
});

export async function updateSectionSettings(settings: SectionSettings): Promise<void> {
    try {
        await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', 
            ['section_settings', JSON.stringify(settings)]);
            
        revalidateTag('section-settings');
        revalidatePath('/', 'layout');
    } catch (error) {
        console.error("Failed to update section settings:", error);
        throw error;
    }
}
