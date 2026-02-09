import { adminDb } from '@/lib/firebaseAdmin';
import type { FirestoreCategory, FirestoreCity, FirestoreArea, ProviderApplication } from '@/types/firestore';
import CategoryPageClient from '@/components/category/CategoryPageClient';
import type { BreadcrumbItem } from '@/types/ui';
import { notFound } from 'next/navigation';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

interface AreaCategoryPageProps {
  params: { city: string; area: string; categorySlug: string };
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

async function getPageData(citySlug: string, areaSlug: string, categorySlug: string): Promise<{ city: FirestoreCity | null; area: FirestoreArea | null; category: FirestoreCategory | null; providers: ProviderApplication[] }> {
  try {
    // Fetch city, then area, then category
    const citiesRef = adminDb.collection('cities');
    const cityQuery = citiesRef.where('slug', '==', citySlug).where('isActive', '==', true).limit(1);
    const citySnapshot = await cityQuery.get();
    if (citySnapshot.empty) return { city: null, area: null, category: null, providers: [] };
    const cityData = { id: citySnapshot.docs[0].id, ...citySnapshot.docs[0].data() };

    const areasRef = adminDb.collection('areas');
    const areaQuery = areasRef.where('cityId', '==', cityData.id).where('slug', '==', areaSlug).where('isActive', '==', true).limit(1);
    const areaSnapshot = await areaQuery.get();
    if (areaSnapshot.empty) return { city: serializeObject(cityData) as FirestoreCity, area: null, category: null, providers: [] };
    const areaData = { id: areaSnapshot.docs[0].id, ...areaSnapshot.docs[0].data() };

    const categoriesRef = adminDb.collection('adminCategories');
    const categoryQuery = categoriesRef.where('slug', '==', categorySlug).limit(1);
    const categorySnapshot = await categoryQuery.get();
    if (categorySnapshot.empty) return { city: serializeObject(cityData) as FirestoreCity, area: serializeObject(areaData) as FirestoreArea, category: null, providers: [] };
    const categoryData = { id: categorySnapshot.docs[0].id, ...categorySnapshot.docs[0].data() };

    // Fetch providers
    const providersRef = adminDb.collection('providerApplications');
    const qProviders = providersRef.where('workCategoryId', '==', categoryData.id).where('status', '==', 'approved');
    // TODO: Add more precise location filtering based on areaData and provider's workArea
    const providersSnapshot = await qProviders.get();
    
    // Serialize providers to convert Timestamps
    const providers = providersSnapshot.docs.map(doc => {
      const data = doc.data();
      return serializeObject({ ...data, id: doc.id }) as ProviderApplication;
    });
    
    const serializedCity = serializeObject(cityData) as FirestoreCity;
    const serializedArea = serializeObject(areaData) as FirestoreArea;
    const serializedCategory = serializeObject(categoryData) as FirestoreCategory;

    return { city: serializedCity, area: serializedArea, category: serializedCategory, providers };
  } catch (error) {
    console.error(`Error fetching page data for ${citySlug}/${areaSlug}/${categorySlug}:`, error);
    return { city: null, area: null, category: null, providers: [] };
  }
}

export default async function AreaCategoryPage({ params }: AreaCategoryPageProps) {
  const { city: citySlug, area: areaSlug, categorySlug: catSlug } = params;

  const { city, area, category, providers } = await getPageData(citySlug, areaSlug, catSlug);
  
  if (!category) {
      notFound();
  }

  const breadcrumbItems: BreadcrumbItem[] = [{ label: "Home", href: "/" }];
  if (city) {
    breadcrumbItems.push({ label: city.name, href: `/${citySlug}` });
    if (area) {
      breadcrumbItems.push({ label: area.name, href: `/${citySlug}/${areaSlug}` });
    }
  }
  breadcrumbItems.push({ label: category.name });

  return <CategoryPageClient
    categorySlug={catSlug}
    citySlug={citySlug}
    areaSlug={areaSlug}
    initialCategory={category}
    initialProviders={providers}
    breadcrumbItems={breadcrumbItems}
  />;
}
