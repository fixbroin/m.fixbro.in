import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const raw = await request.text();
        if (raw.length > 8192) {
            return NextResponse.json({ success: false, error: 'Payload too large.' }, { status: 413 });
        }

        const { sessionId, geoData, deviceInfo } = JSON.parse(raw);

        if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 128 || !geoData || !deviceInfo) {
            return NextResponse.json({ success: false, error: 'Missing or invalid fields.' }, { status: 400 });
        }
        
        // Prevent tracking of admin pages if somehow called
        if (geoData.pathname && String(geoData.pathname).startsWith('/admin')) {
             return NextResponse.json({ success: true, message: 'Admin activity not tracked.' });
        }

        // Single atomic INSERT IGNORE using the UNIQUE(sessionId) constraint (avoids extra SELECT)
        const id = uuidv4();
        await db.query(
            'INSERT IGNORE INTO visitor_logs (id, sessionId, geoData, deviceInfo, timestamp) VALUES (?, ?, ?, ?, NOW())',
            [id, sessionId, JSON.stringify(geoData), JSON.stringify(deviceInfo)]
        );

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error in tracking API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
