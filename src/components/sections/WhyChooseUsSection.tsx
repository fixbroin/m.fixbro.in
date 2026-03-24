
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
    <section id="why-choose-us" className="relative overflow-hidden py-24">
       {useVanta && <VantaBackground sectionConfig={sectionVantaConfig} />}
      
      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <ScrollAnimation variant="fadeInUp" className="mb-12">
              <h2 className={cn(
                "text-4xl md:text-5xl font-black tracking-tight mb-6",
                useVanta ? "text-white" : "text-slate-900 dark:text-white"
              )}>{content.title}</h2>
              <div className="w-20 h-1.5 bg-primary rounded-full mb-8" />
              <p className={cn(
                "text-lg font-medium leading-relaxed",
                useVanta ? "text-white" : "text-slate-600 dark:text-white"
              )}>
                {content.subtitle}
              </p>
            </ScrollAnimation>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {content.features.map((feature, index) => (
                <ScrollAnimation key={feature.title} variant="fadeInUp" delay={index * 0.1} className="group">
                  <div className={cn(
                    "flex flex-col gap-4 p-6 rounded-3xl transition-all duration-300 border",
                    useVanta 
                        ? "bg-white/5 border-white/10 text-white" 
                        : "bg-card text-card-foreground border-border group-hover:shadow-xl group-hover:-translate-y-1"
                  )}>
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        <DynamicIcon name={feature.icon} className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold tracking-tight mb-2">{feature.title}</h3>
                      <p className={cn(
                        "text-sm font-medium leading-relaxed opacity-70",
                        useVanta ? "text-white" : "text-slate-600 dark:text-white"
                      )}>{feature.description}</p>
                    </div>
                  </div>
                </ScrollAnimation>
              ))}
            </div>
          </div>

          <ScrollAnimation as="div" variant="slideInRight" delay={0.2} className="order-1 lg:order-2 relative h-[500px] lg:h-[600px] w-full z-10">
            <div className="absolute -inset-4 bg-primary/5 rounded-[3rem] blur-2xl" />
            <div className="relative h-full w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white dark:border-[#161922]">
                <PortfolioMedia item={mediaItem as any} />
            </div>
            
            
          </ScrollAnimation>
        </div>
      </div>
    </section>
  );
}
