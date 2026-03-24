
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { getHomePageContent, updateHomePageContent, HomePageContent } from './actions/home-actions';
import ImageUploadInput from './ImageUploadInput';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchema = z.object({
  hero_media_url: z.string().optional(),
  hero_media_type: z.enum(['image', 'video']).optional(),
});

export default function HomePageSettings() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hero_media_url: '',
      hero_media_type: 'image',
    },
  });

  useEffect(() => {
    startTransition(async () => {
        const data = await getHomePageContent();
        if (data) {
            form.reset({
                hero_media_url: data.hero_media_url || '',
                hero_media_type: data.hero_media_type || 'image',
            });
        }
    });
  }, [form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
        try {
            await updateHomePageContent(values as HomePageContent);
            toast({
              title: 'Success!',
              description: 'Home page content has been updated.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update home page content.',
                variant: 'destructive'
            });
        }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Home Page Content</CardTitle>
        <CardDescription>Update the content for the different sections of your home page.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Hero Section */}
            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-lg font-semibold">Hero Section</h3>
                <Separator />
                <FormField
                    control={form.control}
                    name="hero_media_type"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Media Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="image" />
                              </FormControl>
                              <FormLabel className="font-normal">Image</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="video" />
                              </FormControl>
                              <FormLabel className="font-normal">Video</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                <FormField
                    control={form.control}
                    name="hero_media_url"
                    render={({ field: { onChange, value } }) => (
                        <FormItem>
                        <FormLabel>{form.watch('hero_media_type') === 'video' ? 'Video' : 'Image'}</FormLabel>
                        <FormControl>
                          <ImageUploadInput 
                            id="hero-media-upload" 
                            value={value || ''} 
                            onChange={onChange}
                            folder="home"
                            accept={form.watch('hero_media_type') === 'video' ? "video/mp4,video/webm" : "image/png, image/jpeg, image/webp, image/svg+xml"}
                          />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
