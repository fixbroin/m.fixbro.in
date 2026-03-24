
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getPortfolioItems, getPortfolioPageContent } from '@/app/admin/settings/actions/portfolio-actions';
import VantaBackground from '../VantaBackground';
import { getVantaSettings } from '@/app/admin/settings/actions/vanta-actions';
import ScrollAnimation from '../ScrollAnimation';
import PortfolioMedia from '../PortfolioMedia';
import LoadingLink from '../LoadingLink';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

export default async function PortfolioSection() {
    const [allItems, pageContent, vantaSettings] = await Promise.all([
        getPortfolioItems(),
        getPortfolioPageContent(),
        getVantaSettings()
    ]);
    
    const sectionVantaConfig = vantaSettings?.sections?.portfolio;
    const useVanta = vantaSettings.globalEnable && sectionVantaConfig?.enabled;
    const portfolioItems = allItems.slice(0, 4);

    const PortfolioCard = ({ item }: { item: typeof portfolioItems[0] }) => (
      <div className="group relative flex flex-col h-full bg-card text-card-foreground rounded-[2rem] overflow-hidden border border-border transition-all duration-500 hover:shadow-2xl">
        <div className="relative h-[300px] w-full overflow-hidden">
          <PortfolioMedia item={item} />
        </div>
        
        <div className="p-8 flex flex-col flex-grow text-center">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {item.title}
          </h3>
        </div>
      </div>
    );

  return (
    <section id="portfolio" className="relative overflow-hidden py-24 bg-slate-50/50 dark:bg-black/40">
       {useVanta && <VantaBackground sectionConfig={sectionVantaConfig} />}
       
      <div className="container relative z-10">
        <ScrollAnimation variant="fadeInUp" className="text-center mb-20">
          <h2 className={cn(
            "text-4xl md:text-5xl font-black tracking-tight mb-4",
            useVanta ? "text-white" : "text-slate-900 dark:text-white"
          )}>{pageContent.title}</h2>
          <div className="w-20 h-1.5 bg-primary mx-auto rounded-full mb-6" />
          <p className={cn(
            "mx-auto max-w-2xl text-lg font-medium",
            useVanta ? "text-white" : "text-slate-600 dark:text-white"
          )}>
            {pageContent.subtitle}
          </p>
        </ScrollAnimation>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {portfolioItems.map((item, index) => (
            <ScrollAnimation key={item.id || index} as="div" variant="fadeInUp" delay={index * 0.1}>
                <PortfolioCard item={item} />
            </ScrollAnimation>
          ))}
        </div>

        <ScrollAnimation as="div" variant="fadeInUp" className="mt-20 text-center">
          <Button asChild size="lg" className="h-14 px-10 rounded-full font-black text-base shadow-xl shadow-primary/20">
            <LoadingLink href="/portfolio">Explore Full Showcase</LoadingLink>
          </Button>
        </ScrollAnimation>
      </div>
    </section>
  );
}
