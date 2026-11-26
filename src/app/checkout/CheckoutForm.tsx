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
import { getPublicPaymentSettings } from '../admin/settings/actions/payment-actions';
import { useEffect, useState } from 'react';
import { APP_NAME } from '@/lib/config';
import { saveOrder, SaveOrderPayload, createRazorpayOrder } from './actions';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, CreditCard, Clock, CheckCircle2 } from 'lucide-react';
import { useLoading } from '@/context/LoadingContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import { cn } from '@/lib/utils';

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
  currencySymbol?: string;
}

export default function CheckoutForm({ planTitle, planPrice, currencySymbol = '₹' }: CheckoutFormProps) {
  const { toast } = useToast();
  const [isPreparing, setIsPreparing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState<string | null>(null);
  const [hasOnlineOption, setHasOnlineOption] = useState(false);
  const [hasPayLaterOption, setHasPayLaterOption] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'online' | 'pay_later'>('online');
  const router = useRouter();
  const { showLoader, hideLoader } = useLoading();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const settings = await getPublicPaymentSettings();
        const onlineAvailable = Boolean(settings?.enable_online_payments && settings?.razorpay_key_id);
        const payLaterAvailable = Boolean(settings?.enable_pay_later);

        setHasOnlineOption(onlineAvailable);
        setHasPayLaterOption(payLaterAvailable);

        if (onlineAvailable) {
          setRazorpayKey(settings.razorpay_key_id);
          setSelectedMethod('online');
        } else if (payLaterAvailable) {
          setSelectedMethod('pay_later');
        }
      } catch (e) {
        console.error("Failed to load payment settings:", e);
      } finally {
        setIsPreparing(false);
      }
    }
    fetchSettings();
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
    trackEvent('booking_funnel', { 
      step: 'details_submitted', 
      planTitle, 
      planPrice, 
      customerEmail: values.email,
      paymentMethod: selectedMethod 
    });

    // 1. Pay Later / Offline consultation flow
    if (selectedMethod === 'pay_later') {
      showLoader();
      const orderPayload: SaveOrderPayload = {
        customer_name: values.name,
        customer_email: values.email,
        plan_title: planTitle,
        amount: planPrice,
        payment_method: 'pay_later',
        status: 'pending',
      };

      const result = await saveOrder(orderPayload);
      hideLoader();

      if (result.success) {
        trackEvent('booking_funnel', { step: 'order_completed', planTitle, planPrice, method: 'pay_later' });
        toast({
          title: 'Booking Confirmed!',
          description: 'Thank you! Your consultation booking is received. A confirmation has been sent to your email.',
        });
        showLoader();
        router.push('/');
      } else {
        toast({
          title: 'Booking Failed',
          description: result.error || 'Could not complete your booking.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
      }
      return;
    }

    // 2. Online Payment (Razorpay) flow
    if (!razorpayKey) {
      toast({
        title: 'Payment Gateway Error',
        description: 'Online payment gateway is not configured yet. Please choose Pay Later or contact support.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    const orderResponse = await createRazorpayOrder({ 
      amount: planPrice,
      customer_name: values.name,
      customer_email: values.email,
      customer_phone: values.phone,
      plan_title: planTitle
    });

    if (!orderResponse.success || !orderResponse.order) {
      toast({ 
        title: 'Error', 
        description: orderResponse.error || 'Could not initiate online payment order.', 
        variant: 'destructive' 
      });
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
      handler: async function (response: any) {
        showLoader();
        trackEvent('booking_funnel', { 
          step: 'payment_successful', 
          planTitle, 
          planPrice, 
          razorpay_payment_id: response.razorpay_payment_id 
        });

        const orderPayload: SaveOrderPayload = {
          customer_name: values.name,
          customer_email: values.email,
          plan_title: planTitle,
          amount: planPrice,
          payment_method: 'razorpay',
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
        color: "#d97706"
      },
      modal: {
        ondismiss: function() {
          trackEvent('booking_funnel', { step: 'payment_modal_closed', planTitle, planPrice });
          setIsSubmitting(false);
        }
      }
    };
    
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', async function (response: any) {
      trackEvent('booking_funnel', { step: 'payment_failed', planTitle, planPrice, error: response.error?.description });
      const orderPayload: SaveOrderPayload = {
        customer_name: values.name,
        customer_email: values.email,
        plan_title: planTitle,
        amount: planPrice,
        payment_method: 'razorpay',
        razorpay_payment_id: response.error?.metadata?.payment_id || '',
        razorpay_order_id: response.error?.metadata?.order_id || '',
        razorpay_signature: '',
        status: 'failed'
      };
      await saveOrder(orderPayload);
      toast({
        title: 'Payment Failed',
        description: response.error?.description || 'Your payment was not completed.',
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
    );
  }

  const isSubmitDisabled = isSubmitting || (!hasOnlineOption && !hasPayLaterOption);

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
                    <Input type="tel" placeholder="+91 98765 43210" {...field} />
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
                  <Input placeholder="123, Design District" {...field} />
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
                    <Input placeholder="e.g. Bangalore" {...field} />
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
                    <Input placeholder="e.g. Karnataka" {...field} />
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
                  <FormLabel>Pincode / ZIP</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 560001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Payment Method Selection if both or Pay Later available */}
          {hasOnlineOption && hasPayLaterOption && (
            <div className="space-y-3 pt-2">
              <label className="text-sm font-semibold text-foreground">Select Payment Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setSelectedMethod('online')}
                  className={cn(
                    "cursor-pointer rounded-2xl border-2 p-4 transition-all duration-200 flex items-start gap-3",
                    selectedMethod === 'online'
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-border/80 bg-card"
                  )}
                >
                  <CreditCard className={cn("h-5 w-5 mt-0.5", selectedMethod === 'online' ? "text-primary" : "text-muted-foreground")} />
                  <div className="flex-1">
                    <p className="font-bold text-sm text-foreground">Pay Online Now</p>
                    <p className="text-xs text-muted-foreground">Cards, NetBanking, UPI, Razorpay</p>
                  </div>
                  {selectedMethod === 'online' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>

                <div
                  onClick={() => setSelectedMethod('pay_later')}
                  className={cn(
                    "cursor-pointer rounded-2xl border-2 p-4 transition-all duration-200 flex items-start gap-3",
                    selectedMethod === 'pay_later'
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-border/80 bg-card"
                  )}
                >
                  <Clock className={cn("h-5 w-5 mt-0.5", selectedMethod === 'pay_later' ? "text-primary" : "text-muted-foreground")} />
                  <div className="flex-1">
                    <p className="font-bold text-sm text-foreground">Pay Later / Offline</p>
                    <p className="text-xs text-muted-foreground">Pay after site visit or via bank transfer</p>
                  </div>
                  {selectedMethod === 'pay_later' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
              </div>
            </div>
          )}

          {!hasOnlineOption && hasPayLaterOption && (
            <div className="p-4 rounded-xl bg-muted/60 border border-border text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary flex-shrink-0" />
              <span>Offline Booking mode is enabled. No upfront online payment required. Pay after site consultation.</span>
            </div>
          )}

          <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20" disabled={isSubmitDisabled}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting
              ? 'Processing...'
              : selectedMethod === 'pay_later'
                ? 'Confirm Booking (Pay Later)'
                : `Proceed to Pay ${currencySymbol}${planPrice.toLocaleString()}`}
          </Button>
        </form>
      </Form>
    </>
  );
}
