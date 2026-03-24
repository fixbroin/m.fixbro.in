
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

export default async function FaqSection() {
  const faqs = await getFaqs();
  const vantaSettings = await getVantaSettings();
  const sectionVantaConfig = vantaSettings?.sections?.faq;
  const useVanta = vantaSettings.globalEnable && sectionVantaConfig?.enabled;

  return (
    <section id="faq" className="relative overflow-hidden py-24 bg-slate-50 dark:bg-black/20">
      {useVanta && <VantaBackground sectionConfig={sectionVantaConfig} />}
      
      <div className="container relative z-10">
        <ScrollAnimation variant="fadeInUp" className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            <HelpCircle className="h-3 w-3" />
            <span>Support Center</span>
          </div>
          <h2 className={cn(
            "text-4xl md:text-5xl font-black tracking-tight mb-4",
            useVanta ? "text-white" : "text-slate-900 dark:text-white"
          )}>Common Enquiries</h2>
          <div className="w-20 h-1.5 bg-primary mx-auto rounded-full mb-6" />
          <p className={cn(
            "mx-auto max-w-2xl text-lg font-medium",
            useVanta ? "text-white" : "text-slate-600 dark:text-white"
          )}>
            Find quick answers to common questions about our design process and development standards.
          </p>
        </ScrollAnimation>

        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <ScrollAnimation 
                key={faq.id || index}
                as="div"
                variant='fadeInUp'
                delay={index * 0.1}
              >
                <AccordionItem 
                    value={`item-${index}`} 
                    className={cn(
                        "rounded-[2rem] px-6 lg:px-8 border transition-all duration-300",
                        useVanta 
                            ? "bg-white/5 border-white/10 text-white" 
                            : "bg-card text-card-foreground border-border hover:border-primary/30"
                    )}
                >
                  <AccordionTrigger className="text-left py-6 hover:no-underline hover:text-primary font-bold text-lg md:text-xl transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-slate-600 dark:text-white text-base leading-relaxed font-medium">
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
