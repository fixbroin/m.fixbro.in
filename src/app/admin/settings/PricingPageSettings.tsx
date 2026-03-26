
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
import { Switch } from '@/components/ui/switch';
import { Trash } from 'lucide-react';
import { getPricingPlans, updatePricingPlans, PricingPlan, getPricingPageContent, updatePricingPageContent, PricingPageContent } from './actions/pricing-actions';

const planFeatureSchema = z.object({
  name: z.string().min(1, 'Feature name cannot be empty.'),
});

const planSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  value: z.string().min(1, 'Value (Price or Text) is required.'),
  description: z.string().min(1, 'Description is required.'),
  is_featured: z.boolean(),
  is_enabled: z.boolean(),
  features: z.array(planFeatureSchema),
  displayOrder: z.coerce.number().int().min(0, 'Display order must be a positive number.'),
});

const formSchema = z.object({
  h1_title: z.string().min(5, 'H1 Title must be at least 5 characters.'),
  paragraph: z.string().min(10, 'Paragraph must be at least 10 characters.'),
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().min(1, "Subtitle is required"),
  plans: z.array(planSchema),
});

export default function PricingPageSettings() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      h1_title: '',
      paragraph: '',
      title: '',
      subtitle: '',
      plans: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "plans",
  });

   useEffect(() => {
    startTransition(async () => {
      const [plansData, contentData] = await Promise.all([
        getPricingPlans(),
        getPricingPageContent()
      ]);
      
      if (plansData) {
        form.setValue('plans', plansData.map(p => ({
          ...p,
          title: p.title || '',
          value: p.value || '',
          description: p.description || '',
          is_featured: !!p.is_featured,
          is_enabled: p.is_enabled !== false,
          features: p.features || [],
          displayOrder: p.displayOrder ?? 0
        })));
      }
      if (contentData) {
        form.setValue('h1_title', contentData.h1_title || '');
        form.setValue('paragraph', contentData.paragraph || '');
        form.setValue('title', contentData.title || '');
        form.setValue('subtitle', contentData.subtitle || '');
      }
    });
  }, [form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
        try {
            const { h1_title, paragraph, title, subtitle, plans } = values;
            await updatePricingPageContent({ h1_title, paragraph, title, subtitle });
            await updatePricingPlans(plans);

            toast({
              title: 'Success!',
              description: 'Pricing page settings have been updated.',
            });
            // Refetch after saving
             const [plansData, contentData] = await Promise.all([
                getPricingPlans(),
                getPricingPageContent()
            ]);
            if (plansData) {
               form.setValue('plans', plansData.map(p => ({
                 ...p, 
                 is_featured: !!p.is_featured,
                 is_enabled: p.is_enabled !== false,
                })) );
            }
            if (contentData) {
              form.setValue('h1_title', contentData.h1_title);
              form.setValue('paragraph', contentData.paragraph);
              form.setValue('title', contentData.title);
              form.setValue('subtitle', contentData.subtitle);
            }
        } catch(error) {
             toast({
                title: 'Error',
                description: 'Failed to update pricing page settings.',
                variant: 'destructive',
            })
        }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Page Settings</CardTitle>
        <CardDescription>Manage the content and plans for your pricing page.</CardDescription>
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

            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-lg font-semibold">Page Content</h3>
                <Separator />
                 <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Section Title</FormLabel>
                        <FormControl>
                            <Input placeholder="Pricing Section Title" {...field} />
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
                            <Textarea placeholder="Pricing Section Subtitle" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="space-y-4">
               <h3 className="text-lg font-semibold">Pricing Plans</h3>
               <Separator />
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-4 rounded-lg border p-4 relative">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold">Plan {index + 1}</h3>
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
                    name={`plans.${index}.displayOrder`}
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
                    name={`plans.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Plan Title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name={`plans.${index}.is_enabled`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-slate-50 dark:bg-slate-900/50">
                        <div className="space-y-0.5">
                            <FormLabel>Enable Price / Checkout</FormLabel>
                            <div className="text-[0.8rem] text-muted-foreground">
                              If disabled, button will link to Contact Us page
                            </div>
                        </div>
                        <FormControl>
                            <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`plans.${index}.value`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{form.watch(`plans.${index}.is_enabled`) ? 'Price' : 'Display Text (e.g. Get Quote)'}</FormLabel>
                        <FormControl>
                          <Input placeholder={form.watch(`plans.${index}.is_enabled`) ? "e.g., ₹9999" : "e.g., Get Quote"} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`plans.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Plan description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`plans.${index}.is_featured`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>Featured Plan</FormLabel>
                            <FormMessage />
                        </div>
                        <FormControl>
                            <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <PlanFeatures control={form.control} planIndex={index} />
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" onClick={() => append({ title: '', price: '0', description: '', is_featured: false, is_enabled: true, buttonText: 'Contact Us', features: [], displayOrder: fields.length + 1 })}>
                Add Pricing Plan
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


function PlanFeatures({ control, planIndex }: { control: any, planIndex: number }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `plans.${planIndex}.features`,
    });

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <FormLabel>Features</FormLabel>
            {fields.map((field, featureIndex) => (
                <div key={field.id} className="flex items-center gap-2">
                    <FormField
                        control={control}
                        name={`plans.${planIndex}.features.${featureIndex}.name`}
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
