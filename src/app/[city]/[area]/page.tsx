import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getActiveCities } from '@/app/admin/city-seo/actions';
import { getActiveAreasByCityId, getAreaBySlugs } from '@/app/admin/area-seo/actions';
import { getNearbyAreasSorted } from '@/lib/seo-templates';
import { WEBSITE_URL } from '@/lib/config';
import Breadcrumbs from '@/components/Breadcrumbs';
import LocationInterlinks from '@/components/LocationInterlinks';
import HeroSection from '@/components/sections/HeroSection';
import ServicesSection from '@/components/sections/ServicesSection';
import WhyChooseUsSection from '@/components/sections/WhyChooseUsSection';
import PortfolioSection from '@/components/sections/PortfolioSection';
import BrandsSection from '@/components/sections/BrandsSection';
import PricingSection from '@/components/sections/PricingSection';
import TestimonialSection from '@/components/sections/TestimonialSection';
import FaqSection from '@/components/sections/FaqSection';
import ContactSection from '@/components/sections/ContactSection';

interface AreaPageProps {
  params: Promise<{ city: string; area: string }>;
}

export async function generateMetadata({ params }: AreaPageProps): Promise<Metadata> {
  const { city: citySlug, area: areaSlug } = await params;
  const result = await getAreaBySlugs(citySlug, areaSlug);
  if (!result) return {};

  const { area, city } = result;
  const canonicalUrl = `${WEBSITE_URL}/${city.slug}/${area.slug}`;

  return {
    title: area.meta_title,
    description: area.meta_description,
    keywords: area.meta_keywords,
    robots: { index: true, follow: true },
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: area.meta_title,
      description: area.meta_description,
      url: canonicalUrl,
    },
  };
}

export default async function AreaPage({ params }: AreaPageProps) {
  const { city: citySlug, area: areaSlug } = await params;
  const result = await getAreaBySlugs(citySlug, areaSlug);

  if (!result) {
    notFound();
  }

  const { area, city } = result;

  const [allAreasInCity, allCities] = await Promise.all([
    getActiveAreasByCityId(city.id),
    getActiveCities(),
  ]);

  const nearbyAreas = getNearbyAreasSorted(area, allAreasInCity, 16);
  const otherCities = allCities.filter((c) => c.id !== city.id).slice(0, 20);
  const localSchema = {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: `FixBro Interiors - ${area.name}, ${city.name}`,
    url: `${WEBSITE_URL}/${city.slug}/${area.slug}`,
    description: area.meta_description,
    areaServed: {
      '@type': 'Place',
      name: `${area.name}, ${city.name}`,
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localSchema) }}
      />
      <HeroSection
        h1Override={area.h1_title}
        paragraphOverride={area.paragraph}
        eyebrowOverride={`${area.name}, ${city.name}`}
      />
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: city.name, href: `/${city.slug}` },
          { label: area.name },
        ]}
      />
      <ServicesSection />
      <WhyChooseUsSection />
      <PortfolioSection />
      <BrandsSection />
      <PricingSection />
      <TestimonialSection />
      <FaqSection />
      <ContactSection />
      <LocationInterlinks
        currentCity={city}
        currentArea={area}
        areasInCity={nearbyAreas}
        otherCities={otherCities}
      />
    </main>
  );
}
