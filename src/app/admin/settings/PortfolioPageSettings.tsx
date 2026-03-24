
"use client";

import { useFieldArray, useForm } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Trash } from 'lucide-react';
import { getPortfolioItems, updatePortfolioItems, PortfolioItem, getPortfolioPageContent, updatePortfolioPageContent } from './actions/portfolio-actions';
import ImageUploadInput from './ImageUploadInput';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const portfolioItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  mediaType: z.enum(['image', 'video']),
  mediaUrl: z.string().optional(),
  link: z.string().optional(),
  displayOrder: z.coerce.number().int().min(0, 'Display order must be a positive number.'),
});

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  subtitle: z.string().min(1, 'Subtitle is required.'),
  items: z.array(portfolioItemSchema),
});

export default function PortfolioPageSettings() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    startTransition(async () => {
      const [itemsData, contentData] = await Promise.all([
        getPortfolioItems(),
        getPortfolioPageContent()
      ]);
      
      if (itemsData) {
        form.setValue('items', itemsData.map(item => ({
          ...item,
          title: item.title || '',
          category: item.category || '',
          mediaType: item.mediaType || 'image',
          mediaUrl: item.mediaUrl || '',
          link: item.link || '',
          displayOrder: item.displayOrder ?? 0
        })));
      }
      if (contentData) {
        form.setValue('title', contentData.title || '');
        form.setValue('subtitle', contentData.subtitle || '');
      }
    });
  }, [form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
        try {
            const { title, subtitle, items } = values;
            await updatePortfolioPageContent({ title, subtitle });
            await updatePortfolioItems(items as PortfolioItem[]);
            
            toast({
              title: 'Success!',
              description: 'Portfolio page settings have been updated.',
            });

            const [itemsData, contentData] = await Promise.all([
              getPortfolioItems(),
              getPortfolioPageContent()
            ]);
            if (itemsData) {
                form.setValue('items', itemsData.map(item => ({
                  ...item,
                  title: item.title || '',
                  category: item.category || '',
                  mediaType: item.mediaType || 'image',
                  mediaUrl: item.mediaUrl || '',
                  link: item.link || '',
                  displayOrder: item.displayOrder ?? 0
                })));
            }
             if (contentData) {
              form.setValue('title', contentData.title || '');
              form.setValue('subtitle', contentData.subtitle || '');
            }
        } catch(error) {
            toast({
                title: 'Error',
                description: 'Failed to update portfolio settings.',
                variant: 'destructive',
            })
        }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Page Settings</CardTitle>
        <CardDescription>Manage the content and projects displayed on your portfolio pages.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-lg font-semibold">Homepage Section Content</h3>
                <Separator />
                 <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Section Title</FormLabel>
                        <FormControl>
                            <Input placeholder="Portfolio Section Title" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="subtitle"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Section Subtitle</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Portfolio Section Subtitle" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <div className="space-y-4">
               <h3 className="text-lg font-semibold">Portfolio Items</h3>
               <Separator />
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-4 rounded-lg border p-4 relative">
                  <h3 className="text-lg font-semibold">Item {index + 1}</h3>
                   <Button 
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => remove(index)}
                    className="absolute top-2 right-2"
                    >
                        <Trash />
                    </Button>
                  <Separator />
                  <FormField
                    control={form.control}
                    name={`items.${index}.displayOrder`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Order</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Project Title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.category`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Website" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.mediaType`}
                    render={({ field: mediaTypeField }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Media Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={mediaTypeField.onChange}
                            value={mediaTypeField.value}
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
                    name={`items.${index}.mediaUrl`}
                    render={({ field: { onChange, value } }) => (
                      <FormItem>
                        <FormLabel>{form.watch(`items.${index}.mediaType`) === 'video' ? 'Video' : 'Image'}</FormLabel>
                        <FormControl>
                           <ImageUploadInput 
                            id={`media-upload-${field.id}`} 
                            value={value} 
                            onChange={onChange}
                            folder="portfolio"
                            accept={form.watch(`items.${index}.mediaType`) === 'video' ? "video/mp4,video/webm" : "image/png, image/jpeg, image/webp, image/svg+xml, image/ico, .ico"}
                           />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name={`items.${index}.link`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Link (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/project" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" onClick={() => append({ title: '', category: '', mediaType: 'image', mediaUrl: 'https://placehold.co/600x400.png', link: '#', displayOrder: fields.length + 1 })}>
                Add Portfolio Item
            </Button>
            
            <Separator />

            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
