import ScrollAnimation from '../ScrollAnimation';
import { getBrandsSection, BrandItem } from '@/app/admin/settings/actions/brands-actions';

function BrandTile({ brand }: { brand: BrandItem }) {
  if (!brand.imageUrl) return null;
  return (
    <div className="flex-shrink-0 w-44 sm:w-52 h-24 sm:h-28 bg-white/85 backdrop-blur-md rounded-[20px] border border-white/60 dark:border-white/15 shadow-sm flex items-center justify-center p-5 transition-transform duration-300 hover:scale-[1.03]">
      <img
        src={brand.imageUrl}
        alt={brand.name}
        loading="lazy"
        draggable={false}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
}

export default async function BrandsSection() {
  const { title, subtitle, row1, row2 } = await getBrandsSection();

  if (row1.length === 0 && row2.length === 0) return null;

  return (
    <section id="brands" className="relative overflow-hidden py-20 lg:py-28 bg-background">
      <div className="container relative z-10 mb-14">
        <ScrollAnimation variant="fadeInUp" className="text-center">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-foreground mb-4">
            {title}
          </h2>
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-muted-foreground font-normal">
            {subtitle}
          </p>
        </ScrollAnimation>
      </div>

      {/* Marquee Container with soft left/right edge fade */}
      <div className="space-y-4 sm:space-y-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        {row1.length > 0 && (
          <div className="flex w-max animate-marquee-left hover:[animation-play-state:paused]">
            <div className="flex items-center gap-4 sm:gap-5 pr-4 sm:pr-5">
              {row1.map((brand) => (
                <BrandTile key={`r1-a-${brand.id}`} brand={brand} />
              ))}
            </div>
            <div className="flex items-center gap-4 sm:gap-5 pr-4 sm:pr-5" aria-hidden="true">
              {row1.map((brand) => (
                <BrandTile key={`r1-b-${brand.id}`} brand={brand} />
              ))}
            </div>
          </div>
        )}

        {row2.length > 0 && (
          <div className="flex w-max animate-marquee-right hover:[animation-play-state:paused]">
            <div className="flex items-center gap-4 sm:gap-5 pr-4 sm:pr-5">
              {row2.map((brand) => (
                <BrandTile key={`r2-a-${brand.id}`} brand={brand} />
              ))}
            </div>
            <div className="flex items-center gap-4 sm:gap-5 pr-4 sm:pr-5" aria-hidden="true">
              {row2.map((brand) => (
                <BrandTile key={`r2-b-${brand.id}`} brand={brand} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
