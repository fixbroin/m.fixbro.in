import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getActiveCities, getCityBySlug } from '@/app/admin/city-seo/actions';
import { getActiveAreasByCityId } from '@/app/admin/area-seo/actions';
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

interface CityPageProps {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) return {};

  const canonicalUrl = `${WEBSITE_URL}/${city.slug}`;
  return {
    title: city.meta_title,
    description: city.meta_description,
    keywords: city.meta_keywords,
    robots: { index: true, follow: true },
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: city.meta_title,
      description: city.meta_description,
      url: canonicalUrl,
    },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);

  if (!city) {
    notFound();
  }

  const [areasInCity, allCities] = await Promise.all([
    getActiveAreasByCityId(city.id),
    getActiveCities(),
  ]);

  const otherCities = allCities.filter((c) => c.id !== city.id).slice(0, 24);
  const localSchema = {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: `FixBro Interiors - ${city.name}`,
    url: `${WEBSITE_URL}/${city.slug}`,
    description: city.meta_description,
    areaServed: {
      '@type': 'City',
      name: city.name,
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localSchema) }}
      />
      <HeroSection
        h1Override={city.h1_title}
        paragraphOverride={city.paragraph}
        eyebrowOverride={`Interior Design Studio • ${city.name}`}
      />
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: city.name },
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
        areasInCity={areasInCity}
        otherCities={otherCities}
      />
    </main>
  );
}
