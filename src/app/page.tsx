
import HeroSection from '@/components/sections/HeroSection';
import ServicesSection from '@/components/sections/ServicesSection';
import WhyChooseUsSection from '@/components/sections/WhyChooseUsSection';
import PortfolioSection from '@/components/sections/PortfolioSection';
import PricingSection from '@/components/sections/PricingSection';
import TestimonialSection from '@/components/sections/TestimonialSection';
import FaqSection from '@/components/sections/FaqSection';
import ContactSection from '@/components/sections/ContactSection';

export default function Home() {
  return (
    <main>
      <HeroSection />
      <ServicesSection />
      <WhyChooseUsSection />
      <PortfolioSection />
      <PricingSection />
      <TestimonialSection />
      <FaqSection />
      <ContactSection />
    </main>
  );
}
