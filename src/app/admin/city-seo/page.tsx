import { Metadata } from 'next';
import { APP_NAME } from '@/lib/config';
import CitySeoManager from './CitySeoManager';

export const metadata: Metadata = {
  title: `City-wise SEO | Admin | ${APP_NAME}`,
  robots: { index: false, follow: false },
};

export default function CitySeoPage() {
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold">City-wise SEO</h1>
        <p className="text-muted-foreground mt-1">
          Auto-generate and manage unique SEO homepages for cities using OpenStreetMap.
        </p>
      </div>
      <CitySeoManager />
    </div>
  );
}
