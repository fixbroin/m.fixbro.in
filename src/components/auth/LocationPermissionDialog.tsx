
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { AddressFormData } from '@/components/forms/AddressForm';
import { useApplicationConfig } from '@/hooks/useApplicationConfig';
import dynamic from 'next/dynamic';
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

const MapAddressSelector = dynamic(() => import('@/components/checkout/MapAddressSelector'), {
  loading: () => <div className="flex items-center justify-center h-64 bg-muted rounded-md"><Loader2 className="h-8 w-8 animate-spin" /></div>,
  ssr: false,
});

interface LocationPermissionDialogProps {
  isOpen: boolean;
  onLocationSet: () => void;
  initialCenter: { lat: number, lng: number } | null;
}

export default function LocationPermissionDialog({ isOpen, onLocationSet, initialCenter }: LocationPermissionDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const { config: appConfig, isLoading: isLoadingAppSettings } = useApplicationConfig();
    const [isSaving, setIsSaving] = useState(false);

    const handleLocationSelectedAndSave = async (address: Partial<AddressFormData>) => {
        if (!user || !address.latitude || !address.longitude) {
            toast({ title: "Location not selected", description: "Please select a location on the map.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                latitude: address.latitude,
                longitude: address.longitude,
            });
            toast({ title: "Location Saved!", description: "Your location has been updated." });
            // onLocationSet will be called by MapAddressSelector's onClose prop after this promise resolves.
        } catch (error) {
            console.error("Error saving location:", error);
            toast({ title: "Error", description: "Could not save your location.", variant: "destructive" });
            throw error; // Re-throw to prevent the dialog from closing on error
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onLocationSet(); }}>
            <DialogContent className="max-w-3xl w-[90vw] h-[80vh] p-0 flex flex-col" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Set Your Location</DialogTitle>
                    <DialogDescription>
                        To find services near you, please search for an address or click the pin on the map.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow">
                     {!isLoadingAppSettings && appConfig.googleMapsApiKey ? (
                        <MapAddressSelector 
                            apiKey={appConfig.googleMapsApiKey} 
                            onAddressSelect={handleLocationSelectedAndSave} 
                            onClose={onLocationSet} 
                            initialCenter={initialCenter}
                            serviceZones={[]}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-muted"><p>Map is loading or not configured.</p></div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
