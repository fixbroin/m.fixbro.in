
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, ShieldCheck } from "lucide-react";
import type { ConnectionAccessOption, ProviderApplication, UserProviderConnection } from '@/types/firestore';
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { useApplicationConfig } from '@/hooks/useApplicationConfig';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLoading } from "@/contexts/LoadingContext";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface ConnectionAccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  provider: ProviderApplication | null;
  options: ConnectionAccessOption[];
}

const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
});

export default function ConnectionAccessDialog({ isOpen, onClose, provider, options }: ConnectionAccessDialogProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>(options.length > 0 ? options[0].id : undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { config: appConfig } = useApplicationConfig();
  const { settings: globalSettings } = useGlobalSettings();
  const { showLoading, hideLoading } = useLoading();
  const router = useRouter();


  const handleProceedToPayment = async () => {
    if (!selectedOptionId) {
      toast({ title: "Please select an option.", variant: "default" });
      return;
    }
    if (!user || !provider) {
        toast({ title: "Error", description: "You must be logged in to proceed.", variant: "destructive" });
        return;
    }

    const selectedOption = options.find(opt => opt.id === selectedOptionId);
    if (!selectedOption) {
        toast({ title: "Error", description: "Selected option not found.", variant: "destructive" });
        return;
    }

    setIsProcessing(true);
    showLoading();

    if (!appConfig.enableOnlinePayment || !appConfig.razorpayKeyId) {
        toast({ title: "Online Payments Disabled", description: "Online payments are not available at this moment.", variant: "destructive" });
        setIsProcessing(false);
        hideLoading();
        return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast({ title: "Error", description: "Could not load payment gateway. Please check your connection and try again.", variant: "destructive" });
      setIsProcessing(false);
      hideLoading();
      return;
    }

    try {
      const orderResponse = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: Math.round(selectedOption.price * 100) }),
      });

      if (!orderResponse.ok) {
        const errorResult = await orderResponse.json();
        throw new Error(errorResult.error || 'Failed to create payment order.');
      }
      const orderDetails = await orderResponse.json();

      const razorpayOptions = {
        key: appConfig.razorpayKeyId,
        amount: orderDetails.amount,
        currency: "INR",
        name: globalSettings?.websiteName || "Fixbro",
        description: `Access to ${provider.fullName} - ${selectedOption.label}`,
        order_id: orderDetails.id,
        handler: (response: any) => {
          localStorage.setItem('razorpayPaymentId', response.razorpay_payment_id);
          localStorage.setItem('razorpayOrderId', response.razorpay_order_id);
          localStorage.setItem('razorpaySignature', response.razorpay_signature);
          localStorage.setItem('fixbroPaymentMethod', 'Online');

          // Specific keys for connection unlock flow
          localStorage.setItem('isProcessingConnectionUnlock', 'true');
          localStorage.setItem('connectionProviderId', provider.id);
          localStorage.setItem('connectionProviderName', provider.fullName || 'the provider');
          localStorage.setItem('connectionAccessType', selectedOption.id);
          const durationDays = selectedOption.durationDays || (selectedOption.id === 'oneTime' ? 1 : (selectedOption.id === 'lifetime' ? 9999 : 0));
          localStorage.setItem('connectionDurationDays', durationDays.toString());
          localStorage.setItem('connectionAmountPaid', selectedOption.price.toString());

          router.push(`/checkout/thank-you?status=connection-unlocked&providerId=${provider.id}`);
        },
        prefill: {
          name: user.displayName || undefined,
          email: user.email || undefined,
          contact: user.phoneNumber || undefined,
        },
        notes: {
          providerId: provider.id,
          userId: user.uid,
          accessType: selectedOption.id,
        },
        theme: { color: "#45A0A2" },
        modal: { ondismiss: () => { setIsProcessing(false); hideLoading(); }}
      };

      const rzp = new window.Razorpay(razorpayOptions);
      rzp.on('payment.failed', (response: any) => {
        toast({ title: "Payment Failed", description: response.error.description || "An error occurred during payment.", variant: "destructive" });
        setIsProcessing(false);
        hideLoading();
      });
      rzp.open();

    } catch (error) {
      toast({ title: "Payment Error", description: (error as Error).message, variant: "destructive" });
      setIsProcessing(false);
      hideLoading();
    }
  };
  
  if (!provider) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-headline">Unlock Contact Details</DialogTitle>
          <DialogDescription className="text-center">
            Connect with <span className="font-semibold">{provider.fullName}</span> by choosing an access option below.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup value={selectedOptionId} onValueChange={setSelectedOptionId} className="space-y-3">
            {options.map((option) => (
              <Label
                key={option.id}
                htmlFor={option.id}
                className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-all hover:border-primary ${selectedOptionId === option.id ? 'border-primary ring-2 ring-primary' : ''}`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.id === 'oneTime' ? 'Access for 24 hours' : option.id === 'lifetime' ? 'Unlimited access' : `Access for ${option.durationDays} days`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">₹{option.price}</span>
                    <RadioGroupItem value={option.id} id={option.id} />
                </div>
              </Label>
            ))}
          </RadioGroup>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button onClick={handleProceedToPayment} size="lg" disabled={isProcessing} className="w-full">
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Proceed to Pay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
