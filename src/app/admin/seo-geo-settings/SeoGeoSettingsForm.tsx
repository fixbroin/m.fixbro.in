
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useTransition, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getSeoData, updateSeoData } from './actions';
import { PageSeoContent, defaultSeoSettings } from '@/types/seo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import ImageUploadInput from '../settings/ImageUploadInput';

const formSchema = z.object({
  h1_title: z.string().min(5, { message: 'H1 Title must be at least 5 characters.' }),
  paragraph: z.string().min(10, { message: 'Paragraph must be at least 10 characters.' }),
  meta_title: z.string().min(5, { message: 'Meta Title must be at least 5 characters.' }),
  meta_description: z.string().min(10, { message: 'Meta Description must be at least 10 characters.' }),
  meta_keywords: z.string(),
  og_image: z.string().optional(),
  schema_type: z.enum(['Organization', 'LocalBusiness', 'ProfessionalService', 'WebSite']).optional(),
  canonical_url: z.string().optional(),
});

const availablePages = [
  { value: 'home', label: 'Homepage' },
  { value: 'services', label: 'Services' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'about', label: 'About Us' },
  { value: 'contact', label: 'Contact' },
];

export default function SeoGeoSettingsForm() {
  const { toast } = useToast();
  const [isSaving, startSavingTransition] = useTransition();
  const [isLoading, startLoadingTransition] = useTransition();
  const [selectedPage, setSelectedPage] = useState<string>('home');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultSeoSettings,
    },
  });

  const fetchPageData = useCallback((page: string) => {
    startLoadingTransition(async () => {
      const data = await getSeoData(page);
      if (data) {
        form.reset({
            ...defaultSeoSettings,
            ...data
        });
      }
    });
  }, [form]);

  useEffect(() => {
    fetchPageData(selectedPage);
  }, [selectedPage, fetchPageData]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    startSavingTransition(async () => {
      const response = await updateSeoData(selectedPage, values as PageSeoContent);
      if (response.success) {
        toast({
          title: 'Success!',
          description: `SEO settings for the ${availablePages.find(p => p.value === selectedPage)?.label} page have been updated.`,
        });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update settings.',
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <Card className="w-full shadow-lg bg-card border-border">
      <CardHeader>
        <CardTitle className="text-2xl text-foreground">Advanced Page SEO</CardTitle>
        <CardDescription className="text-muted-foreground">Manage meta tags, OpenGraph data, and Schema.org settings for maximum search engine visibility.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormItem>
              <FormLabel className="text-muted-foreground">Select Page to Optimize</FormLabel>
              <Select onValueChange={setSelectedPage} defaultValue={selectedPage}>
                <FormControl>
                  <SelectTrigger className="bg-muted border-border text-foreground h-11 focus:ring-primary/30">
                    <SelectValue placeholder="Select a page to edit" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  {availablePages.map((page) => (
                    <SelectItem key={page.value} value={page.value} className="focus:bg-primary/20 focus:text-white">
                      {page.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>

            {isLoading ? (
              <div className="space-y-4 pt-4">
                <Skeleton className="h-10 w-full bg-white/5" />
                <Skeleton className="h-20 w-full bg-white/5" />
                <Skeleton className="h-10 w-full bg-white/5" />
                <Skeleton className="h-20 w-full bg-white/5" />
                <Skeleton className="h-10 w-full bg-white/5" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold border-b border-border pb-2 text-foreground">On-Page Content</h3>
                        <FormField
                        control={form.control}
                        name="h1_title"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-muted-foreground">H1 Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Main heading for the page" {...field} className="bg-muted border-border text-foreground h-11 focus-visible:ring-primary/30" />
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
                            <FormLabel className="text-muted-foreground">Intro Paragraph</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Introductory paragraph for the page" {...field} className="bg-muted border-border text-foreground min-h-[100px] focus-visible:ring-primary/30" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold border-b border-border pb-2 text-foreground">Meta Tags (Google)</h3>
                        <FormField
                        control={form.control}
                        name="meta_title"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-muted-foreground">Meta Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Title for browser tab and search results" {...field} className="bg-muted border-border text-foreground h-11 focus-visible:ring-primary/30" />
                            </FormControl>
                            <FormDescription className="text-muted-foreground text-[11px]">Optimal length: 50-60 characters.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="meta_description"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-muted-foreground">Meta Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Description for search engine results" {...field} className="bg-muted border-border text-foreground min-h-[100px] focus-visible:ring-primary/30" />
                            </FormControl>
                            <FormDescription className="text-muted-foreground text-[11px]">Optimal length: 150-160 characters.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-lg font-semibold border-b border-border pb-2 text-foreground">Technical & Advanced SEO</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="meta_keywords"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-muted-foreground">Meta Keywords</FormLabel>
                                <FormControl>
                                    <Input placeholder="Comma, separated, keywords" {...field} className="bg-muted border-border text-foreground h-11 focus-visible:ring-primary/30" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="canonical_url"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-muted-foreground">Canonical URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://example.com/page" {...field} className="bg-muted border-border text-foreground h-11 focus-visible:ring-primary/30" />
                                </FormControl>
                                <FormDescription className="text-muted-foreground text-[11px]">Leave empty to use page defaults.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="og_image"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-muted-foreground">OpenGraph Image URL</FormLabel>
                                <FormControl>
                                    <ImageUploadInput 
                                        id="og-image-upload" 
                                        value={field.value || ''} 
                                        onChange={field.onChange} 
                                        folder="seo"
                                    />
                                </FormControl>
                                <FormDescription className="text-muted-foreground text-[11px]">Recommended: 1200x630px.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="schema_type"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-muted-foreground">Structured Data Type (JSON-LD)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger className="bg-muted border-border text-foreground h-11 focus:ring-primary/30">
                                        <SelectValue placeholder="Select schema type" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-popover border-border text-popover-foreground">
                                        <SelectItem value="Organization" className="focus:bg-primary/20 focus:text-white">Organization</SelectItem>
                                        <SelectItem value="LocalBusiness" className="focus:bg-primary/20 focus:text-white">Local Business</SelectItem>
                                        <SelectItem value="ProfessionalService" className="focus:bg-primary/20 focus:text-white">Professional Service</SelectItem>
                                        <SelectItem value="WebSite" className="focus:bg-primary/20 focus:text-white">Generic WebSite</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription className="text-muted-foreground text-[11px]">Helps Google understand your page better.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
              </>
            )}

            <Button type="submit" className="w-full h-12 text-lg shadow-xl shadow-primary/20" disabled={isSaving || isLoading}>
              {isSaving ? 'Updating SEO Engine...' : 'Publish SEO Updates'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
