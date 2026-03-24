
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
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Trash } from 'lucide-react';
import { getServices, updateServices, Service, getServicesPageContent, updateServicesPageContent } from './actions/services-actions';
import ImageUploadInput from './ImageUploadInput';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const serviceSchema = z.object({
  id: z.string().optional(),
  icon: z.string().min(1, "Icon name is required"),
  title: z.string().min(1),
  price: z.string().min(1),
  description: z.string().min(1),
  mediaUrl: z.string().optional(),
  mediaType: z.enum(['image', 'video']),
  features: z.array(z.object({ name: z.string().min(1) })),
  displayOrder: z.coerce.number().int().min(0, 'Display order must be a positive number.'),
});

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  subtitle: z.string().min(1, 'Subtitle is required.'),
  services: z.array(serviceSchema),
});

export default function ServicesPageSettings() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      services: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "services",
  });

  useEffect(() => {
    startTransition(async () => {
      const [servicesData, contentData] = await Promise.all([
        getServices(),
        getServicesPageContent()
      ]);
      if (servicesData) {
        form.setValue('services', servicesData.map(s => ({
          ...s,
          icon: s.icon || 'Briefcase',
          title: s.title || '',
          price: s.price || '',
          description: s.description || '',
          mediaUrl: s.mediaUrl || '',
          mediaType: s.mediaType || 'image',
          displayOrder: s.displayOrder ?? 0,
          features: (s.features || []).map((f: any) => ({ name: f.name || '' }))
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
            const { title, subtitle, services } = values;
            await updateServicesPageContent({ title, subtitle });
            await updateServices(services);
            toast({
              title: 'Success!',
              description: 'Services page content has been updated.',
            });
            // Refetch data to get new IDs and confirm changes
            const [servicesData, contentData] = await Promise.all([
              getServices(),
              getServicesPageContent()
            ]);
            if (servicesData) {
              form.setValue('services', servicesData.map(s => ({
                ...s,
                icon: s.icon || 'Briefcase',
                title: s.title || '',
                price: s.price || '',
                description: s.description || '',
                mediaUrl: s.mediaUrl || '',
                mediaType: s.mediaType || 'image',
                displayOrder: s.displayOrder ?? 0,
                features: (s.features || []).map((f: any) => ({ name: f.name || '' }))
              })));
            }
            if (contentData) {
              form.setValue('title', contentData.title || '');
              form.setValue('subtitle', contentData.subtitle || '');
            }

        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update services.',
                variant: 'destructive',
            })
        }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services Page Settings</CardTitle>
        <CardDescription>Manage the content and services you offer.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="text-lg font-semibold">Section Content</h3>
              <Separator />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Section Title" {...field} />
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
                      <Textarea placeholder="Section Subtitle" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Services</h3>
              <Separator />
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-4 rounded-lg border p-4 relative">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold">Service {index + 1}</h3>
                    <Button 
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                      className="shrink-0"
                    >
                      <Trash />
                    </Button>
                  </div>
                  <Separator />
                  <FormField
                    control={form.control}
                    name={`services.${index}.displayOrder`}
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
                    name={`services.${index}.icon`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Briefcase (from lucide-react)" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter any valid icon name from the lucide-react library.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`services.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Service Title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`services.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Starting at $99" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`services.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Service description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`services.${index}.mediaType`}
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
                    name={`services.${index}.mediaUrl`}
                    render={({ field: { onChange, value } }) => (
                      <FormItem>
                        <FormLabel>{form.watch(`services.${index}.mediaType`) === 'video' ? 'Video' : 'Image'}</FormLabel>
                        <FormControl>
                          <ImageUploadInput 
                            id={`service-image-upload-${field.id}`} 
                            value={value || ''} 
                            onChange={onChange} 
                            folder="services"
                            accept={form.watch(`services.${index}.mediaType`) === 'video' ? "video/mp4,video/webm" : "image/png, image/jpeg, image/webp, image/svg+xml"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <ServiceFeatures control={form.control} serviceIndex={index} />
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" onClick={() => append({ icon: 'Briefcase', title: '', price: '', description: '', mediaUrl: 'https://placehold.co/600x400.png', mediaType: 'image', features: [], displayOrder: fields.length + 1 })}>
                Add Service
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


function ServiceFeatures({ control, serviceIndex }: { control: any, serviceIndex: number }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `services.${serviceIndex}.features`,
    });

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <FormLabel>Features</FormLabel>
            {fields.map((field, featureIndex) => (
                <div key={field.id} className="flex items-center gap-2">
                    <FormField
                        control={control}
                        name={`services.${serviceIndex}.features.${featureIndex}.name`}
                        render={({ field }) => (
                            <FormItem className="flex-grow">
                                <FormControl>
                                    <Input placeholder="Feature description" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(featureIndex)}>
                        <Trash className="text-destructive" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '' })}>
                Add Feature
            </Button>
        </div>
    );
}
