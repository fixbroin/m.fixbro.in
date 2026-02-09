
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { ProviderApplication } from '@/types/firestore';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Camera, Image as ImageIcon, Trash2, Check, Lock } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
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
  workAreaCenter: z.object({
    lat: z.number({ required_error: "Please select a location on the map." }),
    lng: z.number({ required_error: "Please select a location on the map." }),
  }),
  signatureUrl: z.string().url("Invalid URL for signature.").optional().nullable(),
  termsConfirmation: z.boolean().refine(value => value === true, {
    message: "You must agree to the terms and conditions to proceed.",
  }),
});

type Step4FormData = z.infer<typeof step4Schema>;


interface Step4LocationBankProps {
  onSubmit: (data: Partial<ProviderApplication>) => void;
  onPrevious: () => void;
  initialData: Partial<ProviderApplication>;
  isSaving: boolean;
  userUid: string;
}

export default function Step4LocationBank({
  onSubmit,
  onPrevious,
  initialData,
  isSaving,
  userUid,
}: Step4LocationBankProps) {
  const { toast } = useToast();
  const { config: appConfig, isLoading: isLoadingAppSettings } = useApplicationConfig();
  
  const [currentSignaturePreview, setCurrentSignaturePreview] = useState<string | null>(null);
  const [selectedSignatureFile, setSelectedSignatureFile] = useState<File | null>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);
  const [signatureUploadProgress, setSignatureUploadProgress] = useState<number | null>(null);
  const [signatureStatusMessage, setSignatureStatusMessage] = useState("");
  const [isFormBusyForSignature, setIsFormBusyForSignature] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [canAgreeToTerms, setCanAgreeToTerms] = useState(false);
  const termsContentRef = useRef<HTMLDivElement>(null);


  const form = useForm<Step4FormData>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      workAreaCenter: initialData.workAreaCenter ? { lat: initialData.workAreaCenter.latitude, lng: initialData.workAreaCenter.longitude } : undefined,
      signatureUrl: initialData.signatureUrl || null,
      termsConfirmation: initialData.termsConfirmedAt ? true : false,
    },
  });

  useEffect(() => {
    const hasInitialLocation = initialData.workAreaCenter?.latitude && initialData.workAreaCenter?.longitude;
    form.reset({
      workAreaCenter: hasInitialLocation ? { lat: initialData.workAreaCenter!.latitude, lng: initialData.workAreaCenter!.longitude } : undefined,
      signatureUrl: initialData.signatureUrl || null,
      termsConfirmation: initialData.termsConfirmedAt ? true : false,
    });
    
    setCurrentSignaturePreview(initialData.signatureUrl || null);
    setSelectedSignatureFile(null);
    if (signatureFileInputRef.current) signatureFileInputRef.current.value = "";

    if (!hasInitialLocation) {
        setIsMapModalOpen(true);
    }
  }, [initialData, form]);

  const handleMapAddressSelect = useCallback((address: Partial<AddressFormData>) => {
    if (address.latitude && address.longitude) {
      form.setValue('workAreaCenter', { lat: address.latitude, lng: address.longitude });
      setIsMapModalOpen(false);
    } else {
      toast({ title: "Location Incomplete", description: "Could not get coordinates for the selected location.", variant: "destructive" });
    }
  }, [form, toast]);


  const handleFileUpload = async (
    file: File,
    storageFolder: string,
    fileTypeLabel: string,
    existingUrl: string | null | undefined,
    setUploadProgressFn: React.Dispatch<React.SetStateAction<number | null>>,
    setStatusMessageFn: React.Dispatch<React.SetStateAction<string>>
  ): Promise<{ url: string; fileName: string } | null> => {
    setStatusMessageFn(`Uploading ${fileTypeLabel}...`);
    setUploadProgressFn(0);
    try {
      if (existingUrl && isFirebaseStorageUrl(existingUrl)) {
        try { await deleteObject(storageRefStandard(storage, existingUrl)); }
        catch (e) { console.warn(`Old ${fileTypeLabel} image not deleted:`, e); }
      }
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const randomString = generateRandomHexString(8);
      const autoFileName = `${fileTypeLabel.toLowerCase().replace(/\s+/g, '_')}_${randomString}.${extension}`;
      const imagePath = `provider_documents/${userUid}/${storageFolder}/${autoFileName}`;
      const fileRef = storageRefStandard(storage, imagePath);

      const uploadTask = uploadBytesResumable(fileRef, file);
      const downloadURL = await new Promise<string>((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => setUploadProgressFn((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
          (error) => reject(error),
          async () => { try { resolve(await getDownloadURL(uploadTask.snapshot.ref)); } catch (e) { reject(e); } }
        );
      });
      setStatusMessageFn(`${fileTypeLabel} uploaded.`);
      return { url: downloadURL, fileName: file.name };
    } catch (uploadError) {
      toast({ title: `${fileTypeLabel} Upload Failed`, description: (uploadError as Error).message || `Could not upload ${fileTypeLabel}.`, variant: "destructive" });
      setStatusMessageFn(""); setUploadProgressFn(null);
      throw uploadError;
    }
  };

  const handleTermsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 1) {
        setCanAgreeToTerms(true);
    }
  };

  const handleAgreeToTerms = () => {
    form.setValue('termsConfirmation', true, { shouldValidate: true });
    setIsTermsModalOpen(false);
  };

  const handleSubmit = async (data: Step4FormData) => {
    if (!data.signatureUrl && !selectedSignatureFile) {
        form.setError("signatureUrl", { type: "manual", message: "Signature image is required. Please upload or provide a URL." });
        toast({title: "Signature Missing", description: "Signature image is required.", variant: "destructive"});
        return;
    }
     if (!data.termsConfirmation) {
        form.setError("termsConfirmation", { type: "manual", message: "You must agree to the terms and conditions." });
        toast({title: "Agreement Required", description: "Please agree to the Terms & Conditions.", variant: "destructive"});
        return;
    }

    setIsFormBusyForSignature(!!selectedSignatureFile);

    let finalSignatureUrl = data.signatureUrl || null;
    let finalSignatureFileName = initialData.signatureFileName || null;

    try {
      if (selectedSignatureFile) {
        const signatureUploadResult = await handleFileUpload(selectedSignatureFile, 'signature', 'Signature', initialData.signatureUrl, setSignatureUploadProgress, setSignatureStatusMessage);
        finalSignatureUrl = signatureUploadResult?.url || null;
        finalSignatureFileName = signatureUploadResult?.fileName || null;
      } else if (!data.signatureUrl && initialData.signatureUrl && isFirebaseStorageUrl(initialData.signatureUrl)) {
        setSignatureStatusMessage("Removing signature image...");
        try { await deleteObject(storageRefStandard(storage, initialData.signatureUrl)); finalSignatureUrl = null; finalSignatureFileName = null;}
        catch (e) { console.warn("Old signature image not deleted:", e); }
        setSignatureStatusMessage("Signature image removed.");
      }
      
      if (!finalSignatureUrl) { 
        toast({ title: "Signature Required", description: "Please upload your signature image to proceed.", variant: "destructive" });
        setIsFormBusyForSignature(false);
        return;
      }

      const applicationStepData: Partial<ProviderApplication> = {
        workAreaCenter: {
          latitude: data.workAreaCenter.lat,
          longitude: data.workAreaCenter.lng,
        },
        termsConfirmedAt: data.termsConfirmation ? Timestamp.now() : undefined,
        signatureUrl: finalSignatureUrl,
        signatureFileName: finalSignatureFileName,
      };
      onSubmit(applicationStepData);

    } catch (error) {
      console.error("Error in Step 4 submission:", error);
    } finally {
      setIsFormBusyForSignature(false);
      setSignatureStatusMessage("");
      setSignatureUploadProgress(null);
    }
  };

  const displaySignaturePreviewUrl = isValidImageSrc(currentSignaturePreview) ? currentSignaturePreview : null;
  const effectiveIsSaving = isSaving || isFormBusyForSignature;
  
  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardContent className="space-y-6">
          <Card className="p-4">
            <CardHeader className="p-0 pb-3"><CardTitle className="text-lg flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary"/>Work Area</CardTitle></CardHeader>
            <CardContent className="p-0 space-y-3">
              <FormItem>
                <FormLabel>Primary Work Location</FormLabel>
                <FormDescription>Click the button to set your location on the map. This helps customers find you.</FormDescription>
                <div className="p-2 border rounded-md bg-muted/50 text-sm">
                   {form.watch('workAreaCenter.lat') ? 
                    `Lat: ${form.watch('workAreaCenter.lat')?.toFixed(4)}, Lng: ${form.watch('workAreaCenter.lng')?.toFixed(4)}` 
                    : "No location set."
                   }
                </div>
                <Button type="button" variant="outline" onClick={() => setIsMapModalOpen(true)}>
                    <MapPin className="mr-2 h-4 w-4" /> {form.watch('workAreaCenter.lat') ? "Change Location" : "Set Location"}
                </Button>
                 <FormField control={form.control} name="workAreaCenter" render={({ field }) => <FormMessage />} />
              </FormItem>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader className="p-0 pb-3"><CardTitle className="text-lg flex items-center"><Lock className="mr-2 h-5 w-5 text-primary"/>Confirmation &amp; Signature</CardTitle></CardHeader>
            <CardContent className="p-0 space-y-4">
              <FormItem>
                <FormLabel className="flex items-center"><Camera className="mr-2 h-4 w-4 text-muted-foreground"/>Upload Signature <span className="text-destructive">*</span></FormLabel>
                {displaySignaturePreviewUrl ? (<div className="my-2 relative w-full aspect-[3/1] max-h-28 rounded-md overflow-hidden border bg-muted/30"><NextImage src={displaySignaturePreviewUrl} alt="Signature preview" fill className="object-contain p-1" unoptimized={displaySignaturePreviewUrl.startsWith('blob:')} sizes="(max-width: 640px) 100vw, 50vw"/></div>) : (<div className="my-2 flex items-center justify-center w-full aspect-[3/1] max-h-28 rounded-md border border-dashed bg-muted/30"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>)}
                <FormControl>
                    <Input 
                        type="file" 
                        accept="image/png, image/jpeg" 
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              if (file.size > 1 * 1024 * 1024) { toast({ title: "Signature File Too Large", description: "Signature image must be less than 1MB.", variant: "destructive" }); if (signatureFileInputRef.current) signatureFileInputRef.current.value = ""; setSelectedSignatureFile(null); setCurrentSignaturePreview(form.getValues('signatureUrl') || initialData.signatureUrl || null); return; }
                              setSelectedSignatureFile(file); setCurrentSignaturePreview(URL.createObjectURL(file));
                              form.setValue('signatureUrl', null, { shouldValidate: true }); 
                            } else { setSelectedSignatureFile(null); setCurrentSignaturePreview(form.getValues('signatureUrl') || initialData.signatureUrl || null); }
                        }} 
                        ref={signatureFileInputRef} 
                        className="file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" 
                        disabled={effectiveIsSaving}
                    />
                </FormControl>
                <FormDescription>Clear image of your signature. Max 1MB (PNG, JPG).</FormDescription>
                {signatureUploadProgress !== null && selectedSignatureFile && (<div className="mt-2"><Progress value={signatureUploadProgress} className="w-full h-1.5" />{signatureStatusMessage && <p className="text-xs text-muted-foreground mt-1">{signatureStatusMessage}</p>}</div>)}
                {(displaySignaturePreviewUrl || selectedSignatureFile) && (<Button type="button" variant="ghost" size="sm" onClick={() => { if (selectedSignatureFile && currentSignaturePreview?.startsWith('blob:')) URL.revokeObjectURL(currentSignaturePreview); setSelectedSignatureFile(null); setCurrentSignaturePreview(null); form.setValue('signatureUrl', null, {shouldValidate: true}); if (signatureFileInputRef.current) signatureFileInputRef.current.value = "";}} disabled={effectiveIsSaving} className="text-xs mt-1"><Trash2 className="h-3 w-3 mr-1 text-destructive"/>Remove Signature</Button>)}
                 <FormField control={form.control} name="signatureUrl" render={({ field }) => <FormMessage className="pt-1">{form.formState.errors.signatureUrl?.message}</FormMessage>} />
              </FormItem>

              <FormField
                control={form.control}
                name="termsConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-background/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={effectiveIsSaving}
                        id="termsConfirmationStep4"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel htmlFor="termsConfirmationStep4" className="cursor-pointer">
                        I agree to the <Button type="button" variant="link" className="p-0 h-auto" onClick={() => setIsTermsModalOpen(true)}>Terms & Conditions</Button>.
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onPrevious} disabled={effectiveIsSaving}>Previous</Button>
          <Button type="submit" disabled={effectiveIsSaving}>
            {effectiveIsSaving && !(isFormBusyForSignature) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isFormBusyForSignature && signatureStatusMessage ? signatureStatusMessage : effectiveIsSaving ? "Submitting..." : "Submit Application"}
          </Button>
        </CardFooter>
      </form>
    </Form>

    <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
        <DialogContent
          className="max-w-3xl w-[95vw] sm:w-[90vw] h-[80vh] p-0 flex flex-col"
          onPointerDownOutside={(e) => { const target = e.target as HTMLElement; if (target.closest('.pac-container')) e.preventDefault(); }}
        >
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Set Your Work Location</DialogTitle>
            <DialogDescription>
                Search for an address or click/drag the pin on the map. This will be your primary work location center.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow">
            {isLoadingAppSettings || !appConfig.googleMapsApiKey ? (
                <div className="flex items-center justify-center h-full bg-muted"><p>Map configuration loading or missing.</p></div>
            ) : (
                <MapAddressSelector 
                    apiKey={appConfig.googleMapsApiKey} 
                    onAddressSelect={handleMapAddressSelect} 
                    onClose={() => setIsMapModalOpen(false)} 
                    initialCenter={form.getValues('workAreaCenter.lat') ? form.getValues('workAreaCenter') : null}
                    serviceZones={[]}
                />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
        <DialogContent className="max-w-2xl w-[90vw] h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 border-b">
            <DialogTitle>Provider Terms & Conditions</DialogTitle>
            <DialogDescription>Please read and agree to continue.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow" onScroll={handleTermsScroll} ref={termsContentRef}>
            <div
              className="prose dark:prose-invert max-w-none p-6"
              dangerouslySetInnerHTML={{ __html: appConfig.providerTermsAndConditions || "No terms available." }}
            />
          </ScrollArea>
          <DialogFooter className="p-6 border-t">
            <Button onClick={handleAgreeToTerms} disabled={!canAgreeToTerms}>
              I have read and agree to the terms
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
