import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

async function queryEndpoint(endpoint: string, query: string): Promise<any> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'FixbroApp/1.0 (sup@fixbro.in)',
    },
    body: `data=${encodeURIComponent(query)}`,
    cache: 'no-store',
    signal: AbortSignal.timeout(9000),
  });

  if (!response.ok) {
    throw new Error(`Status ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Non-JSON Overpass response');
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await request.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    try {
      const data = await Promise.any(
        OVERPASS_ENDPOINTS.map((ep) => queryEndpoint(ep, query))
      );
      return NextResponse.json(data);
    } catch (aggErr: any) {
      return NextResponse.json(
        {
          error: 'All Overpass endpoints are currently busy',
          details: aggErr?.errors?.[0]?.message || 'Overpass timeout/502',
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('Error in Overpass proxy API:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
