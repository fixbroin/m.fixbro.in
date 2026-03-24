
'use client';

import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getPricingPlans, getPricingPageContent, PricingPlan } from '@/app/admin/settings/actions/pricing-actions';
import VantaBackground from '../VantaBackground';
import { getVantaSettings } from '@/app/admin/settings/actions/vanta-actions';
import ScrollAnimation from '../ScrollAnimation';
import LoadingLink from '../LoadingLink';
import { useAnalytics } from '@/context/AnalyticsContext';
import { VantaSettings } from '@/types/firestore';
import { useEffect, useState } from 'react';

function parsePrice(price: string): number {
    const numericString = price.replace(/[^0-9.]/g, '');
    return parseFloat(numericString) || 0;
}

const PricingCard = ({ plan, onBookNowClick }: { plan: PricingPlan; onBookNowClick: () => void }) => {
    const isCustom = plan.title.toLowerCase().includes('custom');
    
    return (
        <ScrollAnimation as="div" variant="fadeInUp">
            <div className={cn(
                "relative group h-full transition-all duration-500",
                plan.is_featured ? "scale-105 z-10" : "hover:scale-[1.02]"
            )}>
                {plan.is_featured && (
                    <div className="absolute -top-5 inset-x-0 flex justify-center">
                        <div className="bg-primary text-white text-[10px] uppercase tracking-widest font-black px-4 py-1.5 rounded-full shadow-lg shadow-primary/20 flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3" />
                            Most Popular
                        </div>
                    </div>
                )}

                <div className={cn(
                    "h-full flex flex-col rounded-[2.5rem] p-8 lg:p-10 transition-all duration-300 border shadow-sm",
                    plan.is_featured 
                        ? "bg-[#0f1117] border-primary/50 dark:border-primary shadow-2xl shadow-primary/10 text-white" 
                        : "bg-card text-card-foreground border-border text-slate-900 dark:text-white"
                )}>
                    <div className="mb-8">
                        <h3 className={cn(
                            "text-xl font-bold mb-2",
                            plan.is_featured ? "text-primary" : "text-slate-900 dark:text-white"
                        )}>{plan.title}</h3>
                        <p className={cn(
                            "text-sm font-medium leading-relaxed",
                            plan.is_featured ? "text-white" : "text-white dark:text-white"
                        )}>{plan.description}</p>
                    </div>

                    <div className="mb-8 flex items-baseline gap-1">
                        <span className="text-4xl lg:text-5xl font-black tracking-tighter">{plan.price}</span>
                        {!isCustom && <span className={cn("text-sm font-bold opacity-60")}>/project</span>}
                    </div>

                    <div className="flex-grow space-y-4 mb-10">
                        {plan.features.map((feature) => (
                            <div key={feature.name} className="flex items-start gap-3">
                                <div className={cn(
                                    "mt-1 p-0.5 rounded-full flex-shrink-0",
                                    plan.is_featured ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
                                )}>
                                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                                </div>
                                <span className={cn(
                                    "text-sm font-semibold",
                                    plan.is_featured ? "text-slate-300" : "text-slate-600 dark:text-white"
                                )}>{feature.name}</span>
                            </div>
                        ))}
                    </div>

                    <Button asChild size="lg" className={cn(
                        "w-full h-14 rounded-2xl font-black text-base transition-all",
                        plan.is_featured 
                            ? "bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25" 
                            : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90"
                    )} onClick={onBookNowClick}>
                        <LoadingLink href={isCustom ? '/contact' : `/checkout?plan=${encodeURIComponent(plan.title)}&price=${parsePrice(plan.price)}`}>
                            {isCustom ? 'Get Custom Quote' : 'Choose Plan'}
                        </LoadingLink>
                    </Button>
                </div>
            </div>
        </ScrollAnimation>
    );
};

interface PageContent {
    title: string;
    subtitle: string;
}

export default function PricingSection() {
    const { trackEvent } = useAnalytics();
    const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
    const [pageContent, setPageContent] = useState<PageContent | null>(null);
    const [vantaSettings, setVantaSettings] = useState<VantaSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [plans, content, vanta] = await Promise.all([
                    getPricingPlans(),
                    getPricingPageContent(),
                    getVantaSettings()
                ]);
                setPricingPlans(plans);
                setPageContent(content);
                setVantaSettings(vanta);
            } catch (error) {
                console.error("Failed to fetch pricing data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleBookNowClick = (plan: PricingPlan) => {
        trackEvent('user_action', {
            action: 'book_now_click',
            planTitle: plan.title,
            planPrice: plan.price
        });
    };

    if (isLoading || !pageContent) return null;
    
    const sectionVantaConfig = vantaSettings?.sections?.pricing;
    const useVanta = vantaSettings?.globalEnable && sectionVantaConfig?.enabled;
    
    return (
        <section id="pricing" className="relative overflow-hidden py-24">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                    {pricingPlans.map((plan, index) => (
                         <PricingCard
                            key={plan.id || index}
                            plan={plan}
                            onBookNowClick={() => handleBookNowClick(plan)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
