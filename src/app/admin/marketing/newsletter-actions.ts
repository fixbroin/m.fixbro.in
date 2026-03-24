
'use server';

import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

export interface NewsletterSubscriber {
    id: string;
    email: string;
    subscribedAt: any;
}

export async function subscribeToNewsletter(email: string) {
    if (!email || !email.includes('@')) {
        return { success: false, error: 'Please provide a valid email address.' };
    }

    try {
        // Check if already exists
        const existing: any = await db.query(
            'SELECT * FROM newsletter_subscribers WHERE email = ?',
            [email.toLowerCase()]
        );
        
        if (existing.length > 0) {
            return { success: false, error: 'This email is already subscribed.' };
        }

        const id = uuidv4();
        await db.query(
            'INSERT INTO newsletter_subscribers (id, email) VALUES (?, ?)',
            [id, email.toLowerCase()]
        );

        revalidatePath('/admin/marketing');
        return { success: true };
    } catch (error) {
        console.error('Newsletter Subscription Error:', error);
        return { success: false, error: 'Failed to subscribe. Please try again later.' };
    }
}

export async function getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    try {
        const rows: any = await db.query(
            'SELECT * FROM newsletter_subscribers ORDER BY subscribedAt DESC'
        );

        return rows.map((row: any) => ({
            id: row.id,
            email: row.email,
            subscribedAt: row.subscribedAt instanceof Date ? row.subscribedAt.toISOString() : new Date(row.subscribedAt).toISOString(),
        }));
    } catch (error) {
        console.error('Error fetching subscribers:', error);
        return [];
    }
}

export async function deleteSubscriber(id: string) {
    try {
        await db.query('DELETE FROM newsletter_subscribers WHERE id = ?', [id]);
        revalidatePath('/admin/marketing');
        return { success: true };
    } catch (error) {
        console.error('Error deleting subscriber:', error);
        return { success: false, error: 'Failed to delete.' };
    }
}
