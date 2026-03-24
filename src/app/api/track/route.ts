import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from '@/app/admin/notifications/actions';

export async function POST(request: NextRequest) {
    try {
        const { sessionId, geoData, deviceInfo } = await request.json();

        if (!sessionId || !geoData || !deviceInfo) {
            return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
        }
        
        // Prevent tracking of admin pages if somehow called
        if (geoData.pathname && (geoData.pathname as string).startsWith('/admin')) {
             return NextResponse.json({ success: true, message: 'Admin activity not tracked.' });
        }

        // Check if a log for this session ID already exists
        const existing: any = await db.query('SELECT 1 FROM visitor_logs WHERE sessionId = ? LIMIT 1', [sessionId]);

        if (existing && existing.length > 0) {
            return NextResponse.json({ success: true, message: 'Visitor already logged for this session.' }, { status: 200 });
        }

        const id = uuidv4();
        await db.query(
            'INSERT INTO visitor_logs (id, sessionId, geoData, deviceInfo, timestamp) VALUES (?, ?, ?, ?, NOW())',
            [id, sessionId, JSON.stringify(geoData), JSON.stringify(deviceInfo)]
        );

        // Create a notification for the new visit
        await createNotification({
            type: 'visit',
            message: `New visitor from ${geoData.city || 'an unknown location'} on a ${deviceInfo} device.`
        });


        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error in tracking API:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
