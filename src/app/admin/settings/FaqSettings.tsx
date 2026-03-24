
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
import { getFaqs, updateFaqs, FaqItem } from './actions/faq-actions';

const faqItemSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
});

const formSchema = z.object({
  faqs: z.array(faqItemSchema),
});

export default function FaqSettings() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      faqs: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "faqs",
  });

  useEffect(() => {
    startTransition(async () => {
      const data = await getFaqs();
      if (data) {
        form.reset({ 
          faqs: data.map(f => ({
            ...f,
            question: f.question || '',
            answer: f.answer || '',
            displayOrder: f.displayOrder ?? 0
          }))
        });
      }
    });
  }, [form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
        try {
            await updateFaqs(values.faqs as FaqItem[]);
            toast({
              title: 'Success!',
              description: 'FAQs have been updated.',
            });
            const data = await getFaqs();
            if (data) {
                form.reset({ 
                  faqs: data.map(f => ({
                    ...f,
                    question: f.question || '',
                    answer: f.answer || '',
                    displayOrder: f.displayOrder ?? 0
                  }))
                });
            }
        } catch(error) {
            toast({
                title: 'Error',
                description: 'Failed to update FAQs.',
                variant: 'destructive',
            })
        }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>FAQ Section Settings</CardTitle>
        <CardDescription>Manage the questions and answers on your homepage.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-4 rounded-lg border p-4 relative">
                  <h3 className="text-lg font-semibold">FAQ {index + 1}</h3>
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
                    name={`faqs.${index}.question`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question</FormLabel>
                        <FormControl>
                          <Input placeholder="Question" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`faqs.${index}.answer`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Answer</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Answer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" onClick={() => append({ question: '', answer: '' })}>
                Add FAQ
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
