
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Handshake, AlertTriangle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { doc, setDoc, Timestamp } from "firebase/firestore";
import type { AppSettings, ConnectionAccessOption } from '@/types/firestore';
import { useApplicationConfig } from '@/hooks/useApplicationConfig';
import { Separator } from "@/components/ui/separator";

const APP_CONFIG_COLLECTION = "webSettings";
const APP_CONFIG_DOC_ID = "applicationConfig";

const connectionAccessOptionSchema = z.object({
    id: z.enum(['oneTime', 'sevenDays', 'thirtyDays', 'lifetime']),
    label: z.string(),
    price: z.coerce.number().min(0, "Price must be non-negative."),
    durationDays: z.coerce.number().optional().nullable(),
    enabled: z.boolean(),
});

const connectionAccessSettingsSchema = z.object({
  connectionAccessOptions: z.array(connectionAccessOptionSchema),
  isFreeAccessFallbackEnabled: z.boolean().default(false),
  freeAccessDurationMinutes: z.coerce.number().min(1, "Duration must be at least 1 minute."),
  disclaimerEmailContent: z.string().min(20, "Disclaimer content is too short."),
});

type ConnectionAccessFormData = z.infer<typeof connectionAccessSettingsSchema>;

export default function ConnectionAccessSettingsTab() {
  const { toast } = useToast();
  const { config, isLoading, error } = useApplicationConfig();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ConnectionAccessFormData>({
    resolver: zodResolver(connectionAccessSettingsSchema),
    defaultValues: {
      connectionAccessOptions: config.connectionAccessOptions,
      isFreeAccessFallbackEnabled: config.isFreeAccessFallbackEnabled,
      freeAccessDurationMinutes: config.freeAccessDurationMinutes,
      disclaimerEmailContent: config.disclaimerEmailContent,
    },
  });

  const { fields } = useFieldArray({ control: form.control, name: "connectionAccessOptions" });
  
  useEffect(() => {
    if (!isLoading && config) {
        form.reset({
            connectionAccessOptions: config.connectionAccessOptions,
            isFreeAccessFallbackEnabled: config.isFreeAccessFallbackEnabled,
            freeAccessDurationMinutes: config.freeAccessDurationMinutes,
            disclaimerEmailContent: config.disclaimerEmailContent,
        });
    }
  }, [config, isLoading, form]);

  const onSubmit = async (data: ConnectionAccessFormData) => {
    setIsSaving(true);
    try {
      const settingsDocRef = doc(db, APP_CONFIG_COLLECTION, APP_CONFIG_DOC_ID);
      const dataToSave: Partial<AppSettings> = {
        connectionAccessOptions: data.connectionAccessOptions,
        isFreeAccessFallbackEnabled: data.isFreeAccessFallbackEnabled,
        freeAccessDurationMinutes: data.freeAccessDurationMinutes,
        disclaimerEmailContent: data.disclaimerEmailContent,
        updatedAt: Timestamp.now(),
      };
      await setDoc(settingsDocRef, dataToSave, { merge: true });
      toast({ title: "Success", description: "Connection access settings have been saved." });
    } catch (error) {
      toast({ title: "Error", description: "Could not save settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  if (error) {
    return <div className="text-destructive p-4">Error loading settings: {error}</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Connection Access Settings</CardTitle>
            <CardDescription>Configure pricing and options for users to connect with providers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <h3 className="text-lg font-medium">Paid Access Tiers</h3>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                    <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-primary">{field.label}</h4>
                        <FormField
                            control={form.control}
                            name={`connectionAccessOptions.${index}.enabled`}
                            render={({ field: switchField }) => (
                                <FormItem><FormControl><Switch checked={switchField.value} onCheckedChange={switchField.onChange} /></FormControl></FormItem>
                            )}
                        />
                    </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <FormField control={form.control} name={`connectionAccessOptions.${index}.price`} render={({ field: itemField }) => (<FormItem><FormLabel>Price (₹)</FormLabel><FormControl><Input type="number" {...itemField} /></FormControl><FormMessage /></FormItem>)} />
                    {field.id !== 'oneTime' && field.id !== 'lifetime' && (
                        <FormField control={form.control} name={`connectionAccessOptions.${index}.durationDays`} render={({ field: itemField }) => (<FormItem><FormLabel>Duration (Days)</FormLabel><FormControl><Input type="number" {...itemField} /></FormControl><FormMessage /></FormItem>)}/>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            <Separator />
            <h3 className="text-lg font-medium">Free Access Fallback</h3>
            <FormField
              control={form.control}
              name="isFreeAccessFallbackEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Enable Free Access</FormLabel>
                    <FormDescription>If all paid options are disabled, allow free access for a limited time.</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )}
            />
            {form.watch('isFreeAccessFallbackEnabled') && (
                <FormField control={form.control} name="freeAccessDurationMinutes" render={({ field }) => (<FormItem><FormLabel>Free Access Duration (Minutes)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            )}
             <Separator />
            <FormField control={form.control} name="disclaimerEmailContent" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-medium flex items-center"><FileText className="mr-2 h-5 w-5"/>Legal Disclaimer Email Content</FormLabel>
                <FormControl><Textarea {...field} rows={6} /></FormControl>
                <FormDescription>This content will be sent to both user and provider upon successful connection.</FormDescription>
                <FormMessage />
              </FormItem>
            )}/>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save All Settings
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
