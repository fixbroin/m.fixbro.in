import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { headers } from 'next/headers';

const VALID_COLLECTIONS: Record<string, string> = {
    page_visit: 'page_visits',
    user_action: 'user_events',
    booking_funnel: 'booking_funnel'
};

export async function POST(request: NextRequest) {
    try {
        const { eventType, data } = await request.json();
        const headersList = await headers();
        const userAgent = headersList.get('user-agent');
        const ip = headersList.get('x-forwarded-for') ?? request.ip ?? 'unknown';


        if (!eventType || !VALID_COLLECTIONS[eventType]) {
            return NextResponse.json({ success: false, error: 'Invalid event type.' }, { status: 400 });
        }
        
        // Prevent tracking of admin pages
        if (data.pageUrl && data.pageUrl.includes('/admin')) {
            return NextResponse.json({ success: true, message: 'Admin activity not tracked.' });
        }
        
        const collectionName = VALID_COLLECTIONS[eventType];
        const id = uuidv4();

        await db.query(
            `INSERT INTO ${collectionName} (id, event_data, ip, userAgent) VALUES (?, ?, ?, ?)`,
            [id, JSON.stringify(data), ip, userAgent]
        );

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error in event tracking API:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
