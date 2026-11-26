import { Metadata } from 'next';
import Link from 'next/link';
import { Globe, MapPin, Building2, FileText } from 'lucide-react';
import { APP_NAME, WEBSITE_URL } from '@/lib/config';
import { getActiveCities } from '@/app/admin/city-seo/actions';
import { getAllActiveAreasWithCity, SeoAreaWithCity } from '@/app/admin/area-seo/actions';
import Breadcrumbs from '@/components/Breadcrumbs';
import LoadingLink from '@/components/LoadingLink';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Sitemap | ${APP_NAME}`,
  description: `Browse all pages, cities, and service areas covered by ${APP_NAME}.`,
  robots: { index: true, follow: true },
  alternates: { canonical: `${WEBSITE_URL}/sitemap` },
};

const MAIN_PAGES = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'XML Sitemap', href: '/sitemap.xml' },
];

const LEGAL_PAGES = [
  { label: 'Terms and Conditions', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Refund Policy', href: '/refund-policy' },
  { label: 'Cancellation Policy', href: '/cancellation-policy' },
];

export default async function HtmlSitemapPage() {
  const [cities, areas] = await Promise.all([
    getActiveCities(),
    getAllActiveAreasWithCity(),
  ]);

  const areasByCity = new Map<string, { cityName: string; citySlug: string; items: SeoAreaWithCity[] }>();
  for (const area of areas) {
    const existing = areasByCity.get(area.city_id);
    if (existing) {
      existing.items.push(area);
    } else {
      areasByCity.set(area.city_id, {
        cityName: area.city_name,
        citySlug: area.city_slug,
        items: [area],
      });
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="pt-14 pb-10 bg-secondary/45 border-b border-border/60 text-center">
        <div className="container">
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground mb-3">
            Sitemap
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore all pages, cities, and local service areas for {APP_NAME}.
          </p>
        </div>
      </section>

      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Sitemap' }]} />

      <section className="py-16 container space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card/80 backdrop-blur-md border border-border rounded-[1.5rem] p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold flex items-center gap-2 mb-5">
              <Globe className="h-5 w-5 text-primary" />
              Main Pages
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MAIN_PAGES.map((p) => (
                <li key={p.href}>
                  {p.href === '/sitemap.xml' ? (
                    <Link href={p.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                      {p.label}
                    </Link>
                  ) : (
                    <LoadingLink href={p.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                      {p.label}
                    </LoadingLink>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card/80 backdrop-blur-md border border-border rounded-[1.5rem] p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold flex items-center gap-2 mb-5">
              <FileText className="h-5 w-5 text-primary" />
              Legal &amp; Policies
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LEGAL_PAGES.map((p) => (
                <li key={p.href}>
                  <LoadingLink href={p.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    {p.label}
                  </LoadingLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {cities.length > 0 && (
          <div className="bg-card/80 backdrop-blur-md border border-border rounded-[1.5rem] p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold flex items-center gap-2 mb-5">
              <Building2 className="h-5 w-5 text-primary" />
              Cities We Serve ({cities.length})
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {cities.map((city) => (
                <LoadingLink
                  key={city.id}
                  href={`/${city.slug}`}
                  className="px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-secondary/60 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {city.name}
                </LoadingLink>
              ))}
            </div>
          </div>
        )}

        {areasByCity.size > 0 && (
          <div className="bg-card/80 backdrop-blur-md border border-border rounded-[1.5rem] p-6 sm:p-8 space-y-8">
            <h2 className="font-display text-2xl font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Areas by City ({areas.length})
            </h2>
            {Array.from(areasByCity.values()).map((group) => (
              <div key={group.citySlug} className="space-y-3">
                <h3 className="font-display text-xl font-semibold">
                  <LoadingLink href={`/${group.citySlug}`} className="hover:text-primary transition-colors">
                    {group.cityName}
                  </LoadingLink>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((area) => (
                    <LoadingLink
                      key={area.id}
                      href={`/${group.citySlug}/${area.slug}`}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/50 hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {area.name}
                    </LoadingLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
