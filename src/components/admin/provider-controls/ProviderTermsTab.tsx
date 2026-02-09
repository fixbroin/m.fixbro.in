

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Loader2, Save, FileText } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, setDoc, Timestamp } from "firebase/firestore";
import type { AppSettings } from '@/types/firestore';
import { useApplicationConfig } from '@/hooks/useApplicationConfig';

const termsSchema = z.object({
  providerTermsAndConditions: z.string().min(50, "Terms and conditions content must be at least 50 characters."),
});

type TermsFormData = z.infer<typeof termsSchema>;

export default function ProviderTermsTab() {
  const { toast } = useToast();
  const { config, isLoading } = useApplicationConfig();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<TermsFormData>({
    resolver: zodResolver(termsSchema),
    defaultValues: {
      providerTermsAndConditions: "",
    },
  });

  useEffect(() => {
    if (!isLoading && config) {
      form.reset({
        providerTermsAndConditions: config.providerTermsAndConditions || "",
      });
    }
  }, [config, isLoading, form]);

  const onSubmit = async (data: TermsFormData) => {
    setIsSaving(true);
    try {
      const settingsDocRef = doc(db, "webSettings", "applicationConfig");
      const settingsToUpdate: Partial<AppSettings> = {
        providerTermsAndConditions: data.providerTermsAndConditions,
        updatedAt: Timestamp.now(),
      };
      await setDoc(settingsDocRef, settingsToUpdate, { merge: true });
      toast({ title: "Success", description: "Provider Terms & Conditions have been saved." });
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message || "Could not save settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5"/>Provider Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5"/>Provider Terms & Conditions</CardTitle>
            <CardDescription>
              Set the terms providers must agree to during registration. HTML is supported.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="providerTermsAndConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms & Conditions Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the full text of your terms and conditions for providers here..."
                      rows={20}
                      {...field}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Terms & Conditions
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
