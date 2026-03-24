
'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

interface AnalyticsEvent {
    id: string;
    userId: string;
    serverTimestamp: string;
    [key: string]: any;
}

export interface PageVisit extends AnalyticsEvent {
    pageUrl: string;
}

export interface UserEvent extends AnalyticsEvent {
    action: string;
}

export async function getRecentPageVisits(count: number = 20): Promise<PageVisit[]> {
    try {
        const rows: any = await db.query(
            'SELECT * FROM page_visits ORDER BY timestamp DESC LIMIT ?',
            [count]
        );
        
        return rows.map((row: any) => {
            const eventData = typeof row.event_data === 'string' ? JSON.parse(row.event_data) : row.event_data;
            return {
                id: row.id,
                userId: eventData?.userId || 'Anonymous',
                pageUrl: eventData?.pageUrl || 'Unknown',
                serverTimestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : new Date(row.timestamp).toISOString(),
            };
        }) as PageVisit[];

    } catch (error) {
        console.error(`Failed to fetch page visits:`, error);
        return [];
    }
}

export async function getRecentUserEvents(count: number = 20): Promise<UserEvent[]> {
    try {
        const rows: any = await db.query(
            'SELECT * FROM user_events ORDER BY timestamp DESC LIMIT ?',
            [count]
        );
        
        return rows.map((row: any) => {
            const eventData = typeof row.event_data === 'string' ? JSON.parse(row.event_data) : row.event_data;
            return {
                id: row.id,
                userId: eventData?.userId || 'Anonymous',
                action: eventData?.action || 'Unknown',
                details: eventData?.details || '',
                serverTimestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : new Date(row.timestamp).toISOString(),
            };
        }) as UserEvent[];

    } catch (error) {
        console.error(`Failed to fetch user events:`, error);
        return [];
    }
}


export async function clearUserActivity(): Promise<{ success: boolean; error?: string }> {
    try {
        await db.query('DELETE FROM page_visits');
        await db.query('DELETE FROM user_events');
        revalidatePath('/admin/user-activity');
        return { success: true };

    } catch (error: any) {
        console.error("Failed to clear user activity:", error);
        return { success: false, error: `An unexpected error occurred: ${error.message}` };
    }
}
