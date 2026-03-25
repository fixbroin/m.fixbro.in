
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  h1_title: z.string().min(5, 'H1 Title must be at least 5 characters.'),
  paragraph: z.string().min(10, 'Paragraph must be at least 10 characters.'),
  hero_media_url: z.string().optional(),
  hero_media_type: z.enum(['image', 'video']).optional(),
  hero_button1_text: z.string().min(1, 'Button 1 text is required.'),
  hero_button1_link: z.string().min(1, 'Button 1 link is required.'),
  hero_button2_text: z.string().min(1, 'Button 2 text is required.'),
  hero_button2_link: z.string().min(1, 'Button 2 link is required.'),
});

export default function HomePageSettings() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      h1_title: '',
      paragraph: '',
      hero_media_url: '',
      hero_media_type: 'image',

       // ✅ ADD THESE (VERY IMPORTANT)
    hero_button1_text: '',
    hero_button1_link: '',
    hero_button2_text: '',
    hero_button2_link: '',
    },
  });

  useEffect(() => {
    startTransition(async () => {
        const data = await getHomePageContent();
        if (data) {
            form.reset({
                h1_title: data.h1_title || '',
                paragraph: data.paragraph || '',
                hero_media_url: data.hero_media_url || '',
                hero_media_type: data.hero_media_type || 'image',
                hero_button1_text: data.hero_button1_text || 'Get Consultation',
                hero_button1_link: data.hero_button1_link || '/contact',
                hero_button2_text: data.hero_button2_text || 'View Portfolio',
                hero_button2_link: data.hero_button2_link || '/portfolio',
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
            
            {/* Header Content Section */}
            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-lg font-semibold">Header Content</h3>
                <Separator />
                <FormField
                    control={form.control}
                    name="h1_title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>H1 Title</FormLabel>
                        <FormControl>
                            <Input placeholder="Main heading for the page" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="paragraph"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Intro Paragraph</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Introductory paragraph for the page" {...field} className="min-h-[100px]" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* Hero Section */}
            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-lg font-semibold">Hero Media & Buttons</h3>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="hero_button1_text"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Button 1 Text</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="hero_button1_link"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Button 1 Link</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="hero_button2_text"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Button 2 Text</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="hero_button2_link"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Button 2 Link</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
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
