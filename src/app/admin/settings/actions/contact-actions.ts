'use server';

import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { cache } from 'react';
import { getSeoData, updateSeoData } from '../../seo-geo-settings/actions';

export interface ContactDetails {
    h1_title: string;
    paragraph: string;
    email: string;
    phone: string;
    location: string;
    whatsAppNumber: string;
    whatsAppMessage: string;
    enableFloatingButtons: boolean;
    buttonPosition: 'bottom-right' | 'bottom-left';
    animationStyle: 'none' | 'shake' | 'pulse' | 'bounce' | 'tada' | 'jello' | 'swing';
}

export const getContactDetails = cache(async (): Promise<ContactDetails> => {
    return await unstable_cache(
        async () => {
            try {
                const seoData = await getSeoData('contact');
                const rows = await db.query<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', ['contact_details']);
                
                let data: any = {};
                if (rows.length > 0) {
                    data = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
                }

                return {
                    h1_title: seoData.h1_title || '',
                    paragraph: seoData.paragraph || '',
                    email: data.email || 'fixbro.in@gmail.com',
                    phone: data.phone || '+917353145565',
                    location: data.location || 'Bengaluru, India',
                    whatsAppNumber: data.whatsAppNumber || '917353145565',
                    whatsAppMessage: data.whatsAppMessage || "Hi, I'm interested in your services.",
                    enableFloatingButtons: data.enableFloatingButtons !== false, // default to true
                    buttonPosition: data.buttonPosition || 'bottom-right',
                    animationStyle: data.animationStyle || 'shake',
                };
            } catch (error) {
                console.error("Failed to fetch contact details:", error);
                const seoData = await getSeoData('contact');
                return {
                    h1_title: seoData.h1_title || '',
                    paragraph: seoData.paragraph || '',
                    email: 'fixbro.in@gmail.com',
                    phone: '+917353145565',
                    location: 'Bengaluru, India',
                    whatsAppNumber: '917353145565',
                    whatsAppMessage: "Hi, I'm interested in your services.",
                    enableFloatingButtons: true,
                    buttonPosition: 'bottom-right',
                    animationStyle: 'shake',
                };
            }
        },
        ['contact-details'],
        { tags: ['settings', 'contact-details', 'seo-data-contact'], revalidate: false }
    )();
});

export async function updateContactDetails(details: ContactDetails): Promise<void> {
    try {
        // Update SEO data (H1 and Paragraph)
        const currentSeo = await getSeoData('contact');
        await updateSeoData('contact', {
            ...currentSeo,
            h1_title: details.h1_title,
            paragraph: details.paragraph,
        });

        const { h1_title, paragraph, ...mergedData } = details;
        
        await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', 
            ['contact_details', JSON.stringify(mergedData)]);
            
        revalidateTag('contact-details');
        revalidateTag('seo-data-contact');
        revalidatePath('/contact');
        revalidatePath('/', 'layout'); // For footer and floating buttons
    } catch (error) {
        console.error("Failed to update contact details:", error);
        throw error;
    }
}
