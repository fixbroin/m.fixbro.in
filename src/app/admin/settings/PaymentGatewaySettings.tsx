"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useTransition, useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { getPaymentSettings, updatePaymentSettings, PaymentSettings } from './actions/payment-actions';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff } from 'lucide-react';

const formSchema = z.object({
  enable_online_payments: z.boolean(),
  razorpay_key_id: z.string().optional(),
  razorpay_key_secret: z.string().optional(),
  razorpay_webhook_secret: z.string().optional(),
  enable_pay_later: z.boolean(),
});

export default function PaymentGatewaySettings() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enable_online_payments: true,
      razorpay_key_id: '',
      razorpay_key_secret: '',
      razorpay_webhook_secret: '',
      enable_pay_later: false,
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setWebhookUrl(`${window.location.origin}/api/razorpay/webhook`);
    }
    async function loadSettings() {
        const data = await getPaymentSettings();
        if (data) {
            form.reset({
                enable_online_payments: data.enable_online_payments ?? true,
                razorpay_key_id: data.razorpay_key_id || '',
                razorpay_key_secret: data.razorpay_key_secret || '',
                razorpay_webhook_secret: data.razorpay_webhook_secret || '',
                enable_pay_later: data.enable_pay_later ?? false,
            });
        }
    }
    loadSettings();
  }, [form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
        try {
            await updatePaymentSettings(values as PaymentSettings);
            toast({
              title: 'Success!',
              description: 'Payment settings have been updated.',
            });
            // Re-fetch to confirm the new values are displayed
            const data = await getPaymentSettings();
            if (data) {
                form.reset({
                  enable_online_payments: data.enable_online_payments ?? true,
                  razorpay_key_id: data.razorpay_key_id || '',
                  razorpay_key_secret: data.razorpay_key_secret || '',
                  razorpay_webhook_secret: data.razorpay_webhook_secret || '',
                  enable_pay_later: data.enable_pay_later ?? false,
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update payment settings.',
                variant: 'destructive',
            })
        }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Gateway Settings</CardTitle>
        <CardDescription>Configure payment methods and gateway credentials.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <FormField
              control={form.control}
              name="enable_online_payments"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Online Payments (Razorpay)</FormLabel>
                    <FormDescription>
                      Allow customers to pay using online methods like UPI, Cards, Netbanking.
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

            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Razorpay Credentials</h3>
                <FormField
                    control={form.control}
                    name="razorpay_key_id"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Razorpay Key ID</FormLabel>
                        <FormControl>
                            <Input placeholder="rzp_live_..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="razorpay_key_secret"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Razorpay Key Secret</FormLabel>
                        <div className="relative">
                            <FormControl>
                                <Input type={showSecret ? "text" : "password"} placeholder="Enter your key secret" {...field} className="pr-10" />
                            </FormControl>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowSecret(!showSecret)}
                            >
                                {showSecret ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="space-y-4 rounded-lg border p-4 border-primary/20 bg-primary/5">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-primary">Webhook Settings</h3>
                <div className="space-y-2">
                    <FormLabel>Webhook URL</FormLabel>
                    <div className="flex gap-2">
                        <Input value={webhookUrl} readOnly className="bg-muted" />
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                                navigator.clipboard.writeText(webhookUrl);
                                toast({ title: "Copied!", description: "Webhook URL copied to clipboard." });
                            }}
                        >
                            Copy
                        </Button>
                    </div>
                    <p className="text-[0.8rem] text-muted-foreground">
                        Configure this URL in your Razorpay Dashboard under Webhooks.
                    </p>
                </div>

                <FormField
                    control={form.control}
                    name="razorpay_webhook_secret"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Webhook Secret (Optional but Recommended)</FormLabel>
                        <div className="relative">
                            <FormControl>
                                <Input type={showWebhookSecret ? "text" : "password"} placeholder="Enter webhook secret" {...field} className="pr-10" />
                            </FormControl>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                            >
                                {showWebhookSecret ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </div>
                        <FormDescription>
                            Must match the secret set in Razorpay dashboard for security.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
             <FormField
              control={form.control}
              name="enable_pay_later"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable "Pay After Service"</FormLabel>
                    <FormDescription>
                      Allow customers to opt for paying after the service is completed.
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


            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Payment Settings'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
