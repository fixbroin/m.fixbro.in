import { Button } from '@/components/ui/button';
import { getHomePageContent } from '@/app/admin/settings/actions/home-actions';
import { getSeoData } from '@/app/admin/seo-geo-settings/actions';
import { getGeneralSettings } from '@/app/admin/settings/actions/general-actions';
import ScrollAnimation from '../ScrollAnimation';
import LoadingLink from '../LoadingLink';
import HeroMedia from '../HeroMedia';

interface HeroSectionProps {
  h1Override?: string;
  paragraphOverride?: string;
  eyebrowOverride?: string;
}

export default async function HeroSection({
  h1Override,
  paragraphOverride,
  eyebrowOverride,
}: HeroSectionProps = {}) {
  const [home, seo, general] = await Promise.all([
    getHomePageContent(),
    getSeoData('home'),
    getGeneralSettings(),
  ]);

  if (!home || !seo) return null;

  const displayH1 = h1Override || seo.h1_title;
  const displayParagraph = paragraphOverride || seo.paragraph;
  const displayEyebrow = eyebrowOverride || general.website_name || 'Interior Design Studio';

  return (
    <section
      id="intro"
      className="relative h-[100svh] min-h-[600px] w-full overflow-hidden bg-[#0c2229]"
    >
      {/* Full-bleed desktop / mobile background video or image */}
      <HeroMedia media={home} />

      {/* Bottom-left editorial copy */}
      <div className="relative z-20 h-full container flex flex-col justify-end pb-12 md:pb-16 pr-24 md:pr-32 pointer-events-none">
        <div className="max-w-2xl space-y-5 pointer-events-auto">
          <ScrollAnimation as="div" variant="fadeInUp">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/80 mb-3">
              {displayEyebrow}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-white leading-[1.03]">
              {displayH1}
            </h1>
          </ScrollAnimation>

          <ScrollAnimation
            as="p"
            variant="fadeInUp"
            delay={0.1}
            className="max-w-xl text-base md:text-lg text-white/85 leading-relaxed font-normal"
          >
            {displayParagraph}
          </ScrollAnimation>

          <ScrollAnimation
            as="div"
            variant="fadeInUp"
            delay={0.2}
            className="flex flex-wrap items-center gap-3 pt-1"
          >
            <Button
              asChild
              size="lg"
              className="h-11 px-7 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg"
            >
              <LoadingLink href={home.hero_button1_link || '/contact'}>
                {home.hero_button1_text || 'Get Consultation'}
              </LoadingLink>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 px-7 rounded-full border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-md font-medium"
            >
              <LoadingLink href={home.hero_button2_link || '/portfolio'}>
                {home.hero_button2_text || 'View Portfolio'}
              </LoadingLink>
            </Button>
          </ScrollAnimation>
        </div>
      </div>
    </section>
  );
}
