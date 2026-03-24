
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
import { getEmailSettings, updateEmailSettings, EmailSettings } from './actions/email-actions';

const formSchema = z.object({
  smtp_host: z.string().min(1, 'Host is required'),
  smtp_port: z.coerce.number().min(1, 'Port is required'),
  smtp_sender_email: z.string().email('Invalid email address'),
  smtp_user: z.string().min(1, 'Username is required'),
  smtp_password: z.string().optional(),
});

export default function EmailConfigurationSettings() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      smtp_host: '',
      smtp_port: 587,
      smtp_sender_email: '',
      smtp_user: '',
      smtp_password: '',
    },
  });

  useEffect(() => {
    startTransition(async () => {
      const data = await getEmailSettings();
      if (data) {
        form.reset(data);
      }
    });
  }, [form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        await updateEmailSettings(values);
        toast({
          title: 'Success!',
          description: 'Email settings have been updated.',
        });
        // Re-fetch data to show the potentially new password
        const data = await getEmailSettings();
        if (data) {
            form.reset(data);
        }
      } catch (error) {
        toast({
            title: 'Error',
            description: 'Failed to update email settings.',
            variant: 'destructive',
        });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Configuration (SMTP)</CardTitle>
        <CardDescription>Configure your email settings for sending system notifications.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="smtp_host"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>SMTP Host</FormLabel>
                    <FormControl>
                        <Input placeholder="smtp.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="smtp_port"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>SMTP Port</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="587" {...field} value={isNaN(field.value) ? '' : field.value} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
                control={form.control}
                name="smtp_sender_email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Sender Email Address</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="noreply@example.com" {...field} />
                    </FormControl>
                     <FormDescription>
                        This is the 'From' address that your users will see.
                     </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="smtp_user"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>SMTP Username</FormLabel>
                        <FormControl>
                            <Input placeholder="your-smtp-username" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="smtp_password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>SMTP Password</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="•••••••••••••" {...field} />
                        </FormControl>
                        <FormDescription>
                            Your password is saved but will be displayed here. Leave blank only if you intend to remove it.
                        </FormDescription>
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
