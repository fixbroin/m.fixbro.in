
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { FirestoreCategory, ProviderApplication, FirestoreCity, FirestoreArea } from '@/types/firestore';
import { Button } from '@/components/ui/button';
import { Home as HomeIconLucide, PackageSearch, Loader2, Construction, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import type { BreadcrumbItem } from '@/types/ui';
import { useLoading } from '@/contexts/LoadingContext';
import ProviderCard from '@/components/provider/ProviderCard';
import { getGlobalSEOSettings, replacePlaceholders } from '@/lib/seoUtils';
import { useAuth } from '@/hooks/useAuth';
import { getHaversineDistance } from '@/lib/locationUtils';
import { useApplicationConfig } from '@/hooks/useApplicationConfig';

interface CategoryPageClientProps {
  categorySlug: string;
  citySlug?: string;
  areaSlug?: string;
  initialCategory: FirestoreCategory | null;
  initialProviders: ProviderApplication[];
  breadcrumbItems?: BreadcrumbItem[];
}

export default function CategoryPageClient({ 
  categorySlug, 
  citySlug, 
  areaSlug, 
  initialCategory, 
  initialProviders, 
  breadcrumbItems: initialBreadcrumbItems 
}: CategoryPageClientProps) {
  const { toast } = useToast();
  const { firestoreUser } = useAuth();
  const { config: appConfig, isLoading: isLoadingAppConfig } = useApplicationConfig();
  const router = useRouter();
  const { showLoading } = useLoading();

  const [category, setCategory] = useState<FirestoreCategory | null>(initialCategory);
  const [providers, setProviders] = useState<ProviderApplication[]>(initialProviders);
  const [isLoading, setIsLoading] = useState(!initialCategory); // Only load if initial data is missing
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>(initialBreadcrumbItems || []);
  const [displayPageH1, setDisplayPageH1] = useState<string | null>(null);

  const sortedProviders = useMemo(() => {
    if (!firestoreUser?.latitude || !firestoreUser?.longitude) {
      return providers;
    }
    const userLat = firestoreUser.latitude;
    const userLng = firestoreUser.longitude;

    const providersWithDistance = providers.map(provider => {
      if (provider.workAreaCenter?.latitude && provider.workAreaCenter?.longitude) {
        const distance = getHaversineDistance(
          userLat,
          userLng,
          provider.workAreaCenter.latitude,
          provider.workAreaCenter.longitude
        );
        return { ...provider, distance };
      }
      // If provider has no location, put them at the end.
      return { ...provider, distance: Infinity };
    });
    
    // Sort by distance ascending
    providersWithDistance.sort((a, b) => a.distance - b.distance);
    
    return providersWithDistance;
  }, [providers, firestoreUser]);


  useEffect(() => {
    // Data is now passed via props, so no fetching logic is needed here.
    // We just set the state from props.
    setCategory(initialCategory);
    setProviders(initialProviders);
    
    if (!initialCategory) {
      setError(`Category "${categorySlug}" not found.`);
      setIsLoading(false);
    } else {
        // H1 title generation
        getGlobalSEOSettings().then(globalSeoSettings => {
            let baseH1 = initialCategory.h1_title || initialCategory.name;
            let finalDisplayH1 = baseH1;
            
            if (areaSlug && citySlug) {
                 finalDisplayH1 = replacePlaceholders(globalSeoSettings.areaCategoryPageH1Pattern, { areaName: areaSlug.replace(/-/g, ' '), cityName: citySlug.replace(/-/g, ' '), categoryName: initialCategory.name }) || baseH1;
            } else if (citySlug) {
                finalDisplayH1 = replacePlaceholders(globalSeoSettings.cityCategoryPageH1Pattern, { cityName: citySlug.replace(/-/g, ' '), categoryName: initialCategory.name }) || baseH1;
            } else {
                 finalDisplayH1 = replacePlaceholders(globalSeoSettings.categoryPageH1Pattern, { categoryName: initialCategory.name }) || baseH1;
            }
            setDisplayPageH1(finalDisplayH1);
        });
        setIsLoading(false);
    }

  }, [initialCategory, initialProviders, categorySlug, citySlug, areaSlug]);

  const handleProviderRegNav = (e: React.MouseEvent) => {
    e.preventDefault();
    showLoading();
    router.push('/provider-registration');
  };


  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="mt-2 text-muted-foreground">Loading providers...</p>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="container mx-auto px-4 py-8 text-center min-h-[60vh] flex flex-col justify-center items-center">
        <PackageSearch className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Category Not Found</h2>
        <p className="text-destructive mb-6">{error || "The requested category could not be found."}</p>
        <Link href="/categories"><Button variant="outline">View All Categories</Button></Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-4 pb-24">
      {breadcrumbItems.length > 0 && <Breadcrumbs items={breadcrumbItems} />}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
        <h1 className="text-3xl md:text-4xl font-headline font-semibold text-foreground">
          {displayPageH1 || category.name}
        </h1>
        {!isLoadingAppConfig && appConfig.isProviderRegistrationEnabled && (
          <Button asChild variant="outline" className="mt-4 sm:mt-0 w-full sm:w-auto">
            <Link href="/provider-registration" onClick={handleProviderRegNav}>
              <UserPlus className="mr-2 h-4 w-4" /> Join as a Provider
            </Link>
          </Button>
        )}
      </div>
       <p className="text-muted-foreground mb-8">
        Choose from our list of trusted and verified professionals.
      </p>
      
      {sortedProviders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProviders.map(provider => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      ) : (
         <div className="text-center py-16 border rounded-lg bg-card">
            <Construction className="mx-auto h-16 w-16 text-primary mb-4" />
            <h3 className="text-2xl font-semibold">Coming Soon!</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">We're working hard to bring trusted professionals for this category to your area. Please check back soon.</p>
            <div className="mt-6">
                <p className="text-sm font-medium mb-2">Are you a professional in this field?</p>
                <Link href="/provider-registration" passHref>
                    <Button>
                        <UserPlus className="mr-2 h-4 w-4" /> Join as a Provider
                    </Button>
                </Link>
            </div>
        </div>
      )}
    </div>
  );
}
