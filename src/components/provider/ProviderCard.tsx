
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Info, MessageSquare, MapPin, Loader2, Phone, Handshake, ShieldCheck } from 'lucide-react';
import type { ProviderApplication, ConnectionAccessOption, UserProviderConnection, FirestoreBooking } from '@/types/firestore';
import { useLoading } from '@/contexts/LoadingContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useState, useCallback, useEffect } from 'react';
import { useApplicationConfig } from '@/hooks/useApplicationConfig';
import ConnectionAccessDialog from './ConnectionAccessDialog'; 
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, Timestamp, onSnapshot, getDoc, collection, addDoc, updateDoc, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getHaversineDistance } from '@/lib/locationUtils';
import ExpiryCountdown from '@/components/shared/ExpiryCountdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { sendConnectionUnlockEmail, type ConnectionUnlockEmailInput } from '@/ai/flows/sendConnectionUnlockEmailFlow';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';

interface ProviderCardProps {
  provider: ProviderApplication;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ provider }) => {
  const { showLoading, hideLoading } = useLoading();
  const router = useRouter();
  const { user, firestoreUser, triggerAuthRedirect } = useAuth();
  const { config: appConfig, isLoading: isLoadingConfig } = useApplicationConfig();
  const { settings: globalSettings } = useGlobalSettings();
  const { toast } = useToast();

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [providerToConnect, setProviderToConnect] = useState<ProviderApplication | null>(null);

  const [connection, setConnection] = useState<UserProviderConnection | null>(null);
  const [isConnectionLoading, setIsConnectionLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (provider.workAreaCenter?.latitude && provider.workAreaCenter?.longitude && firestoreUser?.latitude && firestoreUser?.longitude) {
      const dist = getHaversineDistance(
        firestoreUser.latitude,
        firestoreUser.longitude,
        provider.workAreaCenter.latitude,
        provider.workAreaCenter.longitude
      );
      setDistance(dist);
    } else {
      setDistance(null);
    }
  }, [provider.workAreaCenter, firestoreUser]);

  useEffect(() => {
    if (!user?.uid || !provider.id) {
      setIsConnectionLoading(false);
      return;
    }
    setIsConnectionLoading(true);
    const connectionDocRef = doc(db, "userProviderConnections", `${user.uid}_${provider.id}`);

    const unsubscribe = onSnapshot(connectionDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const connectionData = docSnap.data() as UserProviderConnection;
        const isExpired = connectionData.expiresAt ? connectionData.expiresAt.toDate() < new Date() : false;
        
        if (!isExpired) {
          setConnection(connectionData);
        } else {
          setConnection(null);
          // Review trigger on expiry
          if (!connectionData.reviewRequested) {
            try {
              // Check if another review is already pending for this user
              const pendingReviewQuery = query(
                collection(db, "bookings"),
                where("userId", "==", user.uid),
                where("isReviewedByCustomer", "==", false),
                limit(1)
              );
              const pendingReviewSnap = await getDocs(pendingReviewQuery);

              if (pendingReviewSnap.empty) { // Only proceed if no other review is pending
                const reviewBooking: Omit<FirestoreBooking, 'id'> = {
                  bookingId: `REVIEW-${provider.id.substring(0, 5)}-${user.uid.substring(0, 5)}`,
                  userId: user.uid,
                  providerId: provider.id,
                  customerName: firestoreUser?.displayName || user.displayName || 'Valued Customer',
                  customerEmail: firestoreUser?.email || user.email || '',
                  customerPhone: firestoreUser?.mobileNumber || user.phoneNumber || '',
                  addressLine1: 'N/A', city: 'N/A', state: 'N/A', pincode: 'N/A',
                  scheduledDate: Timestamp.now().toDate().toISOString().split('T')[0],
                  scheduledTimeSlot: 'N/A',
                  services: [{
                    serviceId: 'provider_review',
                    name: `Interaction with ${provider.fullName}`,
                    quantity: 1,
                    pricePerUnit: 0,
                  }],
                  subTotal: 0,
                  taxAmount: 0,
                  totalAmount: 0,
                  paymentMethod: 'N/A',
                  status: 'Completed',
                  isReviewedByCustomer: false, // This is what triggers the popup
                  createdAt: Timestamp.now(),
                };

                await addDoc(collection(db, "bookings"), reviewBooking);
                await updateDoc(doc(db, "userProviderConnections", `${user.uid}_${provider.id}`), { reviewRequested: true });
                
                console.log(`Review request created for expired connection with provider ${provider.id}`);
              } else {
                console.log("Skipping review request creation; another one is already pending.");
              }

            } catch (error) {
              console.error("Error creating provider review request:", error);
            }
          }
        }
      } else {
        setConnection(null);
      }
      setIsConnectionLoading(false);
    });

    return () => unsubscribe();
  }, [user, firestoreUser, provider.id, provider.fullName]);


  const handleFreeAccessUnlock = async (providerForUnlock: ProviderApplication) => {
    if (!user || !providerForUnlock.id) return;
    showLoading();
    try {
      const expiryMinutes = appConfig?.freeAccessDurationMinutes || 30;
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

      const connectionData: UserProviderConnection = {
        userId: user.uid,
        providerId: providerForUnlock.id,
        accessType: 'free',
        grantedAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expiresAt),
      };

      await setDoc(doc(db, "userProviderConnections", `${user.uid}_${providerForUnlock.id}`), connectionData);
      
      toast({
        title: "Free Access Granted!",
        description: `You have unlocked ${providerForUnlock.fullName}'s contact details for ${expiryMinutes} minutes.`,
        className: "bg-green-100 text-green-700 border-green-300"
      });

      const emailInput: ConnectionUnlockEmailInput = {
        userName: user.displayName || "Valued User",
        userEmail: firestoreUser?.email || user.email || undefined,
        userMobile: firestoreUser?.mobileNumber || user.phoneNumber || "N/A",
        providerName: providerForUnlock.fullName || "A Provider",
        providerEmail: providerForUnlock.email || "",
        providerCategory: providerForUnlock.workCategoryName || "General Services",
        transactionId: "FREE_ACCESS",
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
        else console.log("Free connection unlock emails sent successfully.");
      });

      router.push(`/provider/${providerForUnlock.id}`);
    } catch (error) {
      console.error("Error granting free access:", error);
      toast({ title: "Error", description: "Could not grant free access.", variant: "destructive" });
    } finally {
      hideLoading();
    }
  };

  const handleConnectClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation(); 

    if (!user) {
        triggerAuthRedirect(`/provider/${provider.id}?connect=true`);
        return;
    }
    if (isLoadingConfig) return;

    const enabledPaidOptions = appConfig.connectionAccessOptions?.filter(opt => opt.enabled) || [];

    if (enabledPaidOptions.length > 0) {
      setProviderToConnect(provider);
      setIsConnectModalOpen(true);
    } else if (appConfig.isFreeAccessFallbackEnabled) {
      handleFreeAccessUnlock(provider);
    } else {
      toast({
        title: "Connection Unavailable",
        description: "This feature is not currently enabled. Please check back later.",
        variant: "default",
      });
    }
  };
  
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (connection && provider.mobileNumber) {
        let phoneNumber = provider.mobileNumber.replace(/\D/g, ''); // Remove all non-digits
        if (phoneNumber.length === 10) {
            phoneNumber = '91' + phoneNumber;
        } else if (phoneNumber.length === 11 && phoneNumber.startsWith('0')) {
            phoneNumber = '91' + phoneNumber.substring(1);
        }
        const text = encodeURIComponent(`Hi, I connected with you on Fixbro and would like to inquire about your services.`);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${text}`;
        window.open(whatsappUrl, '_blank');
    }
  };

  const handleAboutClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    showLoading();
    router.push(`/provider/${provider.id}`);
  };

  const overallRating = provider.overallRating || 4.5;
  const totalReviews = provider.totalJobsCompleted || 0;
  const isApproved = provider.status === 'approved';


  return (
    <>
      <Card className="relative flex flex-col h-full overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
        {isApproved && (
          <Popover>
            <PopoverTrigger asChild>
              <div className="absolute top-2 right-2 z-10 cursor-pointer">
                <ShieldCheck className="h-6 w-6 text-white fill-blue-500" />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto text-sm p-2">
              <p>KYC Verified Provider</p>
            </PopoverContent>
          </Popover>
        )}
        <CardHeader className="flex-row items-center gap-4 p-4">
          <Avatar className="h-16 w-16 border-2 border-primary/50">
            <AvatarImage src={provider.profilePhotoUrl || undefined} alt={provider.fullName || 'Provider'} />
            <AvatarFallback className="text-xl">{provider.fullName ? provider.fullName[0] : 'P'}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold">{provider.fullName}</CardTitle>
            </div>
            <CardDescription className="text-xs">{provider.skillLevelLabel || provider.workCategoryName}</CardDescription>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
               <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span className="font-semibold">{overallRating.toFixed(1)}</span>
                  {totalReviews > 0 && <span>({totalReviews} Reviews)</span>}
               </div>
               {distance !== null && (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <div className="flex items-center gap-1 text-primary font-medium">
                    <MapPin className="h-4 w-4" />
                    <span>{distance.toFixed(1)} km away</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-2">
                {provider.bio || `Experienced ${provider.skillLevelLabel} specializing in ${provider.workCategoryName} services.`}
            </p>
        </CardContent>
        <CardFooter className="p-3 bg-muted/50 flex gap-2">
          <Link href={`/provider/${provider.id}`} onClick={handleAboutClick} className="flex-1" passHref>
            <Button variant="outline" className="w-full">
              <Info className="mr-2 h-4 w-4" /> About
            </Button>
          </Link>
          {isConnectionLoading ? (
             <Button className="flex-1" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Loading...
             </Button>
          ) : connection ? (
             <div className="flex-1 flex gap-2">
                <a href={`tel:${provider.mobileNumber}`} className="flex-1">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <Phone className="mr-2 h-4 w-4" /> Call
                    </Button>
                </a>
                 <Button className="flex-1" onClick={handleWhatsAppClick}>
                    <MessageSquare className="mr-2 h-4 w-4"/> Chat
                 </Button>
             </div>
          ) : (
             <Button className="flex-1" onClick={handleConnectClick} disabled={isLoadingConfig}>
                {isLoadingConfig ? <Loader2 className="h-4 w-4 animate-spin"/> : <Handshake className="mr-2 h-4 w-4"/>}
                Connect
              </Button>
          )}
        </CardFooter>
      </Card>

      {providerToConnect && (
        <ConnectionAccessDialog
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
          provider={providerToConnect}
          options={appConfig.connectionAccessOptions?.filter(opt => opt.enabled) || []}
        />
      )}
    </>
  );
};

export default ProviderCard;
