
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
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getContactDetails, updateContactDetails, ContactDetails } from './actions/contact-actions';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(1),
  location: z.string().min(1),
  enableFloatingButtons: z.boolean(),
  whatsAppNumber: z.string().min(10).describe("Include country code, e.g., 91..."),
  whatsAppMessage: z.string().optional(),
  buttonPosition: z.enum(['bottom-right', 'bottom-left']),
  animationStyle: z.enum(['none', 'shake', 'pulse', 'bounce', 'tada', 'jello', 'swing']),
});

export default function ContactPageSettings() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      phone: '',
      location: '',
      enableFloatingButtons: true,
      whatsAppNumber: '',
      whatsAppMessage: '',
      buttonPosition: 'bottom-right',
      animationStyle: 'shake',
    },
  });

  useEffect(() => {
    startTransition(async () => {
      const data = await getContactDetails();
      if (data) {
        form.reset({
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          enableFloatingButtons: data.enableFloatingButtons ?? true,
          whatsAppNumber: data.whatsAppNumber || '',
          whatsAppMessage: data.whatsAppMessage || '',
          buttonPosition: data.buttonPosition || 'bottom-right',
          animationStyle: data.animationStyle || 'shake',
        });
      }
    });
  }, [form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        await updateContactDetails(values as ContactDetails);
        toast({
          title: 'Success!',
          description: 'Contact details have been updated.',
        });
      } catch (error) {
        toast({
            title: 'Error',
            description: 'Failed to update contact details.',
            variant: 'destructive',
        });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Page & Floating Buttons</CardTitle>
        <CardDescription>Update your public contact information and floating action buttons.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <Separator />
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                        <Input placeholder="your-email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                        <Input placeholder="+1 234 567 890" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                        <Input placeholder="City, Country" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-lg font-semibold">Floating Buttons</h3>
                <Separator />
                <FormField
                    control={form.control}
                    name="enableFloatingButtons"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Floating Buttons</FormLabel>
                            <FormDescription>
                                Show the floating Call and WhatsApp buttons on your website.
                            </FormDescription>
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
                    name="whatsAppNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>WhatsApp Number</FormLabel>
                        <FormControl>
                            <Input placeholder="910000000000" {...field} />
                        </FormControl>
                        <FormDescription>Include country code without '+' or '00'.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="whatsAppMessage"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Default WhatsApp Message (Optional)</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Hi, I'm interested in your services." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="buttonPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Button Position</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select button position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bottom-right">Bottom Right</SelectItem>
                          <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="animationStyle"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Button Animation</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an animation" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="shake">Shake</SelectItem>
                                <SelectItem value="pulse">Pulse</SelectItem>
                                <SelectItem value="bounce">Bounce</SelectItem>
                                <SelectItem value="tada">Tada</SelectItem>
                                <SelectItem value="jello">Jello</SelectItem>
                                <SelectItem value="swing">Swing</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormDescription>Choose an animation to attract attention.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
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
