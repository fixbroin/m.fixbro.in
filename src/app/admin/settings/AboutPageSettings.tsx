
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
import { getAboutPageContent, updateAboutPageContent, AboutPageContent } from './actions/about-actions';
import ImageUploadInput from './ImageUploadInput';

const formSchema = z.object({
    mission_title: z.string().min(5),
    mission_description: z.string().min(10),
    mission_image: z.string().optional(),
    stack_title: z.string().min(5),
    stack_description: z.string().min(10),
    skills: z.array(z.object({ name: z.string().min(1) })),
});

export default function AboutPageSettings() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mission_title: '',
      mission_description: '',
      mission_image: '',
      stack_title: '',
      stack_description: '',
      skills: []
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "skills",
  });

  useEffect(() => {
    startTransition(async () => {
        const data = await getAboutPageContent();
        if (data) {
            form.reset({
                mission_title: data.mission_title || '',
                mission_description: data.mission_description || '',
                mission_image: data.mission_image || '',
                stack_title: data.stack_title || '',
                stack_description: data.stack_description || '',
                skills: data.skills || []
            });
        }
    });
  }, [form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
        try {
            await updateAboutPageContent(values as AboutPageContent);
            toast({
              title: 'Success!',
              description: 'About page content has been updated.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update about page.',
                variant: 'destructive',
            })
        }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>About Page Content</CardTitle>
        <CardDescription>Update the content for the different sections of your About page.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-lg font-semibold">Mission Section</h3>
                <Separator />
                <FormField
                    control={form.control}
                    name="mission_title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                            <Input placeholder="Section title" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="mission_description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Section description" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="mission_image"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Image</FormLabel>
                        <FormControl>
                           <ImageUploadInput id="mission-image-upload" value={field.value} onChange={field.onChange} folder="about" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-lg font-semibold">Tech Stack Section</h3>
                <Separator />
                 <FormField
                    control={form.control}
                    name="stack_title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                            <Input placeholder="Section title" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="stack_description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Section description" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <FormLabel>Skills</FormLabel>
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                           <FormField
                                control={form.control}
                                name={`skills.${index}.name`}
                                render={({ field }) => (
                                    <FormItem className='flex-grow'>
                                    <FormControl>
                                        <Input placeholder="e.g. Next.js" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                                <Trash />
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => append({ name: '' })}>
                        Add Skill
                    </Button>
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
