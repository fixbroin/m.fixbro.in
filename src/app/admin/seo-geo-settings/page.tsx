
import { Metadata } from 'next';
import { APP_NAME } from '@/lib/config';
import { Globe } from 'lucide-react';
import SeoGeoSettingsForm from './SeoGeoSettingsForm';

export const metadata: Metadata = {
  title: `SEO & Geo Settings | ${APP_NAME}`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function SeoGeoSettingsPage() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">SEO & Geo Settings</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Manage page titles, descriptions, and other SEO-related content for your website pages.
        </p>
      </div>
      <div className="mx-auto max-w-3xl">
        <div className="rounded-lg border bg-card text-card-foreground p-6 mb-8 flex items-start gap-4">
          <Globe className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-headline text-lg font-semibold">How it works</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Select a page from the dropdown to load its current SEO and content data. Make your changes in the fields below and click "Save Changes" to update the live page.
            </p>
          </div>
        </div>
        <SeoGeoSettingsForm />
      </div>
    </div>
  );
}
