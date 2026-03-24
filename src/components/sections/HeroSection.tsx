
import { Button } from '@/components/ui/button';
import { getHomePageContent } from '@/app/admin/settings/actions/home-actions';
import { getSeoData } from '@/app/admin/seo-geo-settings/actions';
import VantaBackground from '../VantaBackground';
import { getVantaSettings } from '@/app/admin/settings/actions/vanta-actions';
import ScrollAnimation from '../ScrollAnimation';
import LoadingLink from '../LoadingLink';
import HeroMedia from '../HeroMedia';

async function getData() {
    const homeContent = await getHomePageContent();
    const seoData = await getSeoData('home');
    const vantaSettings = await getVantaSettings();
    return { home: homeContent, seo: seoData, vantaSettings };
}

export default async function HeroSection() {
    const { home, seo, vantaSettings } = await getData();

    if (!home || !seo) return null;

    const sectionVantaConfig = vantaSettings?.sections?.hero;
    const useVanta = vantaSettings.globalEnable && sectionVantaConfig?.enabled;

  return (
    <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
       {useVanta && <VantaBackground sectionConfig={sectionVantaConfig} />}
      <div className="container relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Media first on mobile, then text */}
        <ScrollAnimation as="div" variant="zoomIn" delay={0.1} className="relative aspect-video w-full z-10 order-first lg:order-last">
            <HeroMedia media={home} />
        </ScrollAnimation>

        <div className="flex flex-col justify-center space-y-8 text-center lg:text-left order-last lg:order-first">
          <ScrollAnimation as="h1" variant="fadeInUp" className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            {seo.h1_title}
          </ScrollAnimation>
          <ScrollAnimation as="p" variant="fadeInUp" delay={0.1} className="mx-auto max-w-2xl text-lg text-foreground lg:mx-0">
            {seo.paragraph}
          </ScrollAnimation>
          <ScrollAnimation as="div" variant="fadeInUp" delay={0.2} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto sm:min-w-[200px]">
              <LoadingLink href="/contact">Get a Free Quote</LoadingLink>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto sm:min-w-[200px]">
              <LoadingLink href="/portfolio">View Portfolio</LoadingLink>
            </Button>
          </ScrollAnimation>
        </div>
      </div>
    </section>
  );
}
