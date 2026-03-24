
import { Metadata } from 'next';
import { APP_NAME } from '@/lib/config';
import { Megaphone, Info, Sparkles } from 'lucide-react';
import MarketingSetupForm from './MarketingSetupForm';
import NewsletterSubscribers from './NewsletterSubscribers';
import ScrollAnimation from '@/components/ScrollAnimation';

export const metadata: Metadata = {
  title: `Marketing & SEO | ${APP_NAME}`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function MarketingSetupPage() {
  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">Marketing & Growth</h1>
            <p className="mt-2 text-muted-foreground font-medium">
                Manage your tracking pixels, marketing scripts, and audience data.
            </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
            <Sparkles className="h-4 w-4" />
            <span>Conversion Optimized</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Main Configuration Form */}
        <div className="xl:col-span-7 space-y-8">
            <div className="bg-card text-card-foreground border border-border rounded-[2rem] p-6 flex items-start gap-4 shadow-sm">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                    <Info className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Pixel & Script Injection</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed font-medium">
                        Configure Google Tag Manager, Meta Pixel, and custom tracking scripts. These are automatically injected into your public website.
                    </p>
                </div>
            </div>
            
            <MarketingSetupForm />
        </div>

        {/* Newsletter & Audience Management */}
        <div className="xl:col-span-5 space-y-8">
            <NewsletterSubscribers />
            
            {/* Strategy Card */}
            <div className="bg-gradient-to-br from-primary to-purple-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:rotate-12 transition-transform duration-500">
                    <Megaphone className="h-24 w-24" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-black tracking-tight mb-4 text-white">Marketing Tip</h3>
                    <p className="text-white font-medium leading-relaxed">
                        Consistent newsletter updates can increase your brand recall by up to 40%. Use the subscriber list to launch targeted email campaigns.
                    </p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
