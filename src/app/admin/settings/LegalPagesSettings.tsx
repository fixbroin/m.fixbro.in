
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

const formSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters.'),
});

interface LegalPageFormProps {
  page: LegalPage;
}

function LegalPageForm({ page }: LegalPageFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: page.content || '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        await updateLegalPageContent({ slug: page.slug, content: values.content });
        toast({
          title: 'Success!',
          description: `${page.title} has been updated.`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: `Failed to update ${page.title}.`,
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Page Content</FormLabel>
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

  React.useEffect(() => {
    async function loadPages() {
      setIsLoading(true);
      const data = await getLegalPages();
      setPages(data);
      setIsLoading(false);
    }
    loadPages();
  }, []);

  if (isLoading) {
    return <p>Loading legal pages settings...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal Pages</CardTitle>
        <CardDescription>Manage the content for your Terms of Service and Privacy Policy pages.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={pages[0]?.slug || 'terms'}>
          <TabsList>
            {pages.map(page => (
              <TabsTrigger key={page.slug} value={page.slug}>{page.title}</TabsTrigger>
            ))}
          </TabsList>
          {pages.map(page => (
            <TabsContent key={page.slug} value={page.slug}>
              <LegalPageForm page={page} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
