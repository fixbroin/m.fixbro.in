
'use client';

import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getPricingPlans, getPricingPageContent, PricingPlan } from '@/app/admin/settings/actions/pricing-actions';
import { getGeneralSettings } from '@/app/admin/settings/actions/general-actions';
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

const PricingCard = ({ plan, currencySymbol, onBookNowClick }: { plan: PricingPlan; currencySymbol: string; onBookNowClick: () => void }) => {
    const isCustom = !plan.is_enabled;
    const buttonLabel = isCustom ? 'Contact Us' : 'Choose Plan';
    const linkHref = isCustom 
        ? '/contact' 
        : `/checkout?plan=${encodeURIComponent(plan.title)}&price=${parsePrice(plan.value)}`;
    
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
                    "h-full flex flex-col rounded-[1.75rem] p-8 lg:p-10 transition-all duration-300 border shadow-sm backdrop-blur-md",
                    plan.is_featured 
                        ? "bg-[#06232b]/90 border-primary shadow-2xl text-white" 
                        : "bg-card/75 text-card-foreground border-white/50 dark:border-white/10"
                )}>
                    <div className="mb-8">
                        <h3 className={cn(
                            "font-display text-2xl font-semibold mb-2",
                            plan.is_featured ? "text-white" : "text-foreground"
                        )}>{plan.title}</h3>
                        <p className={cn(
                            "text-sm leading-relaxed",
                            plan.is_featured ? "text-white/75" : "text-muted-foreground"
                        )}>{plan.description}</p>
                    </div>

                    <div className="mb-8 flex items-baseline gap-1">
                        {plan.is_enabled ? (
                            <>
                                <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight">
                                  {parsePrice(plan.value) > 0
                                    ? `${currencySymbol}${parsePrice(plan.value).toLocaleString()}`
                                    : plan.value}
                                </span>
                                <span className={cn("text-sm font-bold opacity-60")}>/sq.ft</span>
                            </>
                        ) : (
                            <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight">{plan.value}</span>
                        )}
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
                        <LoadingLink href={linkHref}>
                            {buttonLabel}
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

interface PricingSectionProps {
    hideHeader?: boolean;
    initialPlans?: PricingPlan[];
    initialPageContent?: PageContent | null;
    initialVantaSettings?: VantaSettings | null;
    initialCurrencySymbol?: string;
}

export default function PricingSection({
    hideHeader = false,
    initialPlans,
    initialPageContent = null,
    initialVantaSettings = null,
    initialCurrencySymbol = '₹',
}: PricingSectionProps) {
    const { trackEvent } = useAnalytics();
    const hasInitialData = Boolean(initialPlans && initialPageContent);
    const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(initialPlans || []);
    const [pageContent, setPageContent] = useState<PageContent | null>(initialPageContent);
    const [vantaSettings, setVantaSettings] = useState<VantaSettings | null>(initialVantaSettings);
    const [currencySymbol, setCurrencySymbol] = useState<string>(initialCurrencySymbol);
    const [isLoading, setIsLoading] = useState(!hasInitialData);

    useEffect(() => {
        if (hasInitialData) return;
        async function fetchData() {
            try {
                const [plans, content, vanta, general] = await Promise.all([
                    getPricingPlans(),
                    getPricingPageContent(),
                    getVantaSettings(),
                    getGeneralSettings()
                ]);
                setPricingPlans(plans);
                setPageContent(content);
                setVantaSettings(vanta);
                if (general?.currency_symbol) {
                    setCurrencySymbol(general.currency_symbol);
                }
            } catch (error) {
                console.error("Failed to fetch pricing data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [hasInitialData]);

    const handleBookNowClick = (plan: PricingPlan) => {
        trackEvent('user_action', {
            action: 'book_now_click',
            planTitle: plan.title,
            planPrice: plan.value
        });
    };

    if (isLoading || !pageContent) return null;
    
    const sectionVantaConfig = vantaSettings?.sections?.pricing;
    const useVanta = vantaSettings?.globalEnable && sectionVantaConfig?.enabled;
    
    return (
        <section id="pricing" className={cn("relative overflow-hidden py-20 lg:py-28", !useVanta && "bg-secondary/45 border-y border-border/60")}>
            {useVanta && <VantaBackground sectionConfig={sectionVantaConfig} />}
            <div className="container relative z-10">
                {!hideHeader && (
                <ScrollAnimation variant="fadeInUp" className="text-center mb-16">
                    <h2 className={cn(
                        "font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight mb-4",
                        useVanta ? "text-white" : "text-foreground"
                    )}>{pageContent.title}</h2>
                    <div className="w-16 h-0.5 bg-primary mx-auto rounded-full mb-5" />
                    <p className={cn(
                        "mx-auto max-w-2xl text-base md:text-lg font-normal",
                        useVanta ? "text-white/85" : "text-muted-foreground"
                    )}>
                        {pageContent.subtitle}
                    </p>
                </ScrollAnimation>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                    {pricingPlans.map((plan, index) => (
                         <PricingCard
                            key={plan.id || index}
                            plan={plan}
                            currencySymbol={currencySymbol}
                            onBookNowClick={() => handleBookNowClick(plan)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
