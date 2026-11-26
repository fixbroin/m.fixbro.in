
import { Metadata } from 'next';
import { Suspense } from 'react';
import { APP_NAME } from '@/lib/config';
import { getGeneralSettings } from '@/app/admin/settings/actions/general-actions';
import CheckoutClient from './CheckoutClient';
import { Skeleton } from '@/components/ui/skeleton';
import Script from 'next/script';

export const metadata: Metadata = {
  title: `Checkout | ${APP_NAME}`,
  robots: {
    index: false,
    follow: false,
  },
};

async function CheckoutPageContent({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const planTitle = typeof searchParams.plan === 'string' ? searchParams.plan : 'Selected Plan';
  const planPrice = typeof searchParams.price === 'string' ? Number(searchParams.price) : 0;
  const settings = await getGeneralSettings();
  const currencySymbol = settings?.currency_symbol || '₹';

  if (planPrice <= 0 || !planTitle) {
      return (
          <div className='container text-center py-20'>
              <p className='text-destructive'>Invalid plan details. Please go back to the pricing page and select a plan.</p>
          </div>
      )
  }

  return (
    <CheckoutClient
      planTitle={planTitle}
      ratePerSqFt={planPrice}
      currencySymbol={currencySymbol}
    />
  );
}


function CheckoutSkeleton() {
    return (
        <div className="container py-12 md:py-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                <div className='md:order-last'>
                    <Skeleton className='h-48 w-full' />
                </div>
                <div>
                     <Skeleton className='h-96 w-full' />
                </div>
            </div>
        </div>
    )
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedSearchParams = await searchParams;
    return (
        <>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
            <Suspense fallback={<CheckoutSkeleton />}>
                <CheckoutPageContent searchParams={resolvedSearchParams} />
            </Suspense>
        </>
    )
}
