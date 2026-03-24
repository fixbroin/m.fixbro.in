
import { getServices, getServicesPageContent } from '@/app/admin/settings/actions/services-actions';
import VantaBackground from '../VantaBackground';
import { getVantaSettings } from '@/app/admin/settings/actions/vanta-actions';
import DynamicIcon from '../DynamicIcon';
import ScrollAnimation from '../ScrollAnimation';
import { cn } from '@/lib/utils';

export default async function ServicesSection() {
    const [services, pageContent, vantaSettings] = await Promise.all([
        getServices(),
        getServicesPageContent(),
        getVantaSettings(),
    ]);

    const sectionVantaConfig = vantaSettings?.sections?.services;
    const useVanta = vantaSettings.globalEnable && sectionVantaConfig?.enabled;
    const displayedServices = services.slice(0, 6);

  return (
    <section id="services" className="relative overflow-hidden bg-slate-50 dark:bg-black/20">
       {useVanta && <VantaBackground sectionConfig={sectionVantaConfig} />}
       
      <div className="container relative z-10">
        <ScrollAnimation variant="fadeInUp" className="text-center mb-16">
          <h2 className={cn(
            "text-4xl md:text-5xl font-black tracking-tight mb-4",
            useVanta ? "text-white drop-shadow-md" : "text-slate-900 dark:text-white"
          )}>
            {pageContent.title}
          </h2>
          <div className="w-20 h-1.5 bg-primary mx-auto rounded-full mb-6" />
          <p className={cn(
            "mx-auto max-w-2xl text-lg font-medium",
            useVanta ? "text-white/90 drop-shadow-sm" : "text-slate-600 dark:text-white"
          )}>
            {pageContent.subtitle}
          </p>
        </ScrollAnimation>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {displayedServices.map((service, index) => (
            <ScrollAnimation key={service.id} variant="fadeInUp" delay={index * 0.1}>
              <div className="group relative h-full">
                {/* Premium Card Glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 to-purple-500/0 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                
                <div className="relative h-full bg-card text-card-foreground border border-border rounded-3xl p-8 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl dark:group-hover:bg-[#161922]">
                  <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                    <DynamicIcon name={service.icon} className="h-7 w-7" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  
                  <p className="text-slate-600 dark:text-white leading-relaxed font-medium mb-6">
                    {service.description}
                  </p>

                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span>Learn more</span>
                    <div className="w-4 h-0.5 bg-primary transform origin-left transition-transform duration-300 group-hover:scale-x-150" />
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  );
}
