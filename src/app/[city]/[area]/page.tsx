
import HomePageClient from '@/components/home/HomePageClient';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { adminDb } from '@/lib/firebaseAdmin';
import type { FirestoreArea, FirestoreCity } from '@/types/firestore';
import type { BreadcrumbItem } from '@/types/ui';
import { notFound } from 'next/navigation'; // Import notFound

export const dynamic = 'force-dynamic';

interface AreaPageProps {
  params: { city: string; area: string };
}

async function getAreaDataForPage(citySlug: string, areaSlug: string): Promise<(FirestoreArea & { parentCityData?: FirestoreCity }) | null> {
  try {
    const citiesRef = adminDb.collection('cities');
    const cityQuery = citiesRef.where('slug', '==', citySlug).where('isActive', '==', true).limit(1);
    const citySnapshot = await cityQuery.get();

    if (citySnapshot.empty) {
      console.warn(`[AreaPage] City not found or inactive: ${citySlug}`);
      return null;
    }
    const parentCityDoc = citySnapshot.docs[0];
    const parentCityData = { id: parentCityDoc.id, ...parentCityDoc.data() } as FirestoreCity;

    const areasRef = adminDb.collection('areas');
    const areaQuery = areasRef
      .where('slug', '==', areaSlug)
      .where('cityId', '==', parentCityData.id) // Correctly use the fetched city ID
      .where('isActive', '==', true)
      .limit(1);
    const areaSnapshot = await areaQuery.get();

    if (areaSnapshot.empty) {
      console.warn(`[AreaPage] Area not found or inactive: ${areaSlug} in city ${citySlug}`);
      return null;
    }
    const doc = areaSnapshot.docs[0];
    const areaData = { id: doc.id, ...doc.data() } as FirestoreArea;
    return { ...areaData, parentCityData };

  } catch (error) {
    console.error(`[AreaPage] Error fetching area data for page:`, error);
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const citiesSnapshot = await adminDb.collection('cities').where('isActive', '==', true).get();
    const paramsArray: { city: string; area: string }[] = [];

    for (const cityDoc of citiesSnapshot.docs) {
      const cityData = cityDoc.data() as FirestoreCity;
      if (!cityData.slug || cityData.slug.includes('.')) continue; 
      const areasQuery = adminDb
        .collection('areas')
        .where('cityId', '==', cityDoc.id)
        .where('isActive', '==', true);
      const areasSnapshot = await areasQuery.get();
      areasSnapshot.docs.forEach(areaDoc => {
        const areaData = areaDoc.data() as FirestoreArea;
        if (areaData.slug && !areaData.slug.includes('.')) { 
          paramsArray.push({ city: cityData.slug!, area: areaData.slug });
        }
      });
    }
    return paramsArray;
  } catch (error) {
    console.error("Error generating static params for area pages:", error);
    return [];
  }
}

export default async function AreaHomePage({ params }: AreaPageProps) {
  const { city: citySlug, area: areaSlug } = await params;

  if (citySlug.includes('.') || areaSlug.includes('.')) {
    notFound();
  }
  const areaData = await getAreaDataForPage(citySlug, areaSlug);
  
  if (!areaData) {
    notFound();
  }

  const breadcrumbItems: BreadcrumbItem[] = [{ label: "Home", href: "/" }];
  if (areaData && areaData.parentCityData) {
    breadcrumbItems.push({ label: areaData.parentCityData.name, href: `/${citySlug}` });
    breadcrumbItems.push({ label: areaData.name });
  } else {
    // This case should ideally not be reached if notFound() works correctly
    breadcrumbItems.push({ label: "Location Not Found" });
  }

  return (
    <>
      <HomePageClient citySlug={citySlug} areaSlug={areaSlug} breadcrumbItems={breadcrumbItems} />
    </>
  );
}
