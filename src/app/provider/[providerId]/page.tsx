
import { adminDb } from '@/lib/firebaseAdmin';
import { notFound } from 'next/navigation';
import type { ProviderApplication, FirestoreCategory } from '@/types/firestore';
import ProviderDetailsClient from '@/components/provider/ProviderDetailsClient'; // Updated import
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

interface ProviderDetailsPageProps {
  params: { providerId: string };
}

// New interface for enriched data
export interface EnrichedProviderData extends ProviderApplication {
  workCategorySlug?: string;
}

// Helper to serialize Firestore Timestamps recursively
const serializeObject = (data: any): any => {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }
  if (Array.isArray(data)) {
    return data.map(serializeObject);
  }
  const newObj: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      newObj[key] = serializeObject(data[key]);
    }
  }
  return newObj;
};


async function getProviderData(providerId: string): Promise<EnrichedProviderData | null> {
  try {
    const docRef = adminDb.collection('providerApplications').doc(providerId);
    const docSnap = await docRef.get();

    if (docSnap.exists && docSnap.data()?.status === 'approved') {
        const providerData = { id: docSnap.id, ...docSnap.data() } as EnrichedProviderData;
        
        // Fetch category slug
        if (providerData.workCategoryId) {
            const categoryDocRef = adminDb.collection('adminCategories').doc(providerData.workCategoryId);
            const categoryDocSnap = await categoryDocRef.get();
            if(categoryDocSnap.exists){
                const categoryData = categoryDocSnap.data() as FirestoreCategory;
                providerData.workCategorySlug = categoryData.slug;
            }
        }
        return serializeObject(providerData) as EnrichedProviderData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching provider data:", error);
    return null;
  }
}

export default async function ProviderDetailsPage({ params }: ProviderDetailsPageProps) {
  const providerData = await getProviderData(params.providerId);

  if (!providerData) {
    notFound();
  }

  // Pass the fetched and serialized data to the client component
  return <ProviderDetailsClient initialProviderData={providerData} />;
}
