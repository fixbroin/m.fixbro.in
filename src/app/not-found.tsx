
import { getSectionSettings } from '@/app/admin/settings/actions/section-actions';
import ScrollAnimation from '@/components/ScrollAnimation';
import LoadingLink from '@/components/LoadingLink';
import { Button } from '@/components/ui/button';
import { Home, MessageSquare } from 'lucide-react';

export default async function NotFound() {
  const sectionSettings = await getSectionSettings();

  return (
    <main className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="container max-w-2xl text-center space-y-12">
        <ScrollAnimation variant="fadeInUp">
          <div className="relative inline-block mb-8">
            <h1 className="text-[10rem] md:text-[15rem] font-black leading-none text-primary/10 select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
               <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                 {sectionSettings.error_title || '404 - Page Not Found'}
               </h2>
            </div>
          </div>
          
          <p className="text-lg md:text-xl font-medium text-slate-600 dark:text-white max-w-lg mx-auto leading-relaxed">
            {sectionSettings.error_subtitle || "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."}
          </p>
        </ScrollAnimation>

        <ScrollAnimation variant="fadeInUp" delay={0.2} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="h-14 px-8 rounded-full font-black text-base shadow-xl shadow-primary/20 w-full sm:w-auto">
            <LoadingLink href={sectionSettings.error_button1_link || '/'}>
              <Home className="mr-2 h-5 w-5" />
              {sectionSettings.error_button1_text || 'Back to Home'}
            </LoadingLink>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-full font-black text-base w-full sm:w-auto border-2">
            <LoadingLink href={sectionSettings.error_button2_link || '/contact'}>
              <MessageSquare className="mr-2 h-5 w-5" />
              {sectionSettings.error_button2_text || 'Contact Support'}
            </LoadingLink>
          </Button>
        </ScrollAnimation>
      </div>
    </main>
  );
}
