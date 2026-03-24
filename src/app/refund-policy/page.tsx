
import { Metadata } from 'next';
import { getLegalPageContent } from '@/app/admin/settings/actions/legal-actions';
import { APP_NAME, WEBSITE_URL } from '@/lib/config';

export async function generateMetadata(): Promise<Metadata> {
    const page = await getLegalPageContent('refund-policy');
    return {
        title: `${page?.title || 'Refund Policy'} | ${APP_NAME}`,
        description: `Read the Refund Policy for the ${APP_NAME} website and services.`,
        alternates: {
          canonical: `${WEBSITE_URL}/refund-policy`,
        },
    };
}

export default async function RefundPolicyPage() {
  const page = await getLegalPageContent('refund-policy');

  if (!page) {
    return <p className="text-center py-20">Could not load page content.</p>;
  }

  return (
    <div className="container py-12 md:py-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-center">
          {page.title}
        </h1>
        <div 
          className="prose prose-lg dark:prose-invert mt-12 mx-auto"
          dangerouslySetInnerHTML={{ __html: page.content.replace(/\n/g, '<br />') }}
        />
      </div>
    </div>
  );
}
