
"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowRight, ArrowLeft, CreditCard, Landmark, IndianRupee, Wallet, Info, Clock, Loader2, Tag, CheckCircle, XCircle, ListOrdered, HandCoins, Ban, ShieldCheck, Phone, MessageSquare, Mail, Home } from 'lucide-react';
import CheckoutStepper from '@/components/checkout/CheckoutStepper';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, Timestamp, doc, getDoc, runTransaction, query, where, getDocs, limit, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import type { FirestoreBooking, BookingServiceItem, FirestoreService, FirestorePromoCode, AppSettings, AppliedPlatformFeeItem, FirestoreNotification, BookingStatus, MarketingAutomationSettings, MarketingSettings, UserProviderConnection, ProviderApplication, PriceVariant } from '@/types/firestore';
import { getCartEntries, saveCartEntries, syncCartToFirestore } from '@/lib/cartManager';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { sendBookingConfirmationEmail, type BookingConfirmationEmailInput } from '@/ai/flows/sendBookingEmailFlow';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLoading } from '@/contexts/LoadingContext';
import { useApplicationConfig } from '@/hooks/useApplicationConfig';
import { ADMIN_EMAIL } from '@/contexts/AuthContext';
import { logUserActivity } from '@/lib/activityLogger';
import { getGuestId } from '@/lib/guestIdManager';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { isWebView, requestNativePayment } from '@/lib/webview-bridge';
import { sendConnectionUnlockEmail, type ConnectionUnlockEmailInput } from '@/ai/flows/sendConnectionUnlockEmailFlow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Add type declarations for GTM dataLayer and gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

interface DisplayBookingDetails extends Omit<FirestoreBooking, 'services' | 'createdAt' | 'updatedAt' | 'appliedPlatformFees' | 'latitude' | 'longitude'> {
  id?: string;
  servicesSummary: string;
  createdAt?: string; // Display format
  scheduledDateDisplay?: string; // Display format
  latitude?: number | null;
  longitude?: number | null;
  visitingChargeDisplayed?: number;
  discountCode?: string;
  discountAmount?: number;
  appliedPlatformFees?: AppliedPlatformFeeItem[];
}

const generateBookingId = () => {
  const now = new Date();
  const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `Fixbro-${timestamp}-${randomSuffix}`;
};

const getBasePriceForInvoice = (displayedPrice: number, isTaxInclusive?: boolean, taxPercent?: number): number => {
  if (isTaxInclusive && taxPercent && taxPercent > 0) {
    return displayedPrice / (1 + taxPercent / 100);
  }
  return displayedPrice;
};

const formatDateForDisplay = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString.replace(/-/g, '/')); // Handle YYYY-MM-DD
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        return dateString; // Fallback to original string if parsing fails
    }
};

const clearLocalStorageItems = async (userId?: string, clearConnectionItems: boolean = true) => {
    if (clearConnectionItems) {
      localStorage.removeItem('isProcessingConnectionUnlock');
      localStorage.removeItem('connectionProviderId');
      localStorage.removeItem('connectionAccessType');
      localStorage.removeItem('connectionDurationDays');
      localStorage.removeItem('connectionAmountPaid');
    }

    saveCartEntries([]);
    if(userId) {
        try {
          await deleteDoc(doc(db, "userCarts", userId));
        } catch (error) {
          console.error("Failed to delete Firestore cart for user:", userId, error);
        }
    }
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new StorageEvent('storage', { key: 'fixbroUserCart' }));
        localStorage.removeItem('fixbroScheduledDate');
        localStorage.removeItem('fixbroScheduledTimeSlot');
        localStorage.removeItem('fixbroCustomerAddress');
        localStorage.removeItem('razorpayPaymentId');
        localStorage.removeItem('razorpayOrderId');
        localStorage.removeItem('razorpaySignature');
        localStorage.removeItem('fixbroAppliedPromoCode');
        localStorage.removeItem('fixbroBookingDiscountCode');
        localStorage.removeItem('fixbroBookingDiscountAmount');
        localStorage.removeItem('fixbroAppliedPromoCodeId');
        localStorage.removeItem('fixbroAppliedPlatformFees');
        localStorage.removeItem('isProcessingCancellationFee');
        localStorage.removeItem('bookingIdForCancellationFee');
        localStorage.removeItem('cancellationFeeAmount');
        localStorage.removeItem('fixbroPaymentMethod');
        localStorage.removeItem('fixbroFinalBookingTotal');
    }
};

const getPriceForNthUnit = (service: FirestoreService, n: number): number => {
  if (!service.hasPriceVariants || !service.priceVariants || service.priceVariants.length === 0 || n <= 0) {
    return service.discountedPrice ?? service.price;
  }
  const sortedVariants = [...service.priceVariants].sort((a, b) => a.fromQuantity - b.fromQuantity);
  let applicableTier = sortedVariants.find(tier => {
    const start = tier.fromQuantity;
    const end = tier.toQuantity ?? Infinity;
    return n >= start && n <= end;
  });
  if (applicableTier) return applicableTier.price;
  const lastApplicableTier = sortedVariants.slice().reverse().find(tier => n >= tier.fromQuantity);
  if (lastApplicableTier) return lastApplicableTier.price;
  return service.discountedPrice ?? service.price;
};
  
