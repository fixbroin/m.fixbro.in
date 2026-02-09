"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import type { FirestoreReview, ProviderApplication } from '@/types/firestore';
import { useToast } from '@/hooks/use-toast';
import { generateBulkReviews } from '@/ai/flows/generateBulkReviewsFlow';
import { db } from '@/lib/firebase';
import { collection, writeBatch, Timestamp, doc } from 'firebase/firestore';

const formSchema = z.object({
  providerId: z.string({ required_error: "Please select a provider." }),
  numberOfReviews: z.coerce.number().int().min(1, "Must generate at least 1 review.").max(20, "Cannot generate more than 20 reviews at once."),
});

type BulkReviewFormData = z.infer<typeof formSchema>;

interface BulkReviewGeneratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerationComplete: () => void;
  providers?: ProviderApplication[];
}

export default function BulkReviewGeneratorDialog({
  isOpen,
  onClose,
  onGenerationComplete,
  providers = [],
}: BulkReviewGeneratorDialogProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<BulkReviewFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { providerId: undefined, numberOfReviews: 5 },
  });

  const onSubmit = async (data: BulkReviewFormData) => {
    setIsGenerating(true);
    toast({ title: "Starting Review Generation...", description: "The AI is crafting reviews. This may take a moment." });

    const selectedProvider = providers.find(p => p.id === data.providerId);
    if (!selectedProvider) {
      toast({ title: "Error", description: "Selected provider not found.", variant: "destructive" });
      setIsGenerating(false);
      return;
    }

    try {
      const aiResult = await generateBulkReviews({
        providerName: selectedProvider.fullName || 'A Provider',
        categoryName: selectedProvider.workCategoryName || 'General Services',
        numberOfReviews: data.numberOfReviews,
      });

      if (!aiResult.reviews || aiResult.reviews.length === 0) {
        throw new Error("AI did not return any reviews.");
      }
      
      toast({ title: "AI Generation Complete", description: `Saving ${aiResult.reviews.length} new reviews to the database.` });

      const batch = writeBatch(db);
      const reviewsCollectionRef = collection(db, "adminReviews");

      aiResult.reviews.forEach(review => {
        const newReviewRef = doc(reviewsCollectionRef);
        const reviewData: Omit<FirestoreReview, 'id'> = {
          providerId: selectedProvider.id!, // Set the provider ID
          // serviceId and serviceName are now optional and not provided here
          userName: review.userName,
          rating: review.rating,
          comment: review.comment,
          status: "Approved",
          adminCreated: true,
          createdAt: Timestamp.now(),
        };
        batch.set(newReviewRef, reviewData);
      });

      await batch.commit();

      toast({ title: "Success!", description: `${aiResult.reviews.length} reviews have been successfully generated and saved.`, className: "bg-green-100 text-green-700 border-green-300" });
      onGenerationComplete();
      onClose();

    } catch (error) {
      console.error("Error generating or saving bulk reviews:", error);
      toast({ title: "Error", description: (error as Error).message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {if (!isGenerating) onClose()}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center"><Wand2 className="mr-2 h-5 w-5 text-primary"/> AI Bulk Review Generator</DialogTitle>
          <DialogDescription>
            Select a provider and generate multiple realistic reviews automatically.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="providerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Provider</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a provider..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {providers.map(provider => (
                        <SelectItem key={provider.id} value={provider.id!}>
                          {provider.fullName} ({provider.workCategoryName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="numberOfReviews"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Reviews to Generate</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="20" placeholder="e.g., 10" {...field} disabled={isGenerating} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isGenerating}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Reviews
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}