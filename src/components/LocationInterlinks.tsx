import { MapPin, Building2 } from 'lucide-react';
import LoadingLink from './LoadingLink';
import { SeoCity } from '@/app/admin/city-seo/actions';
import { SeoArea } from '@/app/admin/area-seo/actions';

interface LocationInterlinksProps {
  currentCity: SeoCity;
  currentArea?: SeoArea;
  areasInCity: SeoArea[];
  otherCities: SeoCity[];
}

export default function LocationInterlinks({
  currentCity,
  currentArea,
  areasInCity,
  otherCities,
}: LocationInterlinksProps) {
  if (areasInCity.length === 0 && otherCities.length === 0) return null;

  return (
    <section className="py-16 lg:py-20 bg-secondary/45 border-t border-border/60">
      <div className="container space-y-12">
        {areasInCity.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
                {currentArea
                  ? `Nearby Areas in ${currentCity.name}`
                  : `Areas We Serve in ${currentCity.name}`}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {areasInCity.map((area) => (
                <LoadingLink
                  key={area.id}
                  href={`/${currentCity.slug}/${area.slug}`}
                  className="px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-card border border-border hover:border-primary hover:text-primary transition-colors shadow-sm"
                >
                  Interior Designers in {area.name}, {currentCity.name}
                </LoadingLink>
              ))}
            </div>
          </div>
        )}

        {otherCities.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
                Other Cities We Serve
              </h2>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {otherCities.map((city) => (
                <LoadingLink
                  key={city.id}
                  href={`/${city.slug}`}
                  className="px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-card border border-border hover:border-primary hover:text-primary transition-colors shadow-sm"
                >
                  Interior Designers in {city.name}
                </LoadingLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
