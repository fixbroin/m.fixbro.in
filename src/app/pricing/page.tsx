
import { Metadata } from 'next';
import PricingSection from '@/components/sections/PricingSection';
import { getSeoData } from '../admin/seo-geo-settings/actions';
import ScrollAnimation from '@/components/ScrollAnimation';
import { Sparkles } from 'lucide-react';
import { WEBSITE_URL } from '@/lib/config';

export async function generateMetadata(): Promise<Metadata> {
  const seoData = await getSeoData('pricing');
  const canonicalUrl = `${WEBSITE_URL}/pricing`;
  return {
    title: seoData.meta_title,
    description: seoData.meta_description,
    keywords: seoData.meta_keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seoData.meta_title,
      description: seoData.meta_description,
      url: canonicalUrl,
    },
  };
}

export default async function PricingPage() {
  const seoData = await getSeoData('pricing');
  return (
    <main className="overflow-hidden">
      {/* Header */}
      <section className="relative pt-16 pb-12 md:pt-24 md:pb-16 bg-slate-50 dark:bg-black/20 text-center">
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        </div>
        <div className="container relative z-10">
            <ScrollAnimation variant="fadeInUp">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                    <Sparkles className="h-3 w-3" />
                    <span>Investment Plans</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
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
