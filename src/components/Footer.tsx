
'use client'

import { Facebook, Instagram, Twitter, Linkedin, Youtube, ArrowRight } from 'lucide-react';
import Logo from '@/components/Logo';
import { usePathname } from 'next/navigation';
import type { GeneralSettings } from '@/app/admin/settings/actions/general-actions';
import VantaBackground from './VantaBackground';
import { getVantaSettings } from '@/app/admin/settings/actions/vanta-actions';
import { useEffect, useState } from 'react';
import { VantaSettings } from '@/types/firestore';
import ScrollAnimation from './ScrollAnimation';
import LoadingLink from './LoadingLink';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { subscribeToNewsletter } from '@/app/admin/marketing/newsletter-actions';
import { useToast } from '@/hooks/use-toast';

const navLinks = [
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/contact', label: 'Contact' },
];

const legalLinks = [
    { href: '/terms', label: 'Terms' },
    { href: '/privacy-policy', label: 'Privacy' },
    { href: '/cancellation-policy', label: 'Cancellation' },
    { href: '/refund-policy', label: 'Refund' },
];

export default function Footer({ settings }: { settings: GeneralSettings | null }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const [vantaSettings, setVantaSettings] = useState<VantaSettings | null>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchVantaSettings() {
        const settings = await getVantaSettings();
        setVantaSettings(settings);
    }
    fetchVantaSettings();
  }, [])

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    const res = await subscribeToNewsletter(email);
    setIsSubmitting(false);

    if (res.success) {
        toast({
            title: "Subscribed!",
            description: "You've been added to our cinematic newsletter.",
        });
        setEmail('');
    } else {
        toast({
            title: "Subscription Failed",
            description: res.error,
            variant: "destructive"
        });
    }
  };


  const socialLinks = [
    { href: settings?.facebook_url, icon: Facebook },
    { href: settings?.instagram_url, icon: Instagram },
    { href: settings?.twitter_url, icon: Twitter },
    { href: settings?.linkedin_url, icon: Linkedin },
    { href: settings?.youtube_url, icon: Youtube },
  ].filter(link => link.href);


  if (pathname.startsWith('/admin')) {
      return null;
  }
  
  const sectionVantaConfig = vantaSettings?.sections?.footer;
  const useVanta = vantaSettings?.globalEnable && sectionVantaConfig?.enabled;


  return (
    <footer className={cn(
        "relative pt-24 pb-12 overflow-hidden",
        useVanta ? "" : "bg-slate-900 text-white"
    )}>
        {useVanta && <VantaBackground sectionConfig={sectionVantaConfig} />}
      
      <div className="container relative z-10">
        {/* CTA Banner */}
        <ScrollAnimation variant="fadeInUp" className="mb-20">
            <div className="bg-primary rounded-[3rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-primary/30 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <div className="text-center md:text-left relative z-10">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">Start your digital <br className="hidden md:block" /> journey today.</h2>
                    <p className="text-white font-medium text-lg max-w-md">Join hundreds of successful businesses building the future with us.</p>
                </div>
                <Button asChild size="lg" className="bg-white text-primary hover:bg-slate-50 h-16 px-10 rounded-full font-black text-lg group shadow-xl relative z-10">
                    <LoadingLink href="/contact">
                        Get Started Now
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </LoadingLink>
                </Button>
            </div>
        </ScrollAnimation>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20 border-b border-white/10 pb-20">
          <div className="md:col-span-5 space-y-8 text-center md:text-left">
            <Logo appName={settings?.website_name} logoUrl={settings?.logo} />
            <p className={cn(
                "text-lg font-medium leading-relaxed max-w-sm mx-auto md:mx-0",
                useVanta ? "text-white" : "text-white"
            )}>
              {settings?.footer_description || 'Crafting high-performance websites with modern technology.'}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4">
              {socialLinks.map((link, index) => (
                <a key={index} href={link.href || '#'} target="_blank" rel="noopener noreferrer" 
                   className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all duration-300">
                  <link.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 text-center md:text-left">
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-8">Solutions</h3>
            <ul className="space-y-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <LoadingLink href={link.href} className="text-base font-medium text-white hover:text-primary transition-colors">
                    {link.label}
                  </LoadingLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 text-center md:text-left">
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-8">Newsletter</h3>
            <p className="text-white font-medium mb-6">Stay updated with our latest design trends.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
                <input 
                    type="email" 
                    placeholder="Email address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white" 
                />
                <Button type="submit" disabled={isSubmitting} className="rounded-2xl h-12 px-6 font-bold">
                    {isSubmitting ? '...' : 'Join'}
                </Button>
            </form>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <p className="text-sm font-medium text-white">
            &copy; {new Date().getFullYear()} {settings?.website_name || 'CineElite ADS'}. Engineered with precision.
          </p>
           <ul className="flex flex-wrap justify-center gap-x-8 gap-y-4">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <LoadingLink href={link.href} className="text-sm font-bold uppercase tracking-widest text-white hover:text-primary transition-colors">
                    {link.label}
                  </LoadingLink>
                </li>
              ))}
            </ul>
        </div>
      </div>
    </footer>
  );
}
