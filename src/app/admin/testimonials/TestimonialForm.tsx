
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageUploadInput from '../settings/ImageUploadInput';
import { TestimonialFormData } from './actions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const testimonialSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  description: z.string().min(10, 'Review must be at least 10 characters.'),
  rating: z.coerce.number().min(1).max(5),
  image: z.string().url().optional().or(z.literal('')),
});

interface TestimonialFormProps {
  initialData?: TestimonialFormData | null;
  onSave: (data: TestimonialFormData) => Promise<{ success: boolean; error?: string } | void>;
}

export default function TestimonialForm({ initialData, onSave }: TestimonialFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<TestimonialFormData>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      rating: 5,
      image: '',
    },
  });

  const onSubmit = async (values: TestimonialFormData) => {
    startTransition(async () => {
      const result = await onSave(values);
      if (result && !result.success) {
        toast({
          title: 'Error',
          description: result.error || 'Something went wrong.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success!',
          description: 'Testimonial saved successfully.',
        });
        // Redirect is handled in server action
      }
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reviewer's Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Star Rating</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={String(field.value)}
                      className="flex items-center gap-2"
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <FormItem key={value} className="flex items-center space-x-1 space-y-0">
                           <FormControl>
                            <RadioGroupItem value={String(value)} id={`rating-${value}`} className="sr-only" />
                           </FormControl>
                           <FormLabel htmlFor={`rating-${value}`} className='cursor-pointer'>
                               <Star className={`h-6 w-6 ${value <= (form.watch('rating') || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                           </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write the customer's review here..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
             <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Reviewer Image (Optional)</FormLabel>
                    <FormControl>
                        <ImageUploadInput id="testimonial-image-upload" value={field.value} onChange={field.onChange} folder="testimonials" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <div className="flex justify-end gap-4">
                 <Button type="button" variant="outline" onClick={() => router.push('/admin/testimonials')}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving...' : 'Save Testimonial'}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
