
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
  h1_title: z.string().min(5, 'H1 Title must be at least 5 characters.'),
  paragraph: z.string().min(10, 'Paragraph must be at least 10 characters.'),
  email: z.string().email(),
  phone: z.string().min(1),
  location: z.string().min(1),
  enableFloatingButtons: z.boolean(),
  whatsAppNumber: z.string().min(10).describe("Include country code, e.g., 91..."),
  whatsAppMessage: z.string().optional(),
  buttonPosition: z.enum(['bottom-right', 'bottom-left']),
  animationStyle: z.enum(['none', 'shake', 'pulse-fab', 'bounce-fab', 'tada', 'jello', 'swing', 'wobble', 'heartbeat', 'rubberBand', 'flash', 'flip', 'float', 'glow', 'ring', 'shimmer', 'vibrate', 'pop', 'expand', 'shrink', 'spin-slow']),
});

export default function ContactPageSettings() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      h1_title: '',
      paragraph: '',
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
          h1_title: data.h1_title || '',
          paragraph: data.paragraph || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          enableFloatingButtons: data.enableFloatingButtons ?? true,
          whatsAppNumber: data.whatsAppNumber || '',
          whatsAppMessage: data.whatsAppMessage || '',
          buttonPosition: data.buttonPosition || 'bottom-right',
          animationStyle: (data.animationStyle as any) || 'shake',
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
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an animation" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="shake">Shake</SelectItem>
                                <SelectItem value="pulse-fab">Pulse</SelectItem>
                                <SelectItem value="bounce-fab">Bounce</SelectItem>
                                <SelectItem value="tada">Tada</SelectItem>
                                <SelectItem value="jello">Jello</SelectItem>
                                <SelectItem value="swing">Swing</SelectItem>
                                <SelectItem value="wobble">Wobble</SelectItem>
                                <SelectItem value="heartbeat">Heartbeat</SelectItem>
                                <SelectItem value="rubberBand">Rubber Band</SelectItem>
                                <SelectItem value="flash">Flash</SelectItem>
                                <SelectItem value="flip">Flip</SelectItem>
                                <SelectItem value="float">Float</SelectItem>
                                <SelectItem value="glow">Glow</SelectItem>
                                <SelectItem value="ring">Ring</SelectItem>
                                <SelectItem value="shimmer">Shimmer</SelectItem>
                                <SelectItem value="vibrate">Vibrate</SelectItem>
                                <SelectItem value="pop">Pop</SelectItem>
                                <SelectItem value="expand">Expand</SelectItem>
                                <SelectItem value="shrink">Shrink</SelectItem>
                                <SelectItem value="spin-slow">Slow Spin</SelectItem>
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
