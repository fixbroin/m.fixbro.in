import CategoryPageClient from '@/components/category/CategoryPageClient';
import { adminDb } from '@/lib/firebaseAdmin';
import type { FirestoreCategory, FirestoreCity, ProviderApplication } from '@/types/firestore';
import type { BreadcrumbItem } from '@/types/ui';
import { notFound } from 'next/navigation';
import { Timestamp } from 'firebase-admin/firestore';

interface PageProps {
  params: { city: string; categorySlug: string };
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

async function getPageData(citySlug: string, categorySlug: string): Promise<{ city: FirestoreCity | null; category: FirestoreCategory | null; providers: ProviderApplication[] }> {
  let cityData: any | null = null;
  let categoryData: any | null = null;
  let providers: ProviderApplication[] = [];
  console.log(`[CityCategoryPage] Page: getPageData for citySlug: ${citySlug}, categorySlug: ${categorySlug}`);

  try {
    const cityQuery = adminDb.collection('cities').where('slug', '==', citySlug).where('isActive', '==', true).limit(1);
    const citySnapshot = await cityQuery.get();
    if (!citySnapshot.empty) {
      cityData = { id: citySnapshot.docs[0].id, ...citySnapshot.docs[0].data() };
    } else {
      console.warn(`[CityCategoryPage] Page: City not found or inactive for slug: ${citySlug}`);
      return { city: null, category: null, providers: [] };
    }

    const categoryQuery = adminDb.collection('adminCategories').where('slug', '==', categorySlug).limit(1);
    const categorySnapshot = await categoryQuery.get();
    if (!categorySnapshot.empty) {
      categoryData = { id: categorySnapshot.docs[0].id, ...categorySnapshot.docs[0].data() };
    } else {
      console.warn(`[CityCategoryPage] Page: Category not found for slug: ${categorySlug}`);
      return { city: serializeObject(cityData), category: null, providers: [] };
    }

    // Fetch providers
    const providersRef = adminDb.collection('providerApplications');
    const qProviders = providersRef.where('workCategoryId', '==', categoryData.id).where('status', '==', 'approved');
    // TODO: Add location filtering based on cityData if providers have location info.
    const providersSnapshot = await qProviders.get();
    providers = providersSnapshot.docs.map(doc => serializeObject({ ...doc.data(), id: doc.id }) as ProviderApplication);

  } catch (error) {
    console.error(`[CityCategoryPage] Page: Error fetching page data for ${citySlug}/${categorySlug}:`, error);
  }
  
  // Serialize city and category data as well
  const serializedCity = cityData ? serializeObject(cityData) as FirestoreCity : null;
  const serializedCategory = categoryData ? serializeObject(categoryData) as FirestoreCategory : null;

  return { city: serializedCity, category: serializedCategory, providers };
}

export default async function CityCategoryPage({ params }: PageProps) {
  const { city: citySlugParam, categorySlug: categorySlugParam } = params;
  const { city: cityData, category: categoryData, providers } = await getPageData(citySlugParam, categorySlugParam);
  
  if (!categoryData) {
      notFound();
  }

  const breadcrumbItems: BreadcrumbItem[] = [{ label: "Home", href: "/" }];
  if (cityData) {
    breadcrumbItems.push({ label: cityData.name, href: `/${citySlugParam}` });
  } else {
    // Fallback to using slug if cityData is not found, to ensure breadcrumb consistency
    breadcrumbItems.push({ label: citySlugParam.charAt(0).toUpperCase() + citySlugParam.slice(1), href: `/${citySlugParam}` });
  }
  breadcrumbItems.push({ label: categoryData.name });
  
  return (
    <CategoryPageClient
      categorySlug={categorySlugParam}
      citySlug={citySlugParam}
      initialCategory={categoryData}
      initialProviders={providers}
      breadcrumbItems={breadcrumbItems}
    />
  );
}
