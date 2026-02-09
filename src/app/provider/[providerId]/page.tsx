
import { adminDb } from '@/lib/firebaseAdmin';
import { notFound } from 'next/navigation';
import type { ProviderApplication } from '@/types/firestore';
import ProviderDetailsClient from '@/components/provider/ProviderDetailsClient'; // Updated import
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

interface ProviderDetailsPageProps {
  params: { providerId: string };
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


async function getProviderData(providerId: string): Promise<ProviderApplication | null> {
  try {
    const docRef = adminDb.collection('providerApplications').doc(providerId);
    const docSnap = await docRef.get();

    if (docSnap.exists && docSnap.data()?.status === 'approved') {
       // Serialize the entire document data
      return serializeObject({ id: docSnap.id, ...docSnap.data() }) as ProviderApplication;
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
