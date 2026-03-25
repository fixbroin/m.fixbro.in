
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { getSectionSettings, updateSectionSettings, SectionSettings } from './actions/section-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  error_title: z.string().min(1, "Required"),
  error_subtitle: z.string().min(1, "Required"),
  error_button1_text: z.string().min(1, "Required"),
  error_button1_link: z.string().min(1, "Required"),
  error_button2_text: z.string().min(1, "Required"),
  error_button2_link: z.string().min(1, "Required"),

  review_title: z.string().min(1, "Required"),
  review_subtitle: z.string().min(1, "Required"),

  faq_badge: z.string().min(1, "Required"),
  faq_title: z.string().min(1, "Required"),
  faq_subtitle: z.string().min(1, "Required"),

  contact_badge: z.string().min(1, "Required"),
  contact_title: z.string().min(1, "Required"),
  contact_description: z.string().min(1, "Required"),
  contact_form_title: z.string().min(1, "Required"),
  contact_form_button: z.string().min(1, "Required"),

  footer_cta_title: z.string().min(1, "Required"),
  footer_cta_description: z.string().min(1, "Required"),
  footer_cta_button: z.string().min(1, "Required"),
  footer_copyright_text: z.string().min(1, "Required"),
});

export default function SectionContentSettings() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      error_title: '',
      error_subtitle: '',
      error_button1_text: '',
      error_button1_link: '',
      error_button2_text: '',
      error_button2_link: '',
      review_title: '',
      review_subtitle: '',
      faq_badge: '',
      faq_title: '',
      faq_subtitle: '',
      contact_badge: '',
      contact_title: '',
      contact_description: '',
      contact_h1: '',
      contact_h1_paragraph: '',
      contact_form_title: '',
      contact_form_button: '',
      footer_cta_title: '',
      footer_cta_description: '',
      footer_cta_button: '',
      footer_copyright_text: '',
    },
  });

  useEffect(() => {
    startTransition(async () => {
      const data = await getSectionSettings();
      if (data) {
        form.reset(data);
      }
    });
  }, [form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        await updateSectionSettings(values);
        toast({
          title: 'Success!',
          description: 'Section content settings have been updated.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update section content settings.',
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-2xl font-black tracking-tight">Additional Section Settings</CardTitle>
        <CardDescription>Manage titles, subtitles, and labels for all website sections.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs defaultValue="contact" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
                <TabsTrigger value="contact" className="rounded-xl py-2 font-bold">Contact</TabsTrigger>
                <TabsTrigger value="footer" className="rounded-xl py-2 font-bold">Footer</TabsTrigger>
                <TabsTrigger value="faq" className="rounded-xl py-2 font-bold">FAQ</TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-xl py-2 font-bold">Reviews</TabsTrigger>
                <TabsTrigger value="error" className="rounded-xl py-2 font-bold">Error Page</TabsTrigger>
              </TabsList>

              {/* Contact Settings */}
              <TabsContent value="contact" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl border bg-card">
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-lg font-bold">Contact Page & Section</h3>
                    <Separator />
                  </div>
                  <FormField
                    control={form.control}
                    name="contact_badge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section Badge</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section Title (H2)</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Section Description</FormLabel>
                        <FormControl><Textarea {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_h1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Page H1 Title</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_h1_paragraph"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Page H1 Paragraph</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_form_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Form Card Title</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_form_button"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Form Button Text</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Footer Settings */}
              <TabsContent value="footer" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl border bg-card">
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-lg font-bold">Footer CTA & Copyright</h3>
                    <Separator />
                  </div>
                  <FormField
                    control={form.control}
                    name="footer_cta_title"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>CTA Title</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="footer_cta_description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>CTA Description</FormLabel>
                        <FormControl><Textarea {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="footer_cta_button"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CTA Button Text</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="footer_copyright_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Copyright Suffix Text</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormDescription>Text after the year and website name.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* FAQ Settings */}
              <TabsContent value="faq" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl border bg-card">
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-lg font-bold">FAQ Section Header</h3>
                    <Separator />
                  </div>
                  <FormField
                    control={form.control}
                    name="faq_badge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FAQ Badge</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="faq_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FAQ Title</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="faq_subtitle"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>FAQ Subtitle</FormLabel>
                        <FormControl><Textarea {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Reviews Settings */}
              <TabsContent value="reviews" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl border bg-card">
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-lg font-bold">Testimonials Section Header</h3>
                    <Separator />
                  </div>
                  <FormField
                    control={form.control}
                    name="review_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Review Title</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="review_subtitle"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Review Subtitle</FormLabel>
                        <FormControl><Textarea {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Error Settings */}
              <TabsContent value="error" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl border bg-card">
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-lg font-bold">404 Error Page Content</h3>
                    <Separator />
                  </div>
                  <FormField
                    control={form.control}
                    name="error_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Error Title</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="error_subtitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Error Subtitle</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="error_button1_text"
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
                    name="error_button1_link"
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
                    name="error_button2_text"
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
                    name="error_button2_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Button 2 Link</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" disabled={isPending} className="rounded-2xl px-12 font-black text-lg shadow-xl shadow-primary/20">
                {isPending ? 'Saving...' : 'Save All Section Settings'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
