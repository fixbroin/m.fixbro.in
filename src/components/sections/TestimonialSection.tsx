
'use client';

import * as React from 'react';
import { getTestimonials, Testimonial } from '@/app/admin/testimonials/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Quote, Star } from 'lucide-react';
import VantaBackground from '../VantaBackground';
import { getVantaSettings } from '@/app/admin/settings/actions/vanta-actions';
import type { VantaSettings } from '@/types/firestore';
import ScrollAnimation from '../ScrollAnimation';
import { cn } from '@/lib/utils';
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"


function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
            <Star
            key={i}
            className={`h-3.5 w-3.5 ${i < rating ? 'text-orange-400 fill-orange-400' : 'text-slate-300 dark:text-slate-700'}`}
            />
        ))}
        </div>
    );
}

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => (
    <div className="relative group h-full bg-card text-card-foreground border border-border rounded-[2.5rem] p-8 lg:p-10 flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/20">
        <div className="absolute top-8 right-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Quote className="h-12 w-12 text-primary" />
        </div>
        
        <div className="mb-6">
            <StarRating rating={testimonial.rating} />
        </div>

        <p className="text-lg font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic mb-8 flex-grow">
            &ldquo;{testimonial.description}&rdquo;
        </p>

        <div className="flex items-center gap-4 pt-6 border-t border-border">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={testimonial.image} alt={testimonial.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">{testimonial.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-black text-slate-900 dark:text-white tracking-tight">{testimonial.name}</p>
                <p className="text-[10px] uppercase tracking-widest font-black text-primary">Verified Client</p>
            </div>
        </div>
    </div>
)

export default function TestimonialSection() {
    const [testimonials, setTestimonials] = React.useState<Testimonial[]>([]);
    const [vantaSettings, setVantaSettings] = React.useState<VantaSettings | null>(null);

    const plugin = React.useRef(
        Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: false })
    );

    React.useEffect(() => {
        async function fetchData() {
            try {
                const [testimonialsData, vantaData] = await Promise.all([
                    getTestimonials(),
                    getVantaSettings()
                ]);
                setTestimonials(testimonialsData);
                setVantaSettings(vantaData);
            } catch (error) {
                console.error("Failed to load testimonials:", error);
            }
        }
        fetchData();
    }, []);

    const sectionVantaConfig = vantaSettings?.sections?.testimonials;
    const useVanta = vantaSettings?.globalEnable && sectionVantaConfig?.enabled;
    
    if (testimonials.length === 0) return null;

  return (
    <section id="testimonials" className={cn("relative overflow-hidden py-24", !useVanta && 'bg-slate-50 dark:bg-black/20')}>
       {useVanta && <VantaBackground sectionConfig={sectionVantaConfig} />}
      
      <div className="container relative z-10">
        <ScrollAnimation as="div" variant="fadeInUp" className="text-center mb-16">
            <h2 className={cn(
                "text-4xl md:text-5xl font-black tracking-tight mb-4",
                useVanta ? "text-white" : "text-slate-900 dark:text-white"
            )}>Client Success Stories</h2>
            <div className="w-20 h-1.5 bg-primary mx-auto rounded-full mb-6" />
            <p className={cn(
                "mx-auto max-w-2xl text-lg font-medium",
                useVanta ? "text-white" : "text-slate-600 dark:text-white"
            )}>
                Experience the impact of our digital craftsmanship through the eyes of our partners.
            </p>
        </ScrollAnimation>

        <div className="px-4 relative group/carousel max-w-6xl mx-auto">
            {testimonials.length > 0 && (
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    plugins={[plugin.current]}
                    className="w-full"
                >
                    <CarouselContent className="-ml-4">
                        {testimonials.map((testimonial) => (
                        <CarouselItem key={testimonial.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/2">
                            <div className='py-4 h-full'>
                                <TestimonialCard testimonial={testimonial} />
                            </div>
                        </CarouselItem>
                        ))}
                    </CarouselContent>
                    <div className="hidden md:block">
                        <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
                        <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
                    </div>
                </Carousel>
            )}
        </div>
      </div>
    </section>
  );
}
