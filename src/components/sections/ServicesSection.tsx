import { getServices, getServicesPageContent } from '@/app/admin/settings/actions/services-actions';
import VantaBackground from '../VantaBackground';
import { getVantaSettings } from '@/app/admin/settings/actions/vanta-actions';
import ServicesArcCarousel from './ServicesArcCarousel';
import { cn } from '@/lib/utils';

export default async function ServicesSection() {
  const [services, pageContent, vantaSettings] = await Promise.all([
    getServices(),
    getServicesPageContent(),
    getVantaSettings(),
  ]);

  const sectionVantaConfig = vantaSettings?.sections?.services;
  const useVanta = vantaSettings.globalEnable && sectionVantaConfig?.enabled;

  if (!services || services.length === 0) return null;

  return (
    <section
      id="services"
      className={cn(
        'relative overflow-hidden py-20 lg:py-28',
        useVanta ? '' : 'bg-background'
      )}
    >
      {useVanta && <VantaBackground sectionConfig={sectionVantaConfig} />}
      <ServicesArcCarousel
        services={services}
        title={pageContent.title}
        subtitle={pageContent.subtitle}
        useVanta={useVanta}
      />
    </section>
  );
}
