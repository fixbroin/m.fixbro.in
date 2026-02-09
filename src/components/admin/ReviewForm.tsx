
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FirestoreReview, FirestoreService, ReviewStatus, ProviderApplication } from '@/types/firestore';
import { useEffect, useState } from "react";
import { Loader2, Star, User } from "lucide-react";

const reviewStatusOptions: ReviewStatus[] = ["Pending", "Approved", "Rejected", "Flagged"];

const reviewFormSchema = z.object({
  subjectType: z.enum(['provider', 'service'], { required_error: "Please select if the review is for a provider or a service."}),
  providerId: z.string({ required_error: "Please select a provider." }),
  serviceId: z.string().optional(),
  userName: z.string().min(2, "Reviewer name must be at least 2 characters.").default("Admin"),
  rating: z.coerce.number().min(1, "Rating is required.").max(5, "Rating cannot exceed 5."),
  comment: z.string().min(10, "Comment must be at least 10 characters.").max(1000, "Comment too long."),
  status: z.enum(reviewStatusOptions),
});

export type ReviewFormData = z.infer<typeof reviewFormSchema>;

interface ReviewFormProps {
  onSubmit: (data: ReviewFormData & { serviceName?: string, adminCreated: boolean, id?: string }) => Promise<void>;
  initialData?: FirestoreReview | null;
  services: Pick<FirestoreService, 'id' | 'name'>[]; 
  providers: ProviderApplication[];
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function ReviewForm({ onSubmit: onSubmitProp, initialData, services, providers, onCancel, isSubmitting = false }: ReviewFormProps) {
  
  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      subjectType: initialData?.serviceId ? 'service' : 'provider',
      providerId: initialData?.providerId || undefined,
      serviceId: initialData?.serviceId || undefined,
      userName: initialData?.userName || "Admin",
      rating: initialData?.rating || 4,
      comment: initialData?.comment || "",
      status: initialData?.status || "Approved",
    },
  });
  
  const watchedSubjectType = form.watch("subjectType");

  useEffect(() => {
    if (initialData) {
      form.reset({
        subjectType: initialData.serviceId ? 'service' : 'provider',
        providerId: initialData.providerId,
        serviceId: initialData.serviceId,
        userName: initialData.userName,
        rating: initialData.rating,
        comment: initialData.comment,
        status: initialData.status,
      });
    } else {
      form.reset({
        subjectType: 'provider',
        providerId: undefined,
        serviceId: undefined,
        userName: "Admin",
        rating: 4,
        comment: "",
        status: "Approved",
      });
    }
  }, [initialData, form]);

  const handleSubmit = async (formData: ReviewFormData) => {
    const serviceName = formData.subjectType === 'service' ? services.find(s => s.id === formData.serviceId)?.name : undefined;
    await onSubmitProp({ 
      ...formData, 
      serviceName,
      adminCreated: true, 
      id: initialData?.id 
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full"> 
        <div className="p-6 space-y-6 flex-grow">
           <FormField
            control={form.control}
            name="subjectType"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Review For</FormLabel>
                <Select 
                    onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('serviceId', undefined); // Reset service when type changes
                    }} 
                    defaultValue={field.value} 
                    value={field.value} 
                    disabled={isSubmitting || !!initialData}
                >
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select review subject type" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="provider">Provider</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                    </SelectContent>
                </Select>
                {initialData && <FormDescription>Subject type cannot be changed for an existing review.</FormDescription>}
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="providerId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Provider</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isSubmitting || !!initialData}>
                    <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a provider" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {providers.map(p => <SelectItem key={p.id} value={p.id!}>{p.fullName}</SelectItem>)}
                    </SelectContent>
                </Select>
                {initialData && <FormDescription>Provider cannot be changed for an existing review.</FormDescription>}
                <FormMessage />
                </FormItem>
            )}
            />
            
            {watchedSubjectType === 'service' && (
                <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Service</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isSubmitting || !!initialData}>
                        <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a service for the review" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {services.map(service => (<SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    {initialData && <FormDescription>Service cannot be changed for an existing review.</FormDescription>}
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Reviewer Name</FormLabel>
                  <FormControl>
                      <Input placeholder="e.g., Admin or Jane Doe" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
            />
            <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Rating (1-5 stars)</FormLabel>
                <FormControl>
                    <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                        key={star}
                        className={`h-6 w-6 cursor-pointer transition-colors
                            ${star <= field.value ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground hover:text-yellow-300'}`}
                        onClick={() => field.onChange(star)}
                        />
                    ))}
                    <Input type="hidden" {...field} />
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
                <FormLabel>Review Comment</FormLabel>
                <FormControl>
                    <Textarea placeholder="Write the review content here..." {...field} rows={5} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isSubmitting}>
                    <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select review status" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {reviewStatusOptions.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="p-6 border-t bg-background flex flex-col sm:flex-row sm:justify-end gap-3 mt-auto">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Save Changes' : 'Create Review'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
