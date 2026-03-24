
'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface VisitorLog {
    id: string;
    ip: string;
    city: string;
    region: string;
    country: string;
    postal: string;
    device: string;
    timestamp: string;
}

export async function getVisitorLogs(count: number = 50): Promise<VisitorLog[]> {
    try {
        const rows: any = await db.query(
            'SELECT * FROM visitor_logs ORDER BY timestamp DESC LIMIT ?',
            [count]
        );
        
        return rows.map((row: any) => {
            const geoData = typeof row.geoData === 'string' ? JSON.parse(row.geoData) : row.geoData;
            return {
                id: row.id,
                ip: geoData?.ip || 'N/A',
                city: geoData?.city || 'N/A',
                region: geoData?.region || 'N/A',
                country: geoData?.country_name || geoData?.country || 'N/A',
                postal: geoData?.postal || 'N/A',
                device: typeof row.deviceInfo === 'string' ? row.deviceInfo : JSON.stringify(row.deviceInfo) || 'N/A',
                timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : new Date(row.timestamp).toISOString(),
            };
        }) as VisitorLog[];

    } catch (error) {
        console.error(`Failed to fetch data from visitor_logs:`, error);
        return [];
    }
}


export async function clearVisitorLogs(): Promise<{ success: boolean; error?: string }> {
    try {
        await db.query('DELETE FROM visitor_logs');
        revalidatePath('/admin/visitor-logs');
        return { success: true };

    } catch (error: any) {
        console.error("Failed to clear visitor logs:", error);
        return { success: false, error: `An unexpected error occurred: ${error.message}` };
    }
}
