
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, ArrowLeft, Loader2, Phone, Mail, ShieldAlert, BadgeCheck, MapPin, Handshake, ShieldCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import type { ProviderApplication, FirestoreReview, ConnectionAccessOption, UserProviderConnection, FirestoreBooking } from '@/types/firestore';
import type { BreadcrumbItem } from '@/types/ui';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, setDoc, Timestamp, onSnapshot, getDoc, addDoc, updateDoc, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import ConnectionAccessDialog from './ConnectionAccessDialog';
import { useApplicationConfig } from '@/hooks/useApplicationConfig';
import { useLoading } from '@/contexts/LoadingContext';
import ExpiryCountdown from '@/components/shared/ExpiryCountdown';
import { cn } from '@/lib/utils';
import ComplaintForm from '@/components/forms/ComplaintForm';
import { getHaversineDistance } from '@/lib/locationUtils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { sendConnectionUnlockEmail, type ConnectionUnlockEmailInput } from '@/ai/flows/sendConnectionUnlockEmailFlow';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProviderDetailsClientProps {
  initialProviderData: ProviderApplication;
}

const ReviewCard: React.FC<{ review: FirestoreReview }> = ({ review }) => (
  <Card className="shadow-sm">
    <CardHeader>
      <div className="flex items-center space-x-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={review.userAvatarUrl || undefined} alt={review.userName} />
          <AvatarFallback>{review.userName ? review.userName[0].toUpperCase() : 'U'}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-sm font-semibold">{review.userName}</CardTitle>
          <div className="flex items-center mt-1">
            {[...Array(5)].map((_, i) => ( <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`}/> ))}
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
    </CardContent>
  </Card>
);

export default function ProviderDetailsClient({ initialProviderData }: ProviderDetailsClientProps) {
  const { toast } = useToast();
  const [provider] = useState(initialProviderData);
  const [reviews, setReviews] = useState<FirestoreReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  const { user, firestoreUser, triggerAuthRedirect } = useAuth();
  const router = useRouter();
  const { config: appConfig, isLoading: isLoadingConfig } = useApplicationConfig();
  const { settings: globalSettings } = useGlobalSettings();
  const { showLoading, hideLoading } = useLoading();

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [providerToConnect, setProviderToConnect] = useState<ProviderApplication | null>(null);

  const [connection, setConnection] = useState<UserProviderConnection | null>(null);
  const [isConnectionLoading, setIsConnectionLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);

  const { averageRating, totalReviews } = useMemo(() => {
    if (isLoadingReviews) {
      return {
        averageRating: initialProviderData.overallRating || 0,
        totalReviews: initialProviderData.totalJobsCompleted || 0,
      };
    }
    if (reviews.length === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    return {
      averageRating: totalRating / reviews.length,
      totalReviews: reviews.length,
    };
  }, [reviews, initialProviderData, isLoadingReviews]);


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

  useEffect(() => {
    if (!provider.id) {
      setIsLoadingReviews(false);
      return;
    }
    setIsLoadingReviews(true);
    
    const reviewsQuery = query(
      collection(db, "adminReviews"),
      where("providerId", "==", provider.id),
      where("status", "==", "Approved"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreReview));
      setReviews(fetchedReviews);
      setIsLoadingReviews(false);
    }, (error) => {
      console.error("Error fetching provider reviews:", error);
      toast({ title: "Error", description: "Could not load reviews for this provider.", variant: "destructive" });
      setIsLoadingReviews(false);
    });

    return () => unsubscribe();
  }, [provider.id, toast]);
  
  const breadcrumbItems: BreadcrumbItem[] = [
      { label: "Home", href: "/" },
      { label: "Providers", href: "/providers" },
      { label: provider.fullName || "Provider" }
  ];

  const isApproved = provider.status === 'approved';

  const showConnectButton = !isConnectionLoading && !connection;
  const showContactDetails = !isConnectionLoading && connection;
  const isLoadingConnection = isConnectionLoading;


  return (
    <>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Breadcrumbs items={breadcrumbItems} />
        
        <Card className="overflow-hidden shadow-lg">
          <CardHeader className="bg-muted/30 p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-md">
                <AvatarImage src={provider.profilePhotoUrl || undefined} alt={provider.fullName || 'Provider'} />
                <AvatarFallback className="text-4xl">{provider.fullName ? provider.fullName[0] : 'P'}</AvatarFallback>
              </Avatar>
              <div className="flex-grow text-center sm:text-left">
                <h1 className="text-3xl font-bold font-headline">{provider.fullName}</h1>
                <div className="flex items-center justify-center sm:justify-start gap-4 mt-1">
                  <p className="text-md text-primary font-semibold">{provider.skillLevelLabel || provider.workCategoryName}</p>
                  {isApproved && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="flex items-center gap-1 cursor-pointer" aria-label="KYC Verified Provider">
                            <ShieldCheck className="h-5 w-5 text-white fill-blue-500" />
                            <span className="text-sm font-medium text-blue-500">KYC Verified</span>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto text-sm p-2">
                        <p>KYC Verified Provider</p>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    <span className="font-semibold">{averageRating.toFixed(1)}</span>
                    {totalReviews > 0 && <span className="ml-1">({totalReviews} Reviews)</span>}
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
              <div className="w-full sm:w-auto flex-shrink-0">
                  {isLoadingConnection ? (
                    <Button size="lg" className="w-full sm:w-auto" disabled>
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </Button>
                  ) : showContactDetails ? (
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <a href={`tel:${provider.mobileNumber}`}>
                        <Button size="lg" variant="outline" className="w-full sm:w-auto">
                          <Phone className="mr-2 h-5 w-5" /> Call Now
                        </Button>
                      </a>
                      <Button size="lg" onClick={handleWhatsAppClick} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                         <MessageSquare className="mr-2 h-5 w-5"/> WhatsApp
                      </Button>
                    </div>
                  ) : (
                    <Button size="lg" className="w-full sm:w-auto" onClick={handleConnectClick} disabled={isLoadingConfig}>
                        {isLoadingConfig ? <Loader2 className="h-5 w-5 animate-spin"/> : <Handshake className="mr-2 h-5 w-5"/>}
                        Connect
                      </Button>
                  )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {provider.bio && provider.bio.trim() !== "" && (
              <section>
                <h2 className="text-xl font-semibold mb-3">About Me</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{provider.bio}</p>
              </section>
            )}
            
            <section>
              <Separator className="my-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-semibold mb-3">Experience</h2>
                  <p className="text-muted-foreground">{provider.experienceLevelLabel || 'Not specified'}</p>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-3">Languages Spoken</h2>
                  {provider.languagesSpokenLabels && provider.languagesSpokenLabels.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {provider.languagesSpokenLabels.map(lang => <Badge key={lang} variant="secondary">{lang}</Badge>)}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Not specified</p>
                  )}
                </div>
              </div>
            </section>
            
            {showContactDetails && (
                <section>
                    <Separator className="my-6" />
                    <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
                    <div className="space-y-2 text-muted-foreground text-sm">
                        <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-primary" /> 
                            <a href={`tel:${provider.mobileNumber}`} className="font-medium hover:underline">{provider.mobileNumber || 'N/A'}</a>
                        </p>
                        <p className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-primary" />
                            <a href={`mailto:${provider.email}`} className="font-medium hover:underline">{provider.email || 'N/A'}</a>
                        </p>
                    </div>
                    {connection?.accessType === 'lifetime' ? (
                       <p className="text-xs text-muted-foreground mt-3">Lifetime Access</p>
                    ) : connection?.expiresAt ? (
                      <ExpiryCountdown expiryDate={connection.expiresAt.toDate()} className="text-destructive mt-3"/>
                    ) : null}
                </section>
            )}

            {(isLoadingReviews || reviews.length > 0) && (
              <section>
                <Separator className="my-6" />
                <h2 className="text-xl font-semibold mb-4 flex items-center"><MessageSquare className="mr-2 h-5 w-5 text-primary"/>Customer Reviews</h2>
                {isLoadingReviews ? (
                  <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>
                ) : (
                  <ScrollArea className="h-96 pr-4">
                    <div className="space-y-4">
                      {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
                    </div>
                  </ScrollArea>
                )}
              </section>
            )}
            
            {!isLoadingConfig && appConfig.isComplaintSystemEnabled && (
             <section>
              <Separator className="my-6" />
                <div className="text-center">
                    <Button variant="outline" onClick={() => {
                        if (!user) {
                           triggerAuthRedirect(window.location.pathname);
                           return;
                        }
                        setIsComplaintModalOpen(true)
                    }}>
                        <ShieldAlert className="mr-2 h-4 w-4"/> File a Complaint
                    </Button>
                </div>
            </section>
            )}
          </CardContent>
        </Card>
      </div>
      {providerToConnect && (
          <ConnectionAccessDialog
            isOpen={isConnectModalOpen}
            onClose={() => setIsConnectModalOpen(false)}
            provider={providerToConnect}
            options={appConfig.connectionAccessOptions?.filter(opt => opt.enabled) || []}
        />
      )}
      {provider && user && (
        <ComplaintForm
          isOpen={isComplaintModalOpen}
          onClose={() => setIsComplaintModalOpen(false)}
          provider={provider}
          user={user}
        />
      )}
    </>
  );
}
