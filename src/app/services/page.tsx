
import { getServices } from '@/app/admin/settings/actions/services-actions';
import { getSeoData } from '../admin/seo-geo-settings/actions';
import ScrollAnimation from '@/components/ScrollAnimation';
import LoadingLink from '@/components/LoadingLink';
import PortfolioMedia from '@/components/PortfolioMedia';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function ServicesPage() {
  const services = await getServices();
  const seoData = await getSeoData('services');

  return (
    <main className="overflow-hidden">
      {/* Dynamic Header */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-slate-50 dark:bg-black/20">
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        </div>
        <div className="container relative z-10 text-center">
            <ScrollAnimation variant="fadeInUp">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                    <Sparkles className="h-3 w-3" />
                    <span>Solutions & Expertise</span>
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 dark:text-white mb-8 leading-none">
                    {seoData.h1_title}
                </h1>
                <p className="mx-auto max-w-2xl text-lg md:text-xl font-medium text-slate-600 dark:text-white leading-relaxed">
                    {seoData.paragraph}
                </p>
            </ScrollAnimation>
        </div>
      </section>

      {/* Services List */}
      <section className="py-24 lg:py-32">
        <div className="container">
            <div className="space-y-32">
            {services.map((service, index) => (
                <ScrollAnimation key={service.id || index} variant="fadeInUp">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
                        {/* Content Side */}
                        <div className={cn(
                            "lg:col-span-6 space-y-8",
                            index % 2 === 1 ? "lg:order-2" : ""
                        )}>
                            <div className="space-y-4">
                                <span className="text-primary font-black uppercase tracking-[0.2em] text-xs">Service {index + 1}</span>
                                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                    {service.title}
                                </h2>
                                <p className="text-2xl font-bold text-primary">{service.price}</p>
                            </div>
                            
                            <p className="text-lg font-medium text-slate-600 dark:text-white leading-relaxed">
                                {service.description}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {service.features.map((feature) => (
                                    <div key={feature.name} className="flex items-center gap-3 group">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                                        </div>
                                        <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{feature.name}</span>
                                    </div>
                                ))}
                            </div>

                            <Button asChild size="lg" className="h-14 px-8 rounded-full font-black group">
                                <LoadingLink href="/contact">
                                    Book This Service
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </LoadingLink>
                            </Button>
                        </div>

                        {/* Media Side */}
                        <div className={cn(
                            "lg:col-span-6 relative aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl group",
                            index % 2 === 1 ? "lg:order-1" : ""
                        )}>
                            <div className="absolute inset-0 bg-primary/10 group-hover:opacity-0 transition-opacity duration-500" />
                            <PortfolioMedia item={{...service, category: 'Service'} as any} />
                        </div>
                    </div>
                </ScrollAnimation>
            ))}
            </div>
        </div>
      </section>
    </main>
  );
}
