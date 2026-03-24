
import ContactForm from "@/app/contact/ContactForm";
import VantaBackground from '../VantaBackground';
import { getVantaSettings } from '@/app/admin/settings/actions/vanta-actions';
import { getContactDetails } from '@/app/admin/settings/actions/contact-actions';
import ScrollAnimation from '../ScrollAnimation';
import { cn } from '@/lib/utils';
import { Mail, MessageSquare, Phone, Send } from 'lucide-react';

export default async function ContactSection() {
  const [vantaSettings, contactInfo] = await Promise.all([
    getVantaSettings(),
    getContactDetails()
  ]);

  const sectionVantaConfig = vantaSettings?.sections?.contact;
  const useVanta = vantaSettings.globalEnable && sectionVantaConfig?.enabled;

  const contactList = [
    { icon: Mail, label: "Email Us", value: contactInfo?.email, color: "bg-blue-500" },
    { icon: MessageSquare, label: "WhatsApp", value: contactInfo?.phone, color: "bg-green-500" },
    { icon: Phone, label: "Call Directly", value: contactInfo?.phone, color: "bg-purple-500" }
  ].filter(item => item.value && item.value !== '');

  return (
    <section id="contact" className="relative overflow-hidden py-24">
      {useVanta && <VantaBackground sectionConfig={sectionVantaConfig} />}
      
      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          <div className="lg:col-span-5 space-y-10">
            <ScrollAnimation variant="fadeInUp">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                    <Send className="h-3 w-3" />
                    <span>Get in Touch</span>
                </div>
                <h2 className={cn(
                    "text-4xl md:text-5xl font-black tracking-tight mb-6",
                    useVanta ? "text-white" : "text-slate-900 dark:text-white"
                )}>Let&apos;s Build Something Extraordinary</h2>
                <p className={cn(
                    "text-lg font-medium leading-relaxed",
                    useVanta ? "text-white" : "text-slate-600 dark:text-white"
                )}>
                    Have a vision? We have the tools to make it a reality. Reach out for a free consultation or a project quote.
                </p>
            </ScrollAnimation>

            <div className="space-y-6">
                {contactList.map((item, idx) => (
                    <ScrollAnimation key={idx} variant="fadeInUp" delay={idx * 0.1}>
                        <div className={cn(
                            "flex items-center gap-6 p-6 rounded-[2rem] border transition-all duration-300",
                            useVanta 
                                ? "bg-white/5 border-white/10 text-white" 
                                : "bg-card text-card-foreground border-border hover:border-primary/30"
                        )}>
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/5", item.color)}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className={cn(
                                    "text-[10px] font-black uppercase tracking-widest mb-1",
                                    useVanta ? "text-white/60" : "text-muted-foreground"
                                )}>{item.label}</p>
                                <p className={cn(
                                    "text-lg font-bold tracking-tight",
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
                    "rounded-[3rem]",
                    useVanta && "p-1 md:p-1 border border-white/10 bg-white/5 backdrop-blur-xl"
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
