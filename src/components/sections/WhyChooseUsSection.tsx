
import { getWhyChooseUsContent } from '@/app/admin/settings/actions/why-choose-us-actions';
import VantaBackground from '../VantaBackground';
import { getVantaSettings } from '@/app/admin/settings/actions/vanta-actions';
import DynamicIcon from '../DynamicIcon';
import ScrollAnimation from '../ScrollAnimation';
import PortfolioMedia from '../PortfolioMedia';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export default async function WhyChooseUsSection() {
    const content = await getWhyChooseUsContent();
    const vantaSettings = await getVantaSettings();
    const sectionVantaConfig = vantaSettings?.sections?.whyChooseUs;
    const useVanta = vantaSettings.globalEnable && sectionVantaConfig?.enabled;

    const mediaItem = {
      title: content.title,
      category: 'Why Choose Us',
      mediaType: content.media_type || 'image',
      mediaUrl: content.media_url,
      displayOrder: 1,
    };

  return (
    <section
      id="why-choose-us"
      className={cn(
        "relative overflow-hidden py-20 lg:py-28",
        !useVanta && "bg-secondary/45 border-y border-border/60"
      )}
    >
       {useVanta && <VantaBackground sectionConfig={sectionVantaConfig} />}
      
      <div className="container relative z-10">
        {/* Centered Header Above Both Columns */}
        <ScrollAnimation variant="fadeInUp" className="text-center mb-14 lg:mb-16">
          <h2 className={cn(
            "font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight mb-4",
            useVanta ? "text-white" : "text-foreground"
          )}>{content.title}</h2>
          <div className="w-16 h-0.5 bg-primary mx-auto rounded-full mb-5" />
          <p className={cn(
            "mx-auto max-w-2xl text-base md:text-lg font-normal leading-relaxed",
            useVanta ? "text-white/85" : "text-muted-foreground"
          )}>
            {content.subtitle}
          </p>
        </ScrollAnimation>

        {/* Aligned 2-Column Content: Cards (Left) + Video/Media (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div className="order-2 lg:order-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {content.features.map((feature, index) => (
                <ScrollAnimation key={feature.title} variant="fadeInUp" delay={index * 0.1} className="group">
                  <div className={cn(
                    "relative flex flex-col items-center text-center gap-3 p-6 rounded-[1.5rem] transition-all duration-300 border h-full backdrop-blur-md",
                    useVanta 
                        ? "bg-white/10 border-white/15 text-white" 
                        : "bg-card/75 text-card-foreground border-white/50 dark:border-white/10 shadow-sm group-hover:shadow-xl group-hover:-translate-y-1"
                  )}>
                    <span className="font-display text-2xl font-semibold text-primary/70 tracking-tight">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                        <DynamicIcon name={feature.icon} className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-semibold tracking-tight mb-2">{feature.title}</h3>
                      <p className={cn(
                        "text-sm leading-relaxed",
                        useVanta ? "text-white/75" : "text-muted-foreground"
                      )}>{feature.description}</p>
                    </div>
                  </div>
                </ScrollAnimation>
              ))}
            </div>
          </div>

          <ScrollAnimation as="div" variant="slideInRight" delay={0.2} className="order-1 lg:order-2 relative w-full z-10">
            <div className="relative w-full rounded-[2rem] overflow-hidden shadow-2xl border-4 border-card">
                <PortfolioMedia item={mediaItem as any} fill={false} />
            </div>
          </ScrollAnimation>
        </div>
      </div>
    </section>
  );
}
