
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, XCircle, Image as ImageIcon, Layers } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import type { FirestoreCategory } from '@/types/firestore'; // Changed from FirestoreService
import Link from 'next/link';
import NextImage from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLoading } from '@/contexts/LoadingContext';
import { useAuth } from '@/hooks/useAuth';
import { getGuestId } from '@/lib/guestIdManager';
import { logUserActivity } from '@/lib/activityLogger';

interface SearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchPopup({ isOpen, onClose }: SearchPopupProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [allCategories, setAllCategories] = useState<FirestoreCategory[]>([]); // Changed from allServices
  const [filteredCategories, setFilteredCategories] = useState<FirestoreCategory[]>([]); // Changed from filteredServices
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const { showLoading } = useLoading();
  const { user } = useAuth();

  const fetchAllData = useCallback(async () => {
    if (!isOpen || hasFetched) return;

    setIsLoading(true);
    setHasFetched(true);
    try {
      const categoriesCollectionRef = collection(db, "adminCategories");
      const q = query(categoriesCollectionRef, where("isActive", "==", true), orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      const categoriesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreCategory));
      setAllCategories(categoriesData);
      setFilteredCategories([]); // Start with no results until user types
    } catch (error) {
      console.error("Error fetching categories for search:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, hasFetched]);

  useEffect(() => {
    if (isOpen && !hasFetched) {
      fetchAllData();
    }
    if (!isOpen) {
        setSearchTerm("");
    }
  }, [isOpen, hasFetched, fetchAllData]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (!searchTerm.trim()) {
        setFilteredCategories([]);
        return;
      }
      if (searchTerm.trim().length > 2) {
        logUserActivity(
          'search',
          { searchQuery: searchTerm.trim() },
          user?.uid,
          !user ? getGuestId() : null
        );
      }

      const lowerCaseSearchTerm = searchTerm.toLowerCase();

      const getScore = (category: FirestoreCategory): number => {
        const name = category.name.toLowerCase();
        const slug = category.slug.toLowerCase();

        if (name.startsWith(lowerCaseSearchTerm)) return 10; // Exact start of name
        if (name.includes(lowerCaseSearchTerm)) return 5; // Name contains
        if (slug.includes(lowerCaseSearchTerm)) return 2; // Slug contains
        return 0; // No match
      };

      const results = allCategories
        .map(category => ({ category, score: getScore(category) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.category);

      setFilteredCategories(results);
    }, 300); // Debounce search

    return () => clearTimeout(handler);
  }, [searchTerm, allCategories, user]);

  const handleResultClick = () => {
    showLoading();
    onClose();
    setSearchTerm(''); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="w-[90%] sm:max-w-lg md:max-w-xl lg:max-w-2xl h-[80vh] max-h-[700px] flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 pb-2 border-b">
          <DialogTitle className="font-headline flex items-center">
            <Search className="mr-2 h-5 w-5 text-primary" /> Search Categories
          </DialogTitle>
          <DialogDescription>
            Find a service category quickly.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 sm:p-6 border-b">
          <div className="relative">
            <Input
              id="search-popup-input"
              placeholder="e.g., Plumbing, Cleaning..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 h-11 text-base"
              aria-label="Search categories"
              autoFocus
            />
            {searchTerm ? (
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setSearchTerm('')}>
                    <XCircle className="h-5 w-5 text-muted-foreground"/>
                </Button>
            ) : (
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="flex-grow overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 sm:p-6 pt-2 space-y-3">
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : searchTerm && filteredCategories.length === 0 ? (
                <div className="text-center py-10">
                  <XCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No categories found for "{searchTerm}".</p>
                </div>
              ) : !searchTerm ? (
                 <div className="text-center py-10">
                    <p className="text-muted-foreground">Type above to search for a category.</p>
                </div>
              ) : (
                filteredCategories.map(category => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    onClick={handleResultClick}
                    className="block p-3 rounded-md hover:bg-accent/50 transition-colors border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        {category.imageUrl ? (
                          <NextImage
                            src={category.imageUrl}
                            alt={category.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                            data-ai-hint={category.imageHint || "category"}
                          />
                        ) : (
                          <Layers className="h-8 w-8 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        )}
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-semibold text-primary text-sm sm:text-base">{category.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 sm:mt-1">
                          {category.seo_description || `Find services related to ${category.name}`}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
