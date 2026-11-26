
import { MetadataRoute } from 'next';
import { WEBSITE_URL } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: `${WEBSITE_URL}/sitemap.xml`,
  };
}
