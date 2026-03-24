
import Image from 'next/image';
import { getAboutPageContent } from '@/app/admin/settings/actions/about-actions';
import { getSeoData } from '../admin/seo-geo-settings/actions';
import ScrollAnimation from '@/components/ScrollAnimation';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function AboutPage() {
  const content = await getAboutPageContent();
  const seoData = await getSeoData('about');

  if (!content) return null;

  return (
    <main className="overflow-hidden">
      {/* Hero Header */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-slate-50 dark:bg-black/20">
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        </div>
        <div className="container relative z-10 text-center">
            <ScrollAnimation variant="fadeInUp">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                    <Sparkles className="h-3 w-3" />
                    <span>Our Story</span>
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

      {/* Mission Section */}
      <section className="py-24 lg:py-32">
        <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                <ScrollAnimation variant="slideInLeft" className="relative aspect-square w-full">
                    <div className="absolute -inset-4 bg-primary/5 rounded-[3rem] blur-2xl" />
                    <div className="relative h-full w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white dark:border-[#161922]">
                        <Image
                            src={content.mission_image}
                            alt="Our Mission"
                            fill
                            className="object-cover"
                        />
                    </div>
                </ScrollAnimation>
                
                <ScrollAnimation variant="slideInRight" className="space-y-8">
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        {content.mission_title}
                    </h2>
                    <div className="w-20 h-1.5 bg-primary rounded-full" />
                    <div className="space-y-6 text-lg font-medium text-slate-600 dark:text-white leading-relaxed">
                        {content.mission_description.split('\n\n').map((para, i) => (
                            <p key={i}>{para}</p>
                        ))}
                    </div>
                </ScrollAnimation>
            </div>
        </div>
      </section>
      
      {/* Tech Stack Section */}
      <section className="py-24 lg:py-32 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.1),transparent_70%)]" />
        <div className="container relative z-10">
            <ScrollAnimation variant="fadeInUp" className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">{content.stack_title}</h2>
                <p className="mx-auto max-w-2xl text-lg font-medium text-white">
                    {content.stack_description}
                </p>
            </ScrollAnimation>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {content.skills.map((skill, index) => (
                    <ScrollAnimation key={skill.name} variant="zoomIn" delay={index * 0.05}>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-4 group hover:bg-white/10 hover:border-primary/50 transition-all duration-300">
                            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                <Check className="h-5 w-5 stroke-[3]" />
                            </div>
                            <span className="font-bold text-sm md:text-base tracking-tight">{skill.name}</span>
                        </div>
                    </ScrollAnimation>
                ))}
            </div>
        </div>
      </section>
    </main>
  );
}
