
import type { Metadata } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import type { ProviderApplication } from '@/types/firestore';

export const dynamic = 'force-dynamic';

interface ProviderDetailsLayoutProps {
  params: { providerId: string };
}

async function getProviderData(providerId: string): Promise<ProviderApplication | null> {
  try {
    const docRef = adminDb.collection('providerApplications').doc(providerId);
    const docSnap = await docRef.get();
    if (docSnap.exists && docSnap.data()?.status === 'approved') {
      return { id: docSnap.id, ...docSnap.data() } as ProviderApplication;
    }
    return null;
  } catch (error) {
    console.error("Error fetching provider data for metadata:", error);
    return null;
  }
}

export async function generateMetadata({ params }: ProviderDetailsLayoutProps): Promise<Metadata> {
  const provider = await getProviderData(params.providerId);

  if (!provider) {
    return {
      title: 'Provider Not Found',
      description: 'The requested service provider could not be found.',
    };
  }

  const title = `${provider.fullName || 'Service Provider'} - ${provider.skillLevelLabel || provider.workCategoryName}`;
  const description = provider.bio || `Learn more about ${provider.fullName}, an expert in ${provider.workCategoryName} services. View ratings, reviews, and portfolio.`;

  return {
    title,
    description,
    openGraph: {
      title: title,
      description: description,
      type: 'profile',
      images: provider.profilePhotoUrl ? [{ url: provider.profilePhotoUrl, alt: provider.fullName }] : [],
    },
  };
}

export default function ProviderDetailsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
