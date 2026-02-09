
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { FirestoreBooking, FirestoreReview, FirestoreService } from '@/types/firestore';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const reviewSchema = z.object({
  rating: z.number().min(1, "Rating is required.").max(5, "Rating cannot exceed 5."),
  comment: z.string().min(10, "Comment must be at least 10 characters.").max(1000, "Comment cannot exceed 1000 characters."),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewSubmissionModalProps {
  booking: FirestoreBooking; // The booking that needs a review
  isOpen: boolean;
  onReviewSubmitted: () => void; // Callback to close modal and update parent state
}

export default function ReviewSubmissionModal({ booking, isOpen, onReviewSubmitted }: ReviewSubmissionModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [serviceToReview, setServiceToReview] = useState<FirestoreService | null>(null);
  const [isLoadingService, setIsLoadingService] = useState(true);

  const [isProviderReview, setIsProviderReview] = useState(false);
  const [providerName, setProviderName] = useState('');


  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  useEffect(() => {
    const fetchDetails = async () => {
      if (isOpen && booking.services.length > 0) {
        
        const isProviderReviewBooking = booking.services[0].serviceId === 'provider_review';
        setIsProviderReview(isProviderReviewBooking);
        
        setIsLoadingService(true);
        if (isProviderReviewBooking) {
          try {
            const providerDocRef = doc(db, "providerApplications", booking.providerId!);
            const providerSnap = await getDoc(providerDocRef);
            if (providerSnap.exists()) {
              setProviderName(providerSnap.data().fullName || 'this provider');
            } else {
              setProviderName('this provider');
            }
          } catch (e) { setProviderName('this provider'); } 
          finally { setIsLoadingService(false); }

        } else {
          // Existing logic to fetch service details
          const firstServiceId = booking.services[0].serviceId;
          try {
            const serviceDocRef = doc(db, "adminServices", firstServiceId);
            const serviceSnap = await getDoc(serviceDocRef);
            if (serviceSnap.exists()) {
              setServiceToReview({ id: serviceSnap.id, ...serviceSnap.data() } as FirestoreService);
            } else {
              toast({ title: "Service Not Found", variant: "destructive" });
              onReviewSubmitted(); 
            }
          } catch (error) {
            toast({ title: "Error", description: "Could not load service details.", variant: "destructive" });
            onReviewSubmitted(); 
          } finally {
            setIsLoadingService(false);
          }
        }
      } else if (!isOpen) {
        setServiceToReview(null);
        setIsLoadingService(false);
        setIsProviderReview(false);
        setProviderName('');
      }
    };

    fetchDetails();
    if (isOpen) {
      form.reset({ rating: 0, comment: "" }); 
    }
  }, [booking, isOpen, form, onReviewSubmitted, toast]);

  const onSubmit = async (data: ReviewFormData) => {
    if (!user || !booking.id || !booking.providerId) {
      toast({ title: "Error", description: "User, booking, or provider information missing.", variant: "destructive" });
      return;
    }
    if (!isProviderReview && !serviceToReview) {
        toast({ title: "Error", description: "Service information missing for this review.", variant: "destructive" });
        return;
    }

    setIsSubmittingReview(true);
    try {
      const reviewData: Omit<FirestoreReview, 'id' | 'createdAt' | 'updatedAt'> & {userAvatarUrl?: string} = {
        ...(isProviderReview ? {} : { 
          serviceId: serviceToReview!.id, 
          serviceName: serviceToReview!.name 
        }),
        bookingId: booking.bookingId,
        providerId: booking.providerId,
        userId: user.uid,
        userName: user.displayName || "Anonymous User",
        rating: data.rating,
        comment: data.comment,
        status: "Approved",
        adminCreated: false,
        createdAt: Timestamp.now(),
      };

      if (user.photoURL) {
        reviewData.userAvatarUrl = user.photoURL;
      }

      await addDoc(collection(db, "adminReviews"), reviewData as Omit<FirestoreReview, 'id' | 'createdAt' | 'updatedAt'>);
      
      const bookingDocRef = doc(db, "bookings", booking.id);
      await updateDoc(bookingDocRef, { isReviewedByCustomer: true, updatedAt: Timestamp.now() });

      toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
      onReviewSubmitted(); 
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({ title: "Error", description: "Failed to submit review. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmittingReview(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open && isOpen && !isSubmittingReview) {
      // Prevent closing via outside click/escape if not submitted yet
    }
  };


  if (!isOpen) return null;

  if (isLoadingService) {
      return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader><DialogTitle>Review Service</DialogTitle></DialogHeader>
                <div className="py-4 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2"/>
                    <p>Loading details...</p>
                </div>
            </DialogContent>
        </Dialog>
      );
  }

  if (!serviceToReview && !isProviderReview) {
    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader><DialogTitle>Error</DialogTitle></DialogHeader>
                <div className="py-4 text-center">
                    <p>Could not load review details. Please try again later or contact support.</p>
                </div>
                <DialogFooter>
                    <Button onClick={onReviewSubmitted} variant="outline">Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
             {isLoadingService ? 'Loading...' : isProviderReview ? `Leave a Review for ${providerName}` : `Leave a Review for ${serviceToReview!.name}`}
          </DialogTitle>
          <DialogDescription>
            Your feedback helps us and other customers. Please rate your experience.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Rating</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-7 w-7 cursor-pointer transition-colors ${
                            star <= field.value ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground hover:text-yellow-300'
                          }`}
                          onClick={() => field.onChange(star)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your experience..."
                      rows={5}
                      {...field}
                      disabled={isSubmittingReview}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmittingReview} className="w-full">
                {isSubmittingReview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Review
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

