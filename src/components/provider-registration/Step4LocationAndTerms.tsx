
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { ProviderApplication } from '@/types/firestore';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Camera, Image as ImageIcon, Trash2, Check, Lock, FileText, CheckCircle } from "lucide-react";
import NextImage from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { storage } from '@/lib/firebase';
import { ref as storageRefStandard, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { Progress } from "@/components/ui/progress";
import { useEffect, useRef, useState, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { nanoid } from 'nanoid';
import { useApplicationConfig } from '@/hooks/useApplicationConfig';
import dynamic from 'next/dynamic';
import type { AddressFormData } from '@/components/forms/AddressForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from "@/components/ui/scroll-area";

const MapAddressSelector = dynamic(() => import('@/components/checkout/MapAddressSelector'), {
  loading: () => <div className="flex items-center justify-center h-64 bg-muted rounded-md"><Loader2 className="h-8 w-8 animate-spin" /></div>,
  ssr: false
});

const generateRandomHexString = (length: number) => Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
const isFirebaseStorageUrl = (url: string | null | undefined): boolean => !!url && typeof url === 'string' && url.includes("firebasestorage.googleapis.com");
const isValidImageSrc = (url: string | null | undefined): url is string => {
    if (!url || url.trim() === '') return false;
    return url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http:') || url.startsWith('https:') || url.startsWith('/');
};

const DEFAULT_MAP_CENTER = { lat: 12.9716, lng: 77.5946 }; // Bangalore

const step4Schema = z.object({
  signatureUrl: z.string().url("Invalid URL for signature.").optional().nullable(),
  signatureConfirmation: z.boolean().refine(value => value === true, {
    message: "You must confirm the validity of your signature.",
  }),
});

type Step4FormData = z.infer<typeof step4Schema>;

interface Step4LocationAndTermsProps {
  onSubmit: (data: Partial<ProviderApplication>) => void;
  onPrevious: () => void;
  initialData: Partial<ProviderApplication>;
  isSaving: boolean;
  userUid: string;
  onSaveStep: (stepData: Partial<ProviderApplication>) => Promise<void>;
}

export default function Step4LocationAndTerms({
  onSubmit,
  onPrevious,
  initialData,
  isSaving,
  userUid,
  onSaveStep,
}: Step4LocationAndTermsProps) {
  const { toast } = useToast();
  const { config: appConfig, isLoading: isLoadingAppSettings } = useApplicationConfig();
  
  const [currentSignaturePreview, setCurrentSignaturePreview] = useState<string | null>(null);
  const [selectedSignatureFile, setSelectedSignatureFile] = useState<File | null>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);
  const [signatureUploadProgress, setSignatureUploadProgress] = useState<number | null>(null);
  const [isFormBusy, setIsFormBusy] = useState(false);
  
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [canAgreeToTerms, setCanAgreeToTerms] = useState(false);
  const termsContentRef = useRef<HTMLDivElement>(null);
  
  const [isLocationSet, setIsLocationSet] = useState(false);
  const [areTermsAgreed, setAreTermsAgreed] = useState(false);

  const form = useForm<Step4FormData>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      signatureUrl: null,
      signatureConfirmation: false,
    },
  });

  useEffect(() => {
    const hasInitialLocation = !!initialData.workAreaCenter?.latitude;
    const hasAgreedToTerms = !!initialData.termsConfirmedAt;
    
    setIsLocationSet(hasInitialLocation);
    setAreTermsAgreed(hasAgreedToTerms);
    
    form.reset({
      signatureUrl: initialData.signatureUrl || null,
      signatureConfirmation: false, 
    });
    setCurrentSignaturePreview(initialData.signatureUrl || null);
    setSelectedSignatureFile(null);
    if (signatureFileInputRef.current) signatureFileInputRef.current.value = "";

    if (!hasInitialLocation) {
        setIsMapModalOpen(true);
    } else if (!hasAgreedToTerms) {
        setIsTermsModalOpen(true);
    }

  }, [initialData, form]);

  useEffect(() => {
    if (isTermsModalOpen) {
      setCanAgreeToTerms(false);
      const timer = setTimeout(() => {
        if (termsContentRef.current) {
          const contentDiv = termsContentRef.current;
          const viewport = contentDiv.parentElement;
          if (viewport) {
            // If scrollbar isn't visible, content is short. Enable agree button.
            if (viewport.scrollHeight <= viewport.clientHeight) {
              setCanAgreeToTerms(true);
            }
          }
        }
      }, 150); // Small delay to allow DOM to render
      return () => clearTimeout(timer);
    }
  }, [isTermsModalOpen]);


  const handleMapAddressSelect = async (address: Partial<AddressFormData>) => {
    if (!address.latitude || !address.longitude) {
        toast({ title: "Location not selected", variant: "destructive" });
        return;
    }
    try {
      await onSaveStep({ workAreaCenter: { latitude: address.latitude, longitude: address.longitude } });
      setIsLocationSet(true);
      setIsMapModalOpen(false);
      if (!areTermsAgreed) {
        setIsTermsModalOpen(true);
      }
    } catch (e) {
      toast({ title: "Error Saving Location", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleTermsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (canAgreeToTerms) return; // No need to re-check if already enabled
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Check if user has scrolled to the bottom (with a small tolerance)
    if (scrollHeight - scrollTop <= clientHeight + 5) {
      setCanAgreeToTerms(true);
    }
  };

  const handleAgreeToTerms = async () => {
    try {
      await onSaveStep({ termsConfirmedAt: Timestamp.now() });
      setAreTermsAgreed(true);
      setIsTermsModalOpen(false);
    } catch(e) {
      toast({ title: "Error", description: "Could not save your agreement.", variant: "destructive" });
    }
  };

  const handleFileUpload = async (
    file: File,
    storageFolder: string,
    existingUrl: string | null | undefined
  ): Promise<{ url: string; fileName: string }> => {
    setSignatureUploadProgress(0);
    try {
      if (existingUrl && isFirebaseStorageUrl(existingUrl)) {
        try { await deleteObject(storageRefStandard(storage, existingUrl)); }
        catch (e) { console.warn(`Error deleting old signature:`, e); }
      }
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const randomString = generateRandomHexString(8);
      const autoFileName = `signature_${randomString}.${extension}`;
      const imagePath = `provider_documents/${userUid}/${storageFolder}/${autoFileName}`;
      const fileRef = storageRefStandard(storage, imagePath);
      const uploadTask = uploadBytesResumable(fileRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => setSignatureUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
          reject,
          async () => {
            try { resolve({ url: await getDownloadURL(uploadTask.snapshot.ref), fileName: file.name }); } 
            catch (e) { reject(e); }
          }
        );
      });
    } catch (uploadError) {
      toast({ title: "Upload Failed", description: (uploadError as Error).message, variant: "destructive" });
      throw uploadError;
    }
  };

  const handleSubmit = async (data: Step4FormData) => {
    if (!selectedSignatureFile && !data.signatureUrl) {
      form.setError("signatureUrl", { message: "Signature image is required." });
      return;
    }
     if (!areTermsAgreed) {
        toast({ title: "Agreement Required", description: "Please agree to the Terms & Conditions.", variant: "destructive" });
        return;
    }

    setIsFormBusy(true);
    let finalSignatureUrl = data.signatureUrl || null;
    let finalSignatureFileName = initialData.signatureFileName || null;

    try {
      if (selectedSignatureFile) {
        const signatureUploadResult = await handleFileUpload(selectedSignatureFile, 'signature', initialData.signatureUrl);
        finalSignatureUrl = signatureUploadResult?.url || null;
        finalSignatureFileName = signatureUploadResult?.fileName || null;
      } else if (!data.signatureUrl && initialData.signatureUrl && isFirebaseStorageUrl(initialData.signatureUrl)) {
        try { await deleteObject(storageRefStandard(storage, initialData.signatureUrl)); finalSignatureUrl = null; finalSignatureFileName = null;}
        catch (e) { console.warn("Old signature image not deleted:", e); }
      }
      
      if (!finalSignatureUrl) { 
        toast({ title: "Signature Required", description: "Please upload your signature image to proceed.", variant: "destructive" });
        setIsFormBusy(false);
        return;
      }

      const applicationStepData: Partial<ProviderApplication> = {
        signatureUrl: finalSignatureUrl,
        signatureFileName: finalSignatureFileName,
      };
      onSubmit(applicationStepData);

    } catch (error) {
      console.error("Error in Step 4 submission:", error);
      toast({ title: "Submission Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsFormBusy(false);
      setSignatureUploadProgress(null);
    }
  };

  const displaySignaturePreviewUrl = isValidImageSrc(currentSignaturePreview) ? currentSignaturePreview : null;
  const effectiveIsSaving = isSaving || isFormBusy;
  
  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardContent className="space-y-6">
          
          <Card className="p-4">
              <CardHeader className="p-0 pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                      <span>Work Location</span>
                      {isLocationSet && <CheckCircle className="h-5 w-5 text-green-500" />}
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-3">
                  <p className="text-sm text-muted-foreground">This is your primary location. It helps customers find you.</p>
                  <div className="p-2 border rounded-md bg-muted/50 text-sm">
                      {isLocationSet ? `Lat: ${initialData.workAreaCenter?.latitude.toFixed(4)}, Lng: ${initialData.workAreaCenter?.longitude.toFixed(4)}` : "Not Set"}
                  </div>
                  <Button type="button" variant="outline" onClick={() => setIsMapModalOpen(true)}>
                      <MapPin className="mr-2 h-4 w-4" /> {isLocationSet ? "Change Location" : "Set Location"}
                  </Button>
              </CardContent>
          </Card>

          <Card className="p-4">
              <CardHeader className="p-0 pb-3"><CardTitle className="text-lg flex items-center justify-between"><span>Digital Signature</span>{initialData.signatureUrl && <CheckCircle className="h-5 w-5 text-green-500" />}</CardTitle></CardHeader>
              <CardContent className="p-0 space-y-4">
                  <FormItem>
                      <FormLabel>Upload Signature Image <span className="text-destructive">*</span></FormLabel>
                      {displaySignaturePreviewUrl ? (<div className="my-2 relative w-full aspect-[3/1] max-h-28 rounded-md overflow-hidden border bg-muted/30"><NextImage src={displaySignaturePreviewUrl} alt="Signature preview" fill className="object-contain p-1" unoptimized={displaySignaturePreviewUrl.startsWith('blob:')} sizes="(max-width: 640px) 100vw, 50vw"/></div>) : (<div className="my-2 flex items-center justify-center w-full aspect-[3/1] max-h-28 rounded-md border border-dashed bg-muted/30"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>)}
                      <FormControl>
                        <Input 
                            type="file" 
                            accept="image/png, image/jpeg" 
                            onChange={(e) => { if (e.target.files?.[0]) { setSelectedSignatureFile(e.target.files[0]); setCurrentSignaturePreview(URL.createObjectURL(e.target.files[0])); form.setValue('signatureUrl', null); } }} 
                            ref={signatureFileInputRef} 
                            disabled={effectiveIsSaving} 
                        />
                      </FormControl>
                      <FormDescription>Clear image of your signature. Max 1MB (PNG, JPG).</FormDescription>
                      {signatureUploadProgress !== null && (<Progress value={signatureUploadProgress} className="h-1.5 mt-2" />)}
                      {(displaySignaturePreviewUrl || selectedSignatureFile) && (<Button type="button" variant="ghost" size="sm" onClick={() => { setCurrentSignaturePreview(null); setSelectedSignatureFile(null); form.setValue('signatureUrl', null); if(signatureFileInputRef.current) signatureFileInputRef.current.value = ""; }} disabled={effectiveIsSaving} className="text-xs mt-1"><Trash2 className="h-3 w-3 mr-1 text-destructive"/>Remove Signature</Button>)}
                       <FormField control={form.control} name="signatureUrl" render={({ field }) => <FormMessage className="pt-1">{form.formState.errors.signatureUrl?.message}</FormMessage>} />
                  </FormItem>
                   <FormField control={form.control} name="signatureConfirmation" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={effectiveIsSaving} id="signatureConfirmation" /></FormControl><div className="space-y-1 leading-none"><FormLabel htmlFor="signatureConfirmation" className="cursor-pointer">I declare that the uploaded image is my own and is valid as my digital signature.</FormLabel><FormMessage /></div></FormItem>)}/>
              </CardContent>
          </Card>

          <Card className="p-4">
              <CardHeader className="p-0 pb-3"><CardTitle className="text-lg flex items-center justify-between"><span>Terms & Conditions</span>{areTermsAgreed && <CheckCircle className="h-5 w-5 text-green-500" />}</CardTitle></CardHeader>
              <CardContent className="p-0">
                  <p className="text-sm text-muted-foreground">You must read and agree to the provider terms and conditions to submit your application.</p>
                  <Button type="button" variant="secondary" onClick={() => setIsTermsModalOpen(true)} className="mt-3">
                      {areTermsAgreed ? "View Agreed Terms" : "View & Agree to Terms"}
                  </Button>
              </CardContent>
          </Card>

        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onPrevious} disabled={effectiveIsSaving}>Previous</Button>
          <Button type="submit" disabled={effectiveIsSaving || !isLocationSet || !areTermsAgreed}>
            {effectiveIsSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Application
          </Button>
        </CardFooter>
      </form>
    </Form>

    <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
        <DialogContent
          className="max-w-3xl w-[90vw] h-[80vh] p-0 flex flex-col"
          onPointerDownOutside={(e) => { const target = e.target as HTMLElement; if (target.closest('.pac-container')) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { e.preventDefault(); /* Prevent closing */ }}
        >
          <DialogHeader className="p-4 border-b"><DialogTitle>Set Your Work Location</DialogTitle><DialogDescription>Search for an address or click/drag the pin on the map. This will be your primary work location center.</DialogDescription></DialogHeader>
          <div className="flex-grow">{isLoadingAppSettings || !appConfig.googleMapsApiKey ? (<div className="flex items-center justify-center h-full bg-muted"><p>Map configuration loading...</p></div>) : (<MapAddressSelector apiKey={appConfig.googleMapsApiKey} onAddressSelect={handleMapAddressSelect} onClose={() => setIsMapModalOpen(false)} initialCenter={initialData.workAreaCenter ? {lat: initialData.workAreaCenter.latitude, lng: initialData.workAreaCenter.longitude} : null} serviceZones={[]} />)}</div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
        <DialogContent className="max-w-2xl w-[90vw] h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 border-b"><DialogTitle>Provider Terms &amp; Conditions</DialogTitle><DialogDescription>Please scroll to the bottom and agree to continue.</DialogDescription></DialogHeader>
          <ScrollArea className="flex-grow" onScroll={handleTermsScroll}>
            <div
              ref={termsContentRef}
              className="prose dark:prose-invert max-w-none p-6"
              dangerouslySetInnerHTML={{ __html: appConfig.providerTermsAndConditions || "No terms available." }}
            />
          </ScrollArea>
          <DialogFooter className="p-6 border-t">
            <Button onClick={handleAgreeToTerms} disabled={!canAgreeToTerms || isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} I Agree &amp; Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    