
import ContactForm from "@/app/contact/ContactForm";
import VantaBackground from '../VantaBackground';
import { getVantaSettings } from '@/app/admin/settings/actions/vanta-actions';
import { getContactDetails } from '@/app/admin/settings/actions/contact-actions';
import ScrollAnimation from '../ScrollAnimation';
import { cn } from '@/lib/utils';
import { Mail, MessageSquare, Phone, Send } from 'lucide-react';
import { getSectionSettings } from '@/app/admin/settings/actions/section-actions';

export default async function ContactSection() {
  const [vantaSettings, contactInfo, sectionSettings] = await Promise.all([
    getVantaSettings(),
    getContactDetails(),
    getSectionSettings()
  ]);

  const sectionVantaConfig = vantaSettings?.sections?.contact;
  const useVanta = vantaSettings.globalEnable && sectionVantaConfig?.enabled;

  const contactList = [
    { icon: Mail, label: "Email Us", value: contactInfo?.email, color: "bg-blue-500" },
    { icon: MessageSquare, label: "WhatsApp", value: contactInfo?.phone, color: "bg-green-500" },
    { icon: Phone, label: "Call Directly", value: contactInfo?.phone, color: "bg-purple-500" }
  ].filter(item => item.value && item.value !== '');

  return (
    <section id="contact" className={cn("relative overflow-hidden py-20 lg:py-28", !useVanta && "bg-background")}>
      {useVanta && <VantaBackground sectionConfig={sectionVantaConfig} />}
      
      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          <div className="lg:col-span-5 space-y-8">
            <ScrollAnimation variant="fadeInUp">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">
                    <Send className="h-3 w-3" />
                    <span>{sectionSettings.contact_badge || 'Get in Touch'}</span>
                </div>
                <h2 className={cn(
                    "font-display text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight tracking-tight mb-5",
                    useVanta ? "text-white" : "text-foreground"
                )}>{sectionSettings.contact_title || 'Start Your Home Interior Project'}</h2>
                <p className={cn(
                    "text-base md:text-lg font-normal leading-relaxed",
                    useVanta ? "text-white/85" : "text-muted-foreground"
                )}>
                    {sectionSettings.contact_description || 'Looking to upgrade your home? Get expert interior solutions including modular kitchen, wardrobes, furniture, and complete home interiors. Contact us for a free site visit and quotation.'}
                </p>
            </ScrollAnimation>

            <div className="space-y-4">
                {contactList.map((item, idx) => (
                    <ScrollAnimation key={idx} variant="fadeInUp" delay={idx * 0.1}>
                        <div className={cn(
                            "flex items-center gap-5 p-5 rounded-[1.5rem] border transition-all duration-300 backdrop-blur-md",
                            useVanta 
                                ? "bg-white/10 border-white/15 text-white" 
                                : "bg-card/75 text-card-foreground border-white/50 dark:border-white/10 hover:border-primary/30"
                        )}>
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md", item.color)}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className={cn(
                                    "text-[10px] font-semibold uppercase tracking-widest mb-1",
                                    useVanta ? "text-white/60" : "text-muted-foreground"
                                )}>{item.label}</p>
                                <p className={cn(
                                    "text-base md:text-lg font-semibold tracking-tight",
                                    useVanta ? "text-white" : "text-foreground"
                                )}>{item.value}</p>
                            </div>
                        </div>
                    </ScrollAnimation>
                ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            <ScrollAnimation variant="slideInRight">
                <div className={cn(
                    "rounded-[2rem]",
                    useVanta && "p-1 border border-white/10 bg-white/5 backdrop-blur-xl"
                )}>
                    <ContactForm />
                </div>
            </ScrollAnimation>
          </div>

        </div>
      </div>
    </section>
  );
}
