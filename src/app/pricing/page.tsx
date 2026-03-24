
import PricingSection from '@/components/sections/PricingSection';
import { getSeoData } from '../admin/seo-geo-settings/actions';
import ScrollAnimation from '@/components/ScrollAnimation';
import { Sparkles } from 'lucide-react';

export default async function PricingPage() {
  const seoData = await getSeoData('pricing');
  return (
    <main className="overflow-hidden">
      {/* Header */}
      <section className="relative pt-32 pb-12 md:pt-48 md:pb-20 bg-slate-50 dark:bg-black/20 text-center">
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        </div>
        <div className="container relative z-10">
            <ScrollAnimation variant="fadeInUp">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                    <Sparkles className="h-3 w-3" />
                    <span>Investment Plans</span>
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

      {/* Main Content */}
      <div className="-mt-12 md:-mt-20 relative z-20">
        <PricingSection />
      </div>

      {/* Trust Quote */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="container text-center">
            <ScrollAnimation variant="fadeInUp" className="max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-8">No hidden fees. Just <span className="text-primary">pure results.</span></h2>
                <p className="text-white text-lg font-medium leading-relaxed">All our plans include a dedicated project manager, 24/7 technical support, and a 100% satisfaction guarantee. We build for the long term.</p>
            </ScrollAnimation>
        </div>
      </section>
    </main>
  );
}
