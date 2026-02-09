import CategoryPageClient from '@/components/category/CategoryPageClient';
import { adminDb } from '@/lib/firebaseAdmin';
import type { FirestoreCategory, ProviderApplication } from '@/types/firestore';
import type { BreadcrumbItem } from '@/types/ui';
import { notFound } from 'next/navigation';
import { Timestamp } from 'firebase-admin/firestore';

interface CategoryPageProps {
  params: { slug: string };
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


// Combine data fetching into one function for the page
async function getPageData(slug: string): Promise<{ category: FirestoreCategory | null; providers: ProviderApplication[] }> {
  try {
    const categoriesRef = adminDb.collection('adminCategories');
    const qCategory = categoriesRef.where('slug', '==', slug).where('isActive', '==', true).limit(1);
    const categorySnapshot = await qCategory.get();

    if (categorySnapshot.empty) {
      return { category: null, providers: [] };
    }

    const categoryDoc = categorySnapshot.docs[0];
    const categoryData = { id: categoryDoc.id, ...categoryDoc.data() };

    // Now fetch providers for this category on the server
    const providersRef = adminDb.collection('providerApplications');
    const qProviders = providersRef.where('workCategoryId', '==', categoryData.id).where('status', '==', 'approved');
    const providersSnapshot = await qProviders.get();

    // Serialize providers to convert Timestamps
    const providers = providersSnapshot.docs.map(doc => {
      const data = doc.data();
      return serializeObject({ ...data, id: doc.id }) as ProviderApplication;
    });

    // Serialize the category data as well
    const serializedCategory = serializeObject(categoryData) as FirestoreCategory;

    return { category: serializedCategory, providers };

  } catch (error) {
    console.error('Error fetching data for category page:', error);
    return { category: null, providers: [] };
  }
}

export async function generateStaticParams() {
  try {
    const categoriesSnapshot = await adminDb.collection('adminCategories').where('isActive', '==', true).get();
    const paths = categoriesSnapshot.docs
      .map(doc => {
        const categoryData = doc.data() as FirestoreCategory;
        return { slug: categoryData.slug };
      })
      .filter(p => p.slug); // Ensure slug exists and is truthy

    if (paths.length === 0) {
        console.warn("[CategoryPage] generateStaticParams: No active category slugs found. This might mean no static category pages will be generated for /category/[slug] routes.");
    }
    return paths;
  } catch (error) {
    console.error("[CategoryPage] Error generating static params for /category/[slug] pages:", error);
    return []; // Return empty array on error to prevent build failure
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = params;
  const { category, providers } = await getPageData(slug);

  if (!category) {
    notFound();
  }
  
  const breadcrumbItems: BreadcrumbItem[] = [{ label: "Home", href: "/" }];
  breadcrumbItems.push({ label: category.name });

  return <CategoryPageClient categorySlug={slug} initialCategory={category} initialProviders={providers} breadcrumbItems={breadcrumbItems} />;
}
