import { NextResponse } from 'next/server';
import { WEBSITE_URL } from '@/lib/config';
import { getActiveCities } from '@/app/admin/city-seo/actions';
import { getAllActiveAreasWithCity } from '@/app/admin/area-seo/actions';

export const dynamic = 'force-dynamic';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const host = request.headers.get('host') || requestUrl.host;
  const proto =
    request.headers.get('x-forwarded-proto') ||
    (requestUrl.protocol === 'https:' ? 'https' : 'http');
  const baseUrl = host ? `${proto}://${host}` : WEBSITE_URL;

  const [cities, areas] = await Promise.all([
    getActiveCities(),
    getAllActiveAreasWithCity(),
  ]);

  const now = new Date().toISOString();

  const staticPaths = [
    { path: '', priority: '1.0' },
    { path: '/about', priority: '0.8' },
    { path: '/services', priority: '0.8' },
    { path: '/portfolio', priority: '0.8' },
    { path: '/pricing', priority: '0.8' },
    { path: '/contact', priority: '0.8' },
    { path: '/sitemap', priority: '0.7' },
    { path: '/privacy-policy', priority: '0.5' },
    { path: '/terms', priority: '0.5' },
    { path: '/refund-policy', priority: '0.5' },
    { path: '/cancellation-policy', priority: '0.5' },
  ];

  const urls: Array<{ loc: string; priority: string }> = [
    ...staticPaths.map((s) => ({ loc: `${baseUrl}${s.path}`, priority: s.priority })),
    ...cities.map((c) => ({ loc: `${baseUrl}/${c.slug}`, priority: '0.9' })),
    ...areas.map((a) => ({ loc: `${baseUrl}/${a.city_slug}/${a.slug}`, priority: '0.8' })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, stale-while-revalidate',
    },
  });
}
