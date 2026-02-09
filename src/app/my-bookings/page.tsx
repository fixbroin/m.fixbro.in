
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { User, Phone, MessageCircle, Info, Loader2, PackageSearch, ArrowLeft, Star, Clock, Users } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import type { UserProviderConnection, ProviderApplication } from '@/types/firestore';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useLoading } from '@/contexts/LoadingContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from 'next/image';
import ExpiryCountdown from '@/components/shared/ExpiryCountdown';

interface EnrichedConnection extends UserProviderConnection {
  providerDetails?: ProviderApplication;
}

const ProviderContactCard: React.FC<{ connection: EnrichedConnection }> = ({ connection }) => {
  const { showLoading } = useLoading();
  const router = useRouter();
  const provider = connection.providerDetails;

  if (!provider) {
    return (
      <Card className="shadow-sm animate-pulse">
        <CardHeader><div className="h-6 w-1/2 bg-muted rounded"></div></CardHeader>
        <CardContent><div className="h-4 w-full bg-muted rounded"></div></CardContent>
      </Card>
    );
  }

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    showLoading();
    router.push(href);
  };
  
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (provider.mobileNumber) {
      let phoneNumber = provider.mobileNumber.replace(/\D/g, '');
      if (phoneNumber.length === 10) phoneNumber = '91' + phoneNumber;
      else if (phoneNumber.length === 11 && phoneNumber.startsWith('0')) {
        phoneNumber = '91' + phoneNumber.substring(1);
      }
      const text = encodeURIComponent(`Hi, I connected with you on Fixbro.`);
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${text}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex-row items-center gap-4 p-4">
        <Avatar className="h-16 w-16 border-2 border-primary/50">
          <AvatarImage src={provider.profilePhotoUrl || undefined} alt={provider.fullName || 'Provider'} />
          <AvatarFallback className="text-xl">{provider.fullName ? provider.fullName[0] : 'P'}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <CardTitle className="text-lg font-bold">{provider.fullName}</CardTitle>
          <CardDescription className="text-xs">{provider.skillLevelLabel || provider.workCategoryName}</CardDescription>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
             <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="font-semibold">{provider.overallRating?.toFixed(1) || '4.5'}</span>
                {(provider.totalJobsCompleted || 0) > 0 && <span>({provider.totalJobsCompleted || 0} reviews)</span>}
             </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
         <p className="text-sm text-muted-foreground line-clamp-2">
            {provider.bio || `Experienced ${provider.skillLevelLabel} specializing in ${provider.workCategoryName} services.`}
        </p>
         <div className="mt-3 text-xs text-center font-medium p-1 bg-blue-100/50 text-blue-700 rounded-md flex items-center justify-center gap-1.5">
            {connection.accessType === 'lifetime' ? (
                <><Clock className="h-3 w-3"/> Lifetime Access</>
            ) : connection.expiresAt ? (
                <ExpiryCountdown expiryDate={connection.expiresAt.toDate()} className="text-blue-700"/>
            ) : (
                <><Clock className="h-3 w-3"/> Access time not set</>
            )}
         </div>
      </CardContent>
      <CardFooter className="p-3 bg-muted/50 flex gap-2">
         <Link href={`/provider/${provider.id}`} onClick={(e) => handleNav(e, `/provider/${provider.id}`)} className="flex-1" passHref>
           <Button variant="outline" className="w-full"><Info className="mr-2 h-4 w-4" /> About</Button>
         </Link>
         <a href={`tel:${provider.mobileNumber}`} className="flex-1">
             <Button className="w-full bg-green-600 hover:bg-green-700">
                <Phone className="mr-2 h-4 w-4" /> Call
             </Button>
         </a>
         <Button className="flex-1" onClick={handleWhatsAppClick}>
            <MessageCircle className="mr-2 h-4 w-4"/> Chat
         </Button>
      </CardFooter>
    </Card>
  );
};


function MyContactsPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<EnrichedConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);

  useEffect(() => {
    if (!user || authIsLoading) {
      if (!authIsLoading && !user) setIsLoadingConnections(false);
      return;
    }

    setIsLoadingConnections(true);
    const connectionsRef = collection(db, "userProviderConnections");
    const q = query(
      connectionsRef,
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const now = new Date();
      const fetchedConnections = querySnapshot.docs
        .map(docSnap => ({ ...docSnap.data(), id: docSnap.id } as UserProviderConnection))
        .filter(conn => !conn.expiresAt || conn.expiresAt.toDate() > now);

      const enrichedPromises = fetchedConnections.map(async (conn): Promise<EnrichedConnection> => {
        if (conn.providerId) {
          try {
            const providerDocRef = doc(db, "providerApplications", conn.providerId);
            const providerDocSnap = await getDoc(providerDocRef);
            if (providerDocSnap.exists()) {
              return { ...conn, providerDetails: { id: providerDocSnap.id, ...providerDocSnap.data() } as ProviderApplication };
            }
          } catch (error) {
            console.error(`Failed to fetch provider details for ID ${conn.providerId}`, error);
          }
        }
        return conn;
      });
      
      const resolvedConnections = await Promise.all(enrichedPromises);
      resolvedConnections.sort((a, b) => (b.grantedAt?.toMillis() || 0) - (a.grantedAt?.toMillis() || 0));
      setConnections(resolvedConnections);
      setIsLoadingConnections(false);

    }, (error) => {
      console.error("Error fetching connections:", error);
      toast({ title: "Error", description: "Could not fetch your connections.", variant: "destructive" });
      setIsLoadingConnections(false);
    });

    return () => unsubscribe();
  }, [user, authIsLoading, toast]);


  if (authIsLoading || isLoadingConnections) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="mt-2 text-muted-foreground">Loading your contacts...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-headline font-semibold text-foreground">
          My Contacts
        </h1>
        <Link href="/" passHref>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Button>
        </Link>
      </div>

      {connections.length === 0 ? (
        <div className="text-center py-12">
          <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Active Contacts</h2>
          <p className="text-muted-foreground mb-6">You haven't connected with any providers yet.</p>
          <Link href="/categories" passHref><Button>Explore Services</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map((connection) => (
            <ProviderContactCard key={connection.id} connection={connection} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyBookingsPage() {
    return (
        <ProtectedRoute>
            <MyContactsPage />
        </ProtectedRoute>
    )
}
