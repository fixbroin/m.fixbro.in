
import { Metadata } from 'next';
import { APP_NAME } from '@/lib/config';
import { Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HomePageSettings from './HomePageSettings';
import AboutPageSettings from './AboutPageSettings';
import ContactPageSettings from './ContactPageSettings';
import PortfolioPageSettings from './PortfolioPageSettings';
import PricingPageSettings from './PricingPageSettings';
import ServicesPageSettings from './ServicesPageSettings';
import PaymentGatewaySettings from './PaymentGatewaySettings';
import EmailConfigurationSettings from './EmailConfigurationSettings';
import GeneralSettings from './GeneralSettings';
import LegalPagesSettings from './LegalPagesSettings';
import WhyChooseUsSettings from './WhyChooseUsSettings';
import FaqSettings from './FaqSettings';
import ThemeSettings from './ThemeSettings';
import VantaSettings from './VantaSettings';

export const metadata: Metadata = {
  title: `Website Settings | ${APP_NAME}`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsPage() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Website Settings</h1>
        <p className="text-muted-foreground">Manage global website information, branding assets, and content pages.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="vanta">Vanta JS</TabsTrigger>
          <TabsTrigger value="home">Home Page</TabsTrigger>
          <TabsTrigger value="why-choose-us">Why Us</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>
        <TabsContent value="theme">
          <ThemeSettings />
        </TabsContent>
        <TabsContent value="vanta">
          <VantaSettings />
        </TabsContent>
        <TabsContent value="home">
          <HomePageSettings />
        </TabsContent>
        <TabsContent value="why-choose-us">
          <WhyChooseUsSettings />
        </TabsContent>
        <TabsContent value="services">
          <ServicesPageSettings />
        </TabsContent>
        <TabsContent value="portfolio">
          <PortfolioPageSettings />
        </TabsContent>
        <TabsContent value="pricing">
          <PricingPageSettings />
        </TabsContent>
        <TabsContent value="about">
          <AboutPageSettings />
        </TabsContent>
        <TabsContent value="contact">
          <ContactPageSettings />
        </TabsContent>
         <TabsContent value="faq">
          <FaqSettings />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentGatewaySettings />
        </TabsContent>
        <TabsContent value="email">
          <EmailConfigurationSettings />
        </TabsContent>
        <TabsContent value="legal">
          <LegalPagesSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
