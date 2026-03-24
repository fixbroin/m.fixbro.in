
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { useToast } from '@/hooks/use-toast';
import { getPaymentSettings } from '../admin/settings/actions/payment-actions';
import { useEffect, useState } from 'react';
import { APP_NAME } from '@/lib/config';
import { saveOrder, SaveOrderPayload, createRazorpayOrder } from './actions';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { useLoading } from '@/context/LoadingContext';
import { useAnalytics } from '@/context/AnalyticsContext';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  address: z.string().min(5, { message: 'Address is required.' }),
  city: z.string().min(2, { message: 'City is required.' }),
  state: z.string().min(2, { message: 'State is required.' }),
  pincode: z.string().min(6, { message: 'A valid 6-digit pincode is required.' }),
});

declare global {
    interface Window {
      Razorpay: any;
    }
}

interface CheckoutFormProps {
    planTitle: string;
    planPrice: number;
}

function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium text-foreground">
          Finalizing your order, please wait...
        </p>
      </div>
    </div>
  );
}


export default function CheckoutForm({ planTitle, planPrice }: CheckoutFormProps) {
  const { toast } = useToast();
  const [isPreparing, setIsPreparing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState<string | null>(null);
  const router = useRouter();
  const { showLoader, hideLoader } = useLoading();
  const { trackEvent } = useAnalytics();


  useEffect(() => {
    async function fetchKey() {
        const settings = await getPaymentSettings();
        if (settings?.enable_online_payments && settings.razorpay_key_id) {
            setRazorpayKey(settings.razorpay_key_id);
        }
        setIsPreparing(false);
    }
    fetchKey();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    },
  });

   useEffect(() => {
    trackEvent('booking_funnel', { step: 'checkout_page_opened', planTitle, planPrice });
  }, [trackEvent, planTitle, planPrice]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    trackEvent('booking_funnel', { step: 'details_submitted', planTitle, planPrice, customerEmail: values.email });


    if (!razorpayKey) {
      toast({
          title: 'Error',
          description: 'Online payments are not configured correctly. Please contact support.',
          variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }
    
    const orderResponse = await createRazorpayOrder({ amount: planPrice });

    if (!orderResponse.success || !orderResponse.order) {
      toast({ title: 'Error', description: orderResponse.error || 'Could not create payment order.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    const order = orderResponse.order;

    const options = {
      key: razorpayKey,
      amount: order.amount,
      currency: order.currency,
      name: APP_NAME,
      description: `Payment for ${planTitle}`,
      order_id: order.id,
      handler: async function (response: any){
          showLoader();
          trackEvent('booking_funnel', { step: 'payment_successful', planTitle, planPrice, razorpay_payment_id: response.razorpay_payment_id });

          const orderPayload: SaveOrderPayload = {
            customer_name: values.name,
            customer_email: values.email,
            plan_title: planTitle,
            amount: planPrice,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            status: 'completed'
          };

          const result = await saveOrder(orderPayload);
          hideLoader();

          if (result.success) {
            trackEvent('booking_funnel', { step: 'order_completed', planTitle, planPrice });

            toast({
                title: 'Payment Successful!',
                description: `Thank you for your order! A confirmation has been sent to your email.`,
            });
            showLoader();
            router.push('/');
          } else {
             toast({
                title: 'Save Order Failed',
                description: result.error,
                variant: 'destructive',
            });
            setIsSubmitting(false);
          }
      },
      prefill: {
          name: values.name,
          email: values.email,
          contact: values.phone
      },
      notes: {
          address: `${values.address}, ${values.city}, ${values.state} - ${values.pincode}`
      },
      theme: {
          color: "#3498db"
      },
      modal: {
        ondismiss: function() {
          trackEvent('booking_funnel', { step: 'payment_modal_closed', planTitle, planPrice });
          setIsSubmitting(false); // Re-enable button if user closes Razorpay modal
        }
      }
    };
    
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', async function (response: any){
      trackEvent('booking_funnel', { step: 'payment_failed', planTitle, planPrice, error: response.error.description });
      const orderPayload: SaveOrderPayload = {
            customer_name: values.name,
            customer_email: values.email,
            plan_title: planTitle,
            amount: planPrice,
            razorpay_payment_id: response.error.metadata.payment_id,
            razorpay_order_id: response.error.metadata.order_id,
            razorpay_signature: '',
            status: 'failed'
          };
      await saveOrder(orderPayload);
      toast({
          title: 'Payment Failed',
          description: response.error.description,
          variant: 'destructive',
      });
      setIsSubmitting(false);
    });
    rzp.open();
  }
  
  if (isPreparing) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }

  return (
    <>
      {isSubmitting && <div className="fixed inset-0 z-[101] bg-background/80 backdrop-blur-sm" />}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
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
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                      <Input type="tel" placeholder="+91 12345 67890" {...field} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
              />
          </div>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input placeholder="123, Main Street" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                          <Input placeholder="e.g. Mumbai" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
              <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                          <Input placeholder="e.g. Maharashtra" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
              <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                          <Input placeholder="e.g. 400001" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || !razorpayKey}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'Processing...' : `Proceed to Pay ₹${planPrice.toLocaleString()}`}
          </Button>
        </form>
      </Form>
    </>
  );
}
