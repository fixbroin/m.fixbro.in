
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getFaqs } from '@/app/admin/settings/actions/faq-actions';
import VantaBackground from '../VantaBackground';
import { getVantaSettings } from '@/app/admin/settings/actions/vanta-actions';
import ScrollAnimation from '../ScrollAnimation';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';
import { getSectionSettings } from '@/app/admin/settings/actions/section-actions';

export default async function FaqSection() {
  const faqs = await getFaqs();
  const vantaSettings = await getVantaSettings();
  const sectionSettings = await getSectionSettings();
  const sectionVantaConfig = vantaSettings?.sections?.faq;
  const useVanta = vantaSettings.globalEnable && sectionVantaConfig?.enabled;

  return (
    <section id="faq" className={cn("relative overflow-hidden py-20 lg:py-28", !useVanta && "bg-secondary/45 border-y border-border/60")}>
      {useVanta && <VantaBackground sectionConfig={sectionVantaConfig} />}
      
      <div className="container relative z-10">
        <ScrollAnimation variant="fadeInUp" className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">
            <HelpCircle className="h-3 w-3" />
            <span>{sectionSettings.faq_badge || 'FAQs'}</span>
          </div>
          <h2 className={cn(
            "font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight mb-4",
            useVanta ? "text-white" : "text-foreground"
          )}>{sectionSettings.faq_title || 'Frequently Asked Questions'}</h2>
          <div className="w-16 h-0.5 bg-primary mx-auto rounded-full mb-5" />
          <p className={cn(
            "mx-auto max-w-2xl text-base md:text-lg font-normal",
            useVanta ? "text-white/85" : "text-muted-foreground"
          )}>
            {sectionSettings.faq_subtitle || 'Get answers to common questions about our interior services, pricing, and project process.'}
          </p>
        </ScrollAnimation>

        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, index) => (
              <ScrollAnimation 
                key={faq.id || index}
                as="div"
                variant='fadeInUp'
                delay={index * 0.05}
              >
                <AccordionItem 
                    value={`item-${index}`} 
                    className={cn(
                        "rounded-[1.25rem] px-6 lg:px-8 border transition-all duration-300 backdrop-blur-md",
                        useVanta 
                            ? "bg-white/10 border-white/15 text-white" 
                            : "bg-card/75 text-card-foreground border-white/50 dark:border-white/10 hover:border-primary/30"
                    )}
                >
                  <AccordionTrigger className="text-left py-5 hover:no-underline hover:text-primary font-semibold text-base md:text-lg transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-muted-foreground text-sm md:text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </ScrollAnimation>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