const calculateIncrementalTotalPriceForItem = (service: FirestoreService, quantity: number): number => {
    if (!service.hasPriceVariants || !service.priceVariants || service.priceVariants.length === 0) {
        const unitPrice = service.discountedPrice ?? service.price;
        return unitPrice * quantity;
    }
    let total = 0;
    for (let i = 1; i <= quantity; i++) {
        total += getPriceForNthUnit(service, i);
    }
    return total;
};

export default function ThankYouPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [bookingDetailsForDisplay, setBookingDetailsForDisplay] = useState<DisplayBookingDetails | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isCancellationConfirmation, setIsCancellationConfirmation] = useState(false);
  const [cancelledBookingId, setCancelledBookingId] = useState<string | null>(null); 
  const [cancellationFeePaidAmount, setCancellationFeePaidAmount] = useState<number>(0);
  const { toast } = useToast();
  const { user: currentUser, firestoreUser } = useAuth();
  const router = useRouter();
  const { hideLoading } = useLoading();
  const { config: appConfig, isLoading: isLoadingAppSettings } = useApplicationConfig();
  const { settings: globalSettings, isLoading: isLoadingGlobalSettings } = useGlobalSettings();
  const searchParams = useSearchParams();
  
  const [unlockedProviderDetails, setUnlockedProviderDetails] = useState<ProviderApplication | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleWhatsAppClick = (mobileNumber?: string | null) => {
    if (mobileNumber) {
      let phoneNumber = mobileNumber.replace(/\D/g, '');
      if (phoneNumber.length === 10) {
        phoneNumber = '91' + phoneNumber;
      } else if (phoneNumber.length === 11 && phoneNumber.startsWith('0')) {
        phoneNumber = '91' + phoneNumber.substring(1);
      }
      
      const text = encodeURIComponent(`Hi, I've just unlocked your contact details on Fixbro and would like to connect.`);
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${text}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  useEffect(() => {
    if (!isMounted || isLoadingAppSettings || isLoadingGlobalSettings) return;

    const processPage = async () => {
      setIsLoadingPage(true);
      hideLoading();
      
      const statusParam = searchParams.get('status');
      const providerIdParam = searchParams.get('providerId');
      const isConnectionFlow = statusParam === 'connection-unlocked' && providerIdParam;

      if (isConnectionFlow) {
        const isFirstTimeProcessing = localStorage.getItem('isProcessingConnectionUnlock') === 'true';
        let paymentVerified = !isFirstTimeProcessing; // Assume verified on refresh

        if (isFirstTimeProcessing) {
          const razorpayPaymentId = localStorage.getItem('razorpayPaymentId'); 
          const razorpayOrderId = localStorage.getItem('razorpayOrderId');
          const razorpaySignature = localStorage.getItem('razorpaySignature');
          
          if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
            toast({ title: "Verification Failed", description: "Connection payment details missing.", variant: "destructive" });
            router.push(`/provider/${providerIdParam}`);
            setIsLoadingPage(false);
            return;
          }
          
          try {
            const verificationResponse = await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ razorpay_payment_id: razorpayPaymentId, razorpay_order_id: razorpayOrderId, razorpay_signature: razorpaySignature }),
            });
            const verificationResult = await verificationResponse.json();
            if (!verificationResult.success || verificationResult.status !== 'captured') {
                throw new Error(verificationResult.error || "Connection payment verification failed.");
            }
            paymentVerified = true;
            toast({ title: "Payment Verified", description: "Your payment has been successfully verified." });

            if (currentUser) {
                const accessType = localStorage.getItem('connectionAccessType') as UserProviderConnection['accessType'];
                const durationDays = parseInt(localStorage.getItem('connectionDurationDays') || '0', 10);
                const expiryDate = new Date();
                let expiresAt: Timestamp | null = null;
                if (accessType !== 'lifetime') {
                    const finalDuration = durationDays > 0 ? durationDays : 1;
                    expiryDate.setDate(expiryDate.getDate() + finalDuration);
                    expiresAt = Timestamp.fromDate(expiryDate);
                }
                const connectionData: UserProviderConnection = {
                    userId: currentUser.uid,
                    providerId: providerIdParam,
                    accessType,
                    grantedAt: Timestamp.now(),
                    expiresAt,
                    paymentId: razorpayPaymentId
                };
                await setDoc(doc(db, "userProviderConnections", `${currentUser.uid}_${providerIdParam}`), connectionData);
                
                // Send emails after successfully saving connection
                const providerDocSnap = await getDoc(doc(db, "providerApplications", providerIdParam));
                if (providerDocSnap.exists()) {
                    const providerDetails = providerDocSnap.data() as ProviderApplication;
                     const emailInput: ConnectionUnlockEmailInput = {
                        userName: currentUser.displayName || "Valued User",
                        userEmail: firestoreUser?.email || currentUser.email || "",
                        userMobile: firestoreUser?.mobileNumber || currentUser.phoneNumber || "N/A",
                        providerName: providerDetails.fullName || "A Provider",
                        providerEmail: providerDetails.email,
                        providerCategory: providerDetails.workCategoryName || "General Services",
                        transactionId: razorpayPaymentId || "N/A",
                        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                        smtpHost: appConfig?.smtpHost,
                        smtpPort: appConfig?.smtpPort,
                        smtpUser: appConfig?.smtpUser,
                        smtpPass: appConfig?.smtpPass,
                        senderEmail: appConfig?.senderEmail,
                        siteName: globalSettings?.websiteName,
                        logoUrl: globalSettings?.logoUrl,
                    };
                    sendConnectionUnlockEmail(emailInput).then(result => {
                        if (!result.success) console.error("Failed to send free connection unlock emails:", result.message);
                        else console.log("Connection unlock emails sent successfully.");
                    });
                }
            }
            clearLocalStorageItems(currentUser?.uid, true); 
          } catch (error) {
              console.error("Error during connection payment verification/update:", error);
              toast({ title: "Payment Error", description: (error as Error).message, variant: "destructive" });
              router.push(`/provider/${providerIdParam}`);
              setIsLoadingPage(false);
              return;
          }
        }
        
        if (paymentVerified) {
          try {
              const providerDocRef = doc(db, "providerApplications", providerIdParam);
              const providerDocSnap = await getDoc(providerDocRef);
              if (providerDocSnap.exists()) {
                  setUnlockedProviderDetails({ id: providerDocSnap.id, ...providerDocSnap.data() } as ProviderApplication);
              } else {
                  throw new Error("Provider details not found after unlocking.");
              }
          } catch (e) {
              toast({ title: "Error", description: "Could not load provider details.", variant: "destructive" });
          }
        }
        setIsLoadingPage(false);
        return;
      }

      // --- Start Normal Booking & Cancellation Fee Flow ---
      
      const paymentMethod = localStorage.getItem('fixbroPaymentMethod');
      const isOnlinePayment = paymentMethod === 'Online';
      const isProcessingCancellationFee = localStorage.getItem('isProcessingCancellationFee') === 'true';
      const razorpayPaymentId = localStorage.getItem('razorpayPaymentId'); 
      const razorpayOrderId = localStorage.getItem('razorpayOrderId');
      const razorpaySignature = localStorage.getItem('razorpaySignature');

      if (isProcessingCancellationFee) {
         const bookingFirestoreDocIdForCancellation = localStorage.getItem('bookingIdForCancellationFee');
          const feeAmountStr = localStorage.getItem('cancellationFeeAmount');

          if (bookingFirestoreDocIdForCancellation && feeAmountStr && razorpayPaymentId) {
            try {
                const verificationResponse = await fetch('/api/razorpay/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ razorpay_payment_id: razorpayPaymentId, razorpay_order_id: razorpayOrderId, razorpay_signature: razorpaySignature }),
                });
                const verificationResult = await verificationResponse.json();
                if (!verificationResult.success || verificationResult.status !== 'captured') {
                    throw new Error(verificationResult.error || "Payment verification failed.");
                }
                toast({ title: "Payment Verified", description: "Your payment has been successfully verified." });
                
                setIsCancellationConfirmation(true);
                const feeAmount = parseFloat(feeAmountStr);
                setCancellationFeePaidAmount(feeAmount);
                
                const originalBookingRef = doc(db, "bookings", bookingFirestoreDocIdForCancellation);
                const originalBookingSnap = await getDoc(originalBookingRef);
                if (originalBookingSnap.exists()) {
                    const originalBookingData = originalBookingSnap.data() as FirestoreBooking;
                    setCancelledBookingId(originalBookingData.bookingId);
                    await updateDoc(originalBookingRef, { 
                        status: "Cancelled" as BookingStatus, 
                        updatedAt: Timestamp.now(),
                        cancellationFeePaid: feeAmount,
                        cancellationPaymentId: razorpayPaymentId,
                    });
                    toast({ title: "Booking Cancelled", description: `Booking ${originalBookingData.bookingId} has been cancelled.` });
                } else {
                    toast({ title: "Error", description: "Original booking not found.", variant: "destructive" });
                }
            } catch (error) {
                console.error("Error during cancellation payment verification/update:", error);
                toast({ title: "Payment Error", description: (error as Error).message || "Failed to verify payment. Please contact support.", variant: "destructive" });
            } finally {
                clearLocalStorageItems(currentUser?.uid, true);
                setIsLoadingPage(false);
            }
            return;
        }
      }
      
      const cartEntriesFromStorage = getCartEntries();
      if (cartEntriesFromStorage.length === 0) {
        toast({ title: "Booking Processed", description: "Redirecting to My Bookings.", variant: "default" });
        router.push('/my-bookings');
        setIsLoadingPage(false);
        return;
      }

      if (isOnlinePayment) {
        if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
            toast({ title: "Verification Failed", description: "Payment details are missing. Please contact support if you were charged.", variant: "destructive" });
            router.push('/cart'); setIsLoadingPage(false); return;
        }
        try {
            const verificationResponse = await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ razorpay_payment_id: razorpayPaymentId, razorpay_order_id: razorpayOrderId, razorpay_signature: razorpaySignature }),
            });
            const verificationResult = await verificationResponse.json();
            if (!verificationResult.success || verificationResult.status !== 'captured') {
                throw new Error(verificationResult.error || "Payment verification failed. Please contact support.");
            }
            toast({ title: "Payment Verified", description: "Your payment has been successfully verified." });
        } catch (error) {
            console.error("Error during regular payment verification:", error);
            toast({ title: "Payment Error", description: (error as Error).message, variant: "destructive", duration: 7000 });
            router.push('/checkout/payment'); setIsLoadingPage(false); return;
        }
      }

      try {
        const newBookingId = generateBookingId();
        let customerEmail = "customer@example.com", scheduledDateStored = new Date().toLocaleDateString('en-CA'), scheduledTimeSlot = "10:00 AM";
        let customerName = "Guest User", customerPhone = "N/A", addressLine1 = "N/A", addressLine2: string | undefined, city = "N/A", state = "N/A", pincode = "N/A";
        let latitude: number | undefined, longitude: number | undefined;
        let bookingDiscountCode: string | undefined, bookingDiscountAmount: number | undefined, appliedPromoCodeId: string | undefined;
        let storedAppliedPlatformFees: AppliedPlatformFeeItem[] = [];

        if (typeof window !== 'undefined') {
          customerEmail = localStorage.getItem('fixbroCustomerEmail') || customerEmail;
          scheduledDateStored = localStorage.getItem('fixbroScheduledDate') || scheduledDateStored; 
          scheduledTimeSlot = localStorage.getItem('fixbroScheduledTimeSlot') || scheduledTimeSlot;
          bookingDiscountCode = localStorage.getItem('fixbroBookingDiscountCode') || undefined;
          const discountAmountStr = localStorage.getItem('fixbroBookingDiscountAmount');
          bookingDiscountAmount = discountAmountStr ? parseFloat(discountAmountStr) : undefined;
          appliedPromoCodeId = localStorage.getItem('fixbroAppliedPromoCodeId') || undefined;
          const platformFeesStr = localStorage.getItem('fixbroAppliedPlatformFees');
          if (platformFeesStr) { try { storedAppliedPlatformFees = JSON.parse(platformFeesStr); } catch (e) { console.error("Error parsing stored platform fees:", e); } }
          const addressDataString = localStorage.getItem('fixbroCustomerAddress');
          if (addressDataString) { const addressData = JSON.parse(addressDataString); customerName = addressData.fullName || customerName; customerPhone = addressData.phone || customerPhone; addressLine1 = addressData.addressLine1 || addressLine1; addressLine2 = addressData.addressLine2 || undefined; city = addressData.city || city; state = addressData.state || state; pincode = addressData.pincode || pincode; latitude = addressData.latitude === null ? undefined : addressData.latitude; longitude = addressData.longitude === null ? undefined : addressData.longitude; }
        }

        let sumOfDisplayedItemPrices = 0;
        const serviceItemsPromises = cartEntriesFromStorage.map(async (entry) => {
          const serviceDocRef = doc(db, "adminServices", entry.serviceId);
          const serviceSnap = await getDoc(serviceDocRef);
          if (serviceSnap.exists()) {
            const serviceData = serviceSnap.data() as FirestoreService;
            const displayedPriceForQuantity = calculateIncrementalTotalPriceForItem(serviceData, entry.quantity);
            sumOfDisplayedItemPrices += displayedPriceForQuantity;
            
            const itemTaxRate = (serviceData.taxPercent || 0) > 0 ? (serviceData.taxPercent || 0) : 0;
            const basePriceForQuantity = getBasePriceForInvoice(displayedPriceForQuantity, serviceData.isTaxInclusive === true, itemTaxRate);
            const taxAmountForItem = basePriceForQuantity * (itemTaxRate / 100);

            return { serviceId: entry.serviceId, name: serviceData.name, quantity: entry.quantity, pricePerUnit: displayedPriceForQuantity / entry.quantity,
              discountedPricePerUnit: serviceData.discountedPrice, 
              isTaxInclusive: serviceData.isTaxInclusive === true, 
              taxPercentApplied: itemTaxRate, taxAmountForItem: taxAmountForItem,
              _basePriceForBooking: basePriceForQuantity / entry.quantity 
            };
          } return null;
        });
        const resolvedServiceItems = (await Promise.all(serviceItemsPromises)).filter(item => item !== null) as (BookingServiceItem & {_basePriceForBooking: number})[];
        if (resolvedServiceItems.length !== cartEntriesFromStorage.length) { toast({title: "Error", description: "Some cart services not found. Booking aborted.", variant: "destructive"}); setIsLoadingPage(false); router.push('/cart'); return; }

        let baseSubTotalForBooking = resolvedServiceItems.reduce((sum, item) => sum + (item._basePriceForBooking * item.quantity), 0);
        
        let displayedVisitingCharge = 0; let baseVisitingChargeForBooking = 0; 
        const subtotalForVcPolicyCheck = sumOfDisplayedItemPrices - (bookingDiscountAmount || 0);
        if (appConfig.enableMinimumBookingPolicy && typeof appConfig.minimumBookingAmount === 'number' && typeof appConfig.visitingChargeAmount === 'number') { if (subtotalForVcPolicyCheck > 0 && subtotalForVcPolicyCheck < appConfig.minimumBookingAmount) { displayedVisitingCharge = appConfig.visitingChargeAmount; baseVisitingChargeForBooking = getBasePriceForInvoice(displayedVisitingCharge, appConfig.isVisitingChargeTaxInclusive, appConfig.visitingChargeTaxPercent); } }
        
        let totalItemTax = resolvedServiceItems.reduce((sum, item) => sum + (item.taxAmountForItem || 0), 0);
        let visitingChargeTax = 0; if (appConfig.enableTaxOnVisitingCharge && baseVisitingChargeForBooking > 0 && (appConfig.visitingChargeTaxPercent || 0) > 0) { visitingChargeTax = baseVisitingChargeForBooking * ((appConfig.visitingChargeTaxPercent || 0) / 100); }
        
        let totalBasePlatformFees = storedAppliedPlatformFees.reduce((sum, fee) => sum + fee.calculatedFeeAmount, 0);
        let totalTaxOnPlatformFees = storedAppliedPlatformFees.reduce((sum, fee) => sum + fee.taxAmountOnFee, 0);
        
        const totalTaxForBooking = totalItemTax + visitingChargeTax + totalTaxOnPlatformFees;
        const totalAmountForBooking = baseSubTotalForBooking + baseVisitingChargeForBooking + totalBasePlatformFees + totalTaxForBooking - (bookingDiscountAmount || 0);

        const bookingStatus: FirestoreBooking['status'] = (paymentMethod === 'later' || paymentMethod === 'Pay After Service') ? "Pending Payment" : "Confirmed";

        const newBookingData: Omit<FirestoreBooking, 'id'> = {
          bookingId: newBookingId, ...(currentUser?.uid && { userId: currentUser.uid }),
          customerName, customerEmail, customerPhone, addressLine1, ...(addressLine2 && { addressLine2 }), city, state, pincode,
          ...(latitude !== undefined && { latitude }), ...(longitude !== undefined && { longitude }),
          scheduledDate: scheduledDateStored,
          scheduledTimeSlot, 
          services: resolvedServiceItems.map(({ _basePriceForBooking, ...rest }) => rest),
          subTotal: baseSubTotalForBooking,
          ...(baseVisitingChargeForBooking > 0 && { visitingCharge: baseVisitingChargeForBooking }),
          taxAmount: totalTaxForBooking, totalAmount: totalAmountForBooking,
          ...(bookingDiscountCode !== undefined && { discountCode: bookingDiscountCode }),
          ...(bookingDiscountAmount !== undefined && { discountAmount: bookingDiscountAmount }),
          ...(storedAppliedPlatformFees.length > 0 && { appliedPlatformFees: storedAppliedPlatformFees }),
          paymentMethod: paymentMethod || "Unknown",
          status: bookingStatus,
          ...(razorpayPaymentId && { razorpayPaymentId }),
          ...(razorpayOrderId && { razorpayOrderId }),
          ...(razorpaySignature && { razorpaySignature }),
          createdAt: Timestamp.now(), 
          isReviewedByCustomer: true, // Review trigger is now based on connection expiry, not booking completion
        };

        const docRef = await addDoc(collection(db, "bookings"), newBookingData);
        if (currentUser?.uid) {
            await setDoc(doc(db, "users", currentUser.uid), { hasBooking: true }, { merge: true });
        }
        toast({ title: "Booking Confirmed!", description: `Your booking ID is ${newBookingId}.`});
        logUserActivity('newBooking', { bookingId: newBookingId, totalAmount: totalAmountForBooking, itemCount: resolvedServiceItems.length, paymentMethod: paymentMethod || "Unknown", services: resolvedServiceItems.map(s => ({id: s.serviceId, name: s.name, quantity: s.quantity})) }, currentUser?.uid, !currentUser ? getGuestId() : null);

        if (currentUser?.uid) { const userNotificationData: FirestoreNotification = { userId: currentUser.uid, title: "Booking Confirmed!", message: `Your booking ${newBookingData.bookingId} for ${newBookingData.services.map(s => s.name).join(', ')} on ${formatDateForDisplay(newBookingData.scheduledDate)} is ${newBookingData.status}.`, type: 'success', href: `/my-bookings`, read: false, createdAt: Timestamp.now() }; await addDoc(collection(db, "userNotifications"), userNotificationData); }
        try { const usersRef = collection(db, "users"); const adminQuery = query(usersRef, where("email", "==", ADMIN_EMAIL), limit(1)); const adminSnapshot = await getDocs(adminQuery); if (!adminSnapshot.empty) { const adminUserDoc = adminSnapshot.docs[0]; const adminUid = adminUserDoc.id; const adminNotificationData: FirestoreNotification = { userId: adminUid, title: "New Booking Received!", message: `ID: ${newBookingData.bookingId} by ${newBookingData.customerName}. Date: ${formatDateForDisplay(newBookingData.scheduledDate)} at ${newBookingData.scheduledTimeSlot}. Total: ₹${newBookingData.totalAmount.toFixed(2)}.`, type: 'admin_alert', href: `/admin/bookings/edit/${docRef.id}`, read: false, createdAt: Timestamp.now() }; await addDoc(collection(db, "userNotifications"), adminNotificationData); } else { console.warn(`Admin user with email ${ADMIN_EMAIL} not found. Cannot send admin notification.`); } } catch (adminNotificationError) { console.error("Error creating admin notification:", adminNotificationError); }

        if (appliedPromoCodeId && bookingDiscountAmount && bookingDiscountAmount > 0) { const promoDocRef = doc(db, "adminPromoCodes", appliedPromoCodeId); try { await runTransaction(db, async (transaction) => { const promoSnap = await transaction.get(promoDocRef); if (!promoSnap.exists()) throw new Error("Promo code not found!"); const currentUses = promoSnap.data().usesCount || 0; transaction.update(promoDocRef, { usesCount: currentUses + 1 }); }); } catch (error) { console.error("Error updating promo uses:", error); } }
        const servicesSummary = resolvedServiceItems.map(s => `${s.name} (x${s.quantity})`).join(', ');
        setBookingDetailsForDisplay({ 
            ...(newBookingData as FirestoreBooking), 
            id: docRef.id, 
            servicesSummary, 
            createdAt: newBookingData.createdAt.toDate().toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }), 
            scheduledDateDisplay: formatDateForDisplay(newBookingData.scheduledDate),
            latitude: newBookingData.latitude === undefined ? null : newBookingData.latitude, 
            longitude: newBookingData.longitude === undefined ? null : newBookingData.longitude, 
            visitingChargeDisplayed: displayedVisitingCharge, 
            discountCode: newBookingData.discountCode, 
            discountAmount: newBookingData.discountAmount, 
            appliedPlatformFees: newBookingData.appliedPlatformFees 
        });
        
        const marketingSettingsDoc = await getDoc(doc(db, "webSettings", "marketingConfiguration"));
        const marketingSettings = marketingSettingsDoc.exists() ? marketingSettingsDoc.data() as MarketingSettings : null;

        const transactionValue = parseFloat(totalAmountForBooking.toFixed(2)); const transactionId = newBookingId;
        if (typeof window !== 'undefined') {
            if (marketingSettings?.googleTagManagerId && window.dataLayer) {
                window.dataLayer.push({ ecommerce: null }); 
                window.dataLayer.push({ event: 'purchase', ecommerce: { transaction_id: transactionId, value: transactionValue, currency: 'INR', items: resolvedServiceItems.map(item => ({ item_id: item.serviceId, item_name: item.name, price: item.pricePerUnit, quantity: item.quantity, discount: item.discountedPricePerUnit !== undefined ? item.pricePerUnit - item.discountedPricePerUnit : 0 })) } }); 
            }
            const gtagId = marketingSettings?.googleAnalyticsId || marketingSettings?.googleAdsConversionId;
            if (gtagId && typeof window.gtag === 'function' && !marketingSettings?.googleTagManagerId) {
                if (gtagId.startsWith('AW-') && marketingSettings.googleAdsConversionLabel) {
                    window.gtag('event', 'conversion', { 'send_to': `${gtagId}/${marketingSettings.googleAdsConversionLabel}`, 'value': transactionValue, 'currency': 'INR', 'transaction_id': transactionId });
                } else if (gtagId.startsWith('G-')) {
                    window.gtag('event', 'purchase', { transaction_id: transactionId, value: transactionValue, currency: 'INR', items: resolvedServiceItems.map(item => ({ item_id: item.serviceId, item_name: item.name, price: item.pricePerUnit, quantity: item.quantity })) });
                }
            }
        }
        
        const marketingConfigDoc = await getDoc(doc(db, "webSettings", "marketingAutomation"));
        const marketingConfig = marketingConfigDoc.exists() ? marketingConfigDoc.data() as MarketingAutomationSettings : null;

        if (marketingConfig?.isWhatsAppEnabled && marketingConfig.whatsAppOnBookingConfirmed?.enabled && marketingConfig.whatsAppOnBookingConfirmed.templateName) {
            try {
                await fetch('/api/whatsapp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: customerPhone,
                        templateName: marketingConfig.whatsAppOnBookingConfirmed.templateName,
                        parameters: [newBookingId, servicesSummary, formatDateForDisplay(scheduledDateStored)],
                    }),
                });
            } catch (waError) {
                console.error("Failed to trigger WhatsApp message via API route:", waError);
            }
        }
        
        const emailFlowInput: BookingConfirmationEmailInput = {
          emailType: 'booking_confirmation', // Explicitly add the missing property
          bookingId: newBookingData.bookingId, customerName: newBookingData.customerName, customerEmail: newBookingData.customerEmail, customerPhone: newBookingData.customerPhone, addressLine1: newBookingData.addressLine1, addressLine2: newBookingData.addressLine2, city: newBookingData.city, state: newBookingData.state, pincode: newBookingData.pincode, latitude: newBookingData.latitude, longitude: newBookingData.longitude, scheduledDate: formatDateForDisplay(newBookingData.scheduledDate), scheduledTimeSlot: newBookingData.scheduledTimeSlot, services: newBookingData.services.map(s => ({ serviceId: s.serviceId, name: s.name, quantity: s.quantity, pricePerUnit: s.pricePerUnit, discountedPricePerUnit: s.discountedPricePerUnit })), subTotal: baseSubTotalForBooking, visitingCharge: displayedVisitingCharge, discountAmount: newBookingData.discountAmount, discountCode: newBookingData.discountCode, taxAmount: totalTaxForBooking, totalAmount: totalAmountForBooking, paymentMethod: newBookingData.paymentMethod, status: newBookingData.status, smtpHost: appConfig.smtpHost, smtpPort: appConfig.smtpPort, smtpUser: appConfig.smtpUser, smtpPass: appConfig.smtpPass, senderEmail: appConfig.senderEmail, appliedPlatformFees: newBookingData.appliedPlatformFees?.map(fee => ({ name: fee.name, amount: fee.calculatedFeeAmount + fee.taxAmountOnFee })),
        };
        try { const emailResult = await sendBookingConfirmationEmail(emailFlowInput); if (!emailResult.success) toast({ title: "Email Notification Issue", description: emailResult.message || "Could not send confirmation email(s). Please check admin console logs for details.", variant: "default", duration: 10000 }); } catch (emailError: any) { console.error("ThankYouPage: Exception calling sendBookingConfirmationEmail:", emailError); toast({ title: "Email System Error", description: `Failed to invoke email sending process: ${emailError.message || 'Unknown error'}. Check admin console logs.`, variant: "default", duration: 10000 }); }

        clearLocalStorageItems(currentUser?.uid, true);

      } catch (error) {
        console.error("Error creating booking:", error);
        toast({ title: "Booking Failed", description: (error as Error).message || "Could not complete booking.", variant: "destructive" });
      } finally {
        setIsLoadingPage(false);
      }
    };

    processPage();
  }, [isMounted, isLoadingAppSettings, isLoadingGlobalSettings, appConfig, globalSettings, toast, router, currentUser, firestoreUser, hideLoading, searchParams]);

  if (isLoadingPage || !isMounted || isLoadingAppSettings || (!bookingDetailsForDisplay && !isCancellationConfirmation && !unlockedProviderDetails)) {
    return (
      <div className="max-w-2xl mx-auto px-2 sm:px-0">
        <CheckoutStepper currentStepId="confirmation" />
        <Card className="shadow-lg"><CardHeader className="items-center text-center"><Loader2 className="h-12 w-12 text-primary animate-spin mb-4" /><CardTitle className="text-xl sm:text-2xl">Processing Your Request...</CardTitle><CardDescription className="text-sm sm:text-base">Please wait a moment.</CardDescription></CardHeader><CardContent className="space-y-4 min-h-[200px]"></CardContent></Card>
      </div>
    );
  }

  if (isCancellationConfirmation) {
    return (
      <div className="max-w-2xl mx-auto px-2 sm:px-0">
        <Card className="shadow-lg text-center">
          <CardHeader className="items-center px-4 sm:px-6">
            <Ban className="h-12 w-12 sm:h-16 sm:w-16 text-destructive mb-4" />
            <CardTitle className="text-2xl sm:text-3xl font-headline">Booking Cancelled</CardTitle>
            <CardDescription className="text-md sm:text-lg text-muted-foreground">
                Cancellation fee of ₹{cancellationFeePaidAmount.toFixed(2)} has been paid.
                Booking ID: <strong>{cancelledBookingId || 'N/A'}</strong> has been successfully cancelled.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 md:px-8 text-xs sm:text-sm">
             <p className="text-muted-foreground mt-1">If applicable, any refund will be processed to your original payment method within 5-7 business days.</p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 sm:pt-6">
            <Link href="/" passHref><Button size="lg" variant="outline" className="w-full sm:w-auto text-sm sm:text-base"><Home className="mr-2 h-4 w-4" /> Go to Home</Button></Link>
            <Link href="/my-bookings" passHref><Button size="lg" className="w-full sm:w-auto text-sm sm:text-base"><ListOrdered className="mr-2 h-4 w-4" /> View My Bookings</Button></Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (unlockedProviderDetails) {
    return (
      <div className="max-w-2xl mx-auto px-2 sm:px-0">
        <Card className="shadow-lg text-center">
          <CardHeader className="items-center px-4 sm:px-6">
            <ShieldCheck className="h-12 w-12 sm:h-16 sm:w-16 text-green-600 mb-4" />
            <CardTitle className="text-2xl sm:text-3xl font-headline">Connection Unlocked!</CardTitle>
            <CardDescription className="text-md sm:text-lg text-muted-foreground">You can now contact {unlockedProviderDetails.fullName}.</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 md:px-8 text-left space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
              <Avatar className="h-16 w-16">
                <AvatarImage src={unlockedProviderDetails.profilePhotoUrl || undefined} />
                <AvatarFallback>{unlockedProviderDetails.fullName?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-lg">{unlockedProviderDetails.fullName}</p>
                <p className="text-sm text-muted-foreground">{unlockedProviderDetails.workCategoryName}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-primary" />
                <a href={`tel:${unlockedProviderDetails.mobileNumber}`} className="font-medium hover:underline">{unlockedProviderDetails.mobileNumber}</a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <a href={`mailto:${unlockedProviderDetails.email}`} className="font-medium hover:underline">{unlockedProviderDetails.email}</a>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <a href={`tel:${unlockedProviderDetails.mobileNumber}`} className="flex-1">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <Phone className="mr-2 h-4 w-4" /> Call Now
                    </Button>
                </a>
                 <Button className="flex-1" onClick={() => handleWhatsAppClick(unlockedProviderDetails.mobileNumber)}>
                    <MessageSquare className="mr-2 h-4 w-4"/> WhatsApp
                 </Button>
             </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 sm:pt-6">
            <Link href={`/provider/${unlockedProviderDetails.id}`} passHref><Button size="lg" variant="outline" className="w-full sm:w-auto text-sm sm:text-base">Go to Provider's Page</Button></Link>
            <Link href="/" passHref><Button size="lg" className="w-full sm:w-auto text-sm sm:text-base"><Home className="mr-2 h-4 w-4" /> Go to Home</Button></Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (!bookingDetailsForDisplay) {
     return (
      <div className="max-w-2xl mx-auto px-2 sm:px-0">
        <CheckoutStepper currentStepId="confirmation" />
        <Card className="shadow-lg">
            <CardHeader className="items-center text-center">
                <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-accent mb-4" />
                <CardTitle className="text-2xl sm:text-3xl font-headline">Booking Processed</CardTitle>
                <CardDescription className="text-md sm:text-lg text-muted-foreground">
                    Your request has been processed.
                </CardDescription>
            </CardHeader>
             <CardContent className="px-4 sm:px-6 md:px-8 text-xs sm:text-sm">
                 <p className="text-center text-muted-foreground">Loading booking details or it might have been already confirmed.</p>
             </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 sm:pt-6">
                <Link href="/" passHref><Button size="lg" variant="outline" className="w-full sm:w-auto text-sm sm:text-base"><Home className="mr-2 h-4 w-4" /> Go to Home</Button></Link>
                <Link href="/my-bookings" passHref><Button size="lg" className="w-full sm:w-auto text-sm sm:text-base"><ListOrdered className="mr-2 h-4 w-4" /> Go to My Bookings</Button></Link>
            </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-0">
      <CheckoutStepper currentStepId="confirmation" />
      <Card className="shadow-lg text-center">
        <CardHeader className="items-center px-4 sm:px-6"><CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-accent mb-4" /><CardTitle className="text-2xl sm:text-3xl font-headline">Thank You for Your Booking!</CardTitle><CardDescription className="text-md sm:text-lg text-muted-foreground">Your service has been successfully scheduled.</CardDescription></CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 text-left px-4 sm:px-6 md:px-8 text-xs sm:text-sm">
          <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-center">Booking Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-2 sm:gap-y-3 p-3 sm:p-4 border rounded-md bg-secondary/30">
            <div><strong>Booking ID:</strong> {bookingDetailsForDisplay.bookingId}</div>
            <div className="sm:col-span-2"><strong>Service(s):</strong> {bookingDetailsForDisplay.servicesSummary}</div>
            <div><strong>Date:</strong> {bookingDetailsForDisplay.scheduledDateDisplay}</div>
            <div><strong>Time:</strong> {bookingDetailsForDisplay.scheduledTimeSlot}</div>
            <div className="sm:col-span-2"><strong>Address:</strong> {`${bookingDetailsForDisplay.addressLine1}${bookingDetailsForDisplay.addressLine2 ? ', ' + bookingDetailsForDisplay.addressLine2 : ''}, ${bookingDetailsForDisplay.city}, ${bookingDetailsForDisplay.state} - ${bookingDetailsForDisplay.pincode}`}</div>
          
            <div><strong>Items Total (Base):</strong> ₹{(bookingDetailsForDisplay.subTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            {bookingDetailsForDisplay.discountAmount != null && bookingDetailsForDisplay.discountAmount > 0 && (<div className="text-green-600"><strong className="flex items-center"><Tag className="h-3 w-3 mr-1" />Discount ({bookingDetailsForDisplay.discountCode || 'Applied'}):</strong><span>- ₹{bookingDetailsForDisplay.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>)}
            {bookingDetailsForDisplay.visitingChargeDisplayed != null && bookingDetailsForDisplay.visitingChargeDisplayed > 0 && (<div><strong>Visiting Charge (Base):</strong> <span className="text-primary">+ ₹{(bookingDetailsForDisplay.visitingCharge || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>)}
            {bookingDetailsForDisplay.appliedPlatformFees && bookingDetailsForDisplay.appliedPlatformFees.length > 0 && ( bookingDetailsForDisplay.appliedPlatformFees.map((fee, index) => ( <div key={index}> <strong className="flex items-center"><HandCoins className="h-3 w-3 mr-1"/>{fee.name}:</strong> <span className="text-primary"> + ₹{(fee.calculatedFeeAmount + fee.taxAmountOnFee).toFixed(2)}</span> </div> )) )}
            <div><strong>Total Tax:</strong> + ₹{bookingDetailsForDisplay.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div><strong>Total Amount:</strong> <span className="font-bold text-primary">₹{bookingDetailsForDisplay.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div><strong>Payment Method:</strong> {bookingDetailsForDisplay.paymentMethod}</div>
            <div><strong>Status:</strong> {bookingDetailsForDisplay.status}</div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground text-center mt-3 sm:mt-4 flex items-center justify-center"><Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2"/> An email confirmation has been sent to {bookingDetailsForDisplay.customerEmail}.</p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 sm:pt-6 w-full">
          <Link href="/" passHref className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm sm:text-base">
              <Home className="mr-2 h-4 w-4" /> Go to Home
            </Button>
          </Link>
          <Link href="/my-bookings" passHref className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base">
              <ListOrdered className="mr-2 h-4 w-4" /> Go to My Bookings
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
