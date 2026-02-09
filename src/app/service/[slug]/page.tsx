
import ServiceDetailPageClient from '@/components/service/ServiceDetailPageClient';
import { adminDb } from '@/lib/firebaseAdmin';
import type { FirestoreService, ClientServiceData, FirestoreCategory, FirestoreSubCategory } from '@/types/firestore';
import { Timestamp } from 'firebase-admin/firestore';

interface ServicePageProps {
  params: { slug: string };
}

// Metadata generation is handled by src/app/service/[slug]/layout.tsx

async function getServiceData(slug: string): Promise<ClientServiceData | null> {
  try {
    const servRef = adminDb.collection('adminServices');
    const q = servRef.where('slug', '==', slug).where('isActive', '==', true).limit(1);
    const snapshot = await q.get();
    if (snapshot.empty) return null;

    const serviceDoc = snapshot.docs[0];
    const serviceDocData = serviceDoc.data() as FirestoreService | undefined;
    if (!serviceDocData) return null; 

    const serviceId = serviceDoc.id;

    let parentCategoryName: string | undefined;
    let parentCategorySlug: string | undefined;
    let parentCategoryId: string | undefined; // Added parentCategoryId

    if (serviceDocData.subCategoryId) {
        const subCatDocRef = adminDb.collection("adminSubCategories").doc(serviceDocData.subCategoryId);
        const subCatDoc = await subCatDocRef.get();
        if (subCatDoc.exists) {
            const subCategory = subCatDoc.data() as FirestoreSubCategory | undefined;
            // Only proceed if the sub-category is active
            if (subCategory && subCategory.isActive) { 
                if (subCategory.parentId) {
                    parentCategoryId = subCategory.parentId; // Capture parentId
                    const catDocRef = adminDb.collection("adminCategories").doc(subCategory.parentId);
                    const catDoc = await catDocRef.get();
                    if (catDoc.exists) {
                        const category = catDoc.data() as FirestoreCategory | undefined;
                        // Only associate if the parent category is also active
                        if (category && category.isActive) { 
                            parentCategoryName = category.name;
                            parentCategorySlug = category.slug;
                        } else {
                            // If parent category is not active, this service should not be reachable.
                            // You might want to return null to cause a 404.
                            console.warn(`Service "${serviceDocData.name}" belongs to an inactive category "${category?.name}". Hiding.`);
                            return null;
                        }
                    }
                }
            } else {
                 // If sub-category is not active, this service should not be reachable.
                 console.warn(`Service "${serviceDocData.name}" belongs to an inactive sub-category "${subCategory?.name}". Hiding.`);
                 return null;
            }
        }
    }

    const clientData: ClientServiceData = {
      ...serviceDocData, 
      id: serviceId, 
      parentCategoryName,
      parentCategorySlug,
      parentCategoryId, // Include it in the final object
      taskTimeValue: serviceDocData.taskTimeValue,
      taskTimeUnit: serviceDocData.taskTimeUnit,
      includedItems: serviceDocData.includedItems,
      excludedItems: serviceDocData.excludedItems,
      allowPayLater: serviceDocData.allowPayLater,
      serviceFaqs: serviceDocData.serviceFaqs,
    };
    
    if (serviceDocData.createdAt && serviceDocData.createdAt instanceof Timestamp) {
      clientData.createdAt = serviceDocData.createdAt.toDate().toISOString();
    } else if (serviceDocData.createdAt) {
      clientData.createdAt = String(serviceDocData.createdAt);
    }

    if (serviceDocData.updatedAt && serviceDocData.updatedAt instanceof Timestamp) {
      clientData.updatedAt = serviceDocData.updatedAt.toDate().toISOString();
    } else if (serviceDocData.updatedAt) {
      clientData.updatedAt = String(serviceDocData.updatedAt);
    }

    return clientData;

  } catch (error) {
    console.error('Error fetching service data for page component:', error);
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const servicesSnapshot = await adminDb.collection('adminServices').where('isActive', '==', true).get();
    const paths = servicesSnapshot.docs
      .map(doc => {
        const serviceData = doc.data() as FirestoreService;
        return { slug: serviceData.slug };
      })
      .filter(p => p.slug); 

    if (paths.length === 0) {
        console.warn("[ServicePage] generateStaticParams: No active service slugs found. This might mean no static service pages will be generated for /service/[slug] routes.");
    }
    return paths;
  } catch (error) {
    console.error("[ServicePage] Error generating static params for /service/[slug] pages:", error);
    return []; 
  }
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const serviceData = await getServiceData(slug);
  const h1Title = serviceData?.h1_title || serviceData?.name || "Service Details";

  return <ServiceDetailPageClient serviceSlug={slug} initialServiceData={serviceData} initialH1Title={h1Title} />;
}
