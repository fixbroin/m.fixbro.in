
import { Phone, Mail, MapPin, Sparkles, Send } from 'lucide-react';
import ContactForm from './ContactForm';
import { getContactDetails } from '@/app/admin/settings/actions/contact-actions';
import { getSeoData } from '../admin/seo-geo-settings/actions';
import ScrollAnimation from '@/components/ScrollAnimation';
import { cn } from '@/lib/utils';

export default async function ContactPage() {
  const contactInfo = await getContactDetails();
  const seoData = await getSeoData('contact');

  const contactDetails = [
    {
      icon: Mail,
      title: 'Email Us',
      value: contactInfo.email,
      href: `mailto:${contactInfo.email}`,
      color: "bg-blue-500"
    },
    {
      icon: Phone,
      title: 'Call Us',
      value: contactInfo.phone,
      href: `tel:${contactInfo.phone}`,
      color: "bg-green-500"
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      value: contactInfo.location,
      href: '#',
      color: "bg-orange-500"
    },
  ];

  return (
    <main className="overflow-hidden">
      {/* Header */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-slate-50 dark:bg-black/20 text-center">
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        </div>
        <div className="container relative z-10">
            <ScrollAnimation variant="fadeInUp">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                    <Send className="h-3 w-3" />
                    <span>Global Communication</span>
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
      <section className="py-24 lg:py-32">
        <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
                
                <div className="lg:col-span-5 space-y-12">
                    <ScrollAnimation variant="slideInLeft" className="space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                Let&apos;s Start a Conversation.
                            </h2>
                            <div className="w-20 h-1.5 bg-primary rounded-full" />
                        </div>
                        <p className="text-lg font-medium text-slate-600 dark:text-white leading-relaxed">
                            Whether you have a specific project in mind or just want to explore the possibilities, our team is ready to help you navigate the digital landscape.
                        </p>
                    </ScrollAnimation>

                    <div className="space-y-6">
                        {contactDetails.map((detail, idx) => (
                            <ScrollAnimation key={detail.title} variant="fadeInUp" delay={idx * 0.1}>
                                <a href={detail.href} className="flex items-center gap-6 p-6 rounded-[2rem] bg-card text-card-foreground border border-border transition-all duration-300 hover:shadow-xl hover:border-primary/30 group">
                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110", detail.color)}>
                                        <detail.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white mb-1">{detail.title}</p>
                                        <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-primary transition-colors">{detail.value}</p>
                                    </div>
                                </a>
                            </ScrollAnimation>
                        ))}
                    </div>

                    <ScrollAnimation variant="fadeInUp" delay={0.4}>
                        <div className="bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                                <Sparkles className="h-12 w-12 text-primary" />
                            </div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">Fast Response Guarantee</h4>
                            <p className="text-sm font-medium text-slate-600 dark:text-white">Our specialists review every inquiry and aim to get back to you within 4 business hours.</p>
                        </div>
                    </ScrollAnimation>
                </div>

                <div className="lg:col-span-7">
                    <ScrollAnimation variant="slideInRight">
                        <div className="bg-card text-card-foreground rounded-[3rem] p-8 md:p-16 border border-border shadow-2xl relative">
                            {/* Decorative background for form */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                            
                            <div className="relative z-10">
                                <ContactForm />
                            </div>
                        </div>
                    </ScrollAnimation>
                </div>
            </div>
        </div>
      </section>
    </main>
  );
}
