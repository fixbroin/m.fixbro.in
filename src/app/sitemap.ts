
import { MetadataRoute } from 'next';
import { WEBSITE_URL } from '@/lib/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/about',
    '/services',
    '/portfolio',
    '/pricing',
    '/contact',
    '/privacy-policy',
    '/terms',
    '/refund-policy',
    '/cancellation-policy',
  ].map((route) => ({
    url: `${WEBSITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
