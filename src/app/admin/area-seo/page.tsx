import { Metadata } from 'next';
import { APP_NAME } from '@/lib/config';
import AreaSeoManager from './AreaSeoManager';

export const metadata: Metadata = {
  title: `Area-wise SEO | Admin | ${APP_NAME}`,
  robots: { index: false, follow: false },
};

export default function AreaSeoPage() {
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Area-wise SEO</h1>
        <p className="text-muted-foreground mt-1">
          Auto-generate and manage hyper-local area SEO pages for each city using OpenStreetMap.
        </p>
      </div>
      <AreaSeoManager />
    </div>
  );
}
