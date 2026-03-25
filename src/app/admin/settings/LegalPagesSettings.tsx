
"use client";

import * as React from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getLegalPages, updateLegalPageContent, LegalPage } from './actions/legal-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  h1_title: z.string().min(1, 'H1 Title is required.'),
  paragraph: z.string().optional(),
  title: z.string().min(1, 'Title is required.'),
  content: z.string().min(10, 'Content must be at least 10 characters.'),
});

interface LegalPageFormProps {
  page: LegalPage;
  onSuccess: () => void;
}

function LegalPageForm({ page, onSuccess }: LegalPageFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      h1_title: page.h1_title || '',
      paragraph: page.paragraph || '',
      title: page.title || '',
      content: page.content || '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        await updateLegalPageContent({ 
            slug: page.slug, 
            title: values.title, 
            content: values.content,
            h1_title: values.h1_title,
            paragraph: values.paragraph
        });
        toast({
          title: 'Success!',
          description: `${values.title} has been updated.`,
        });
        onSuccess();
      } catch (error) {
        toast({
          title: 'Error',
          description: `Failed to update ${values.title}.`,
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Navigation / Page Title</FormLabel>
              <FormControl>
                <Input
                  placeholder={`Enter title for ${page.title}...`}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Legal Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Enter content for ${page.title}...`}
                  className="min-h-[400px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : `Save ${page.title}`}
        </Button>
      </form>
    </Form>
  )
}


export default function LegalPagesSettings() {
  const [pages, setPages] = React.useState<LegalPage[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadPages = React.useCallback(async () => {
    const data = await getLegalPages();
    setPages(data);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    loadPages();
  }, [loadPages]);

  if (isLoading) {
    return <p>Loading legal pages settings...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal Pages</CardTitle>
        <CardDescription>Manage the header content and full legal text for your policy pages.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={pages[0]?.slug || 'terms'}>
          <TabsList className="h-auto flex-wrap justify-start bg-muted/50 p-1 rounded-xl">
            {pages.map(page => (
              <TabsTrigger key={page.slug} value={page.slug} className="rounded-lg">{page.title}</TabsTrigger>
            ))}
          </TabsList>
          {pages.map(page => (
            <TabsContent key={page.slug} value={page.slug} className="mt-6">
              <LegalPageForm page={page} onSuccess={loadPages} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
