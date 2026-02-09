

"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs, limit } from 'firebase/firestore';
import type { Complaint, ComplaintStatus, ProviderApplication, FirestoreUser, FirestoreNotification } from '@/types/firestore';
import type { User } from 'firebase/auth';
import { ADMIN_EMAIL } from '@/contexts/AuthContext';

interface ComplaintFormProps {
  isOpen: boolean;
  onClose: () => void;
  provider: ProviderApplication;
  user: User;
}

const complaintFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(150, "Title is too long."),
  description: z.string().min(20, "Please provide a more detailed description.").max(2000, "Description is too long."),
});

type ComplaintFormData = z.infer<typeof complaintFormSchema>;

export default function ComplaintForm({ isOpen, onClose, provider, user }: ComplaintFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintFormSchema),
    defaultValues: { title: "", description: "" },
  });

  const onSubmit = async (data: ComplaintFormData) => {
    setIsSubmitting(true);
    try {
      const complaintData: Omit<Complaint, 'id'> = {
        title: data.title,
        description: data.description,
        userId: user.uid,
        userName: user.displayName || 'N/A',
        userEmail: user.email || 'N/A',
        userMobile: user.phoneNumber || 'N/A',
        providerId: provider.id!,
        providerName: provider.fullName || 'N/A',
        status: 'Pending',
        createdAt: Timestamp.now(),
      };
      const complaintDocRef = await addDoc(collection(db, "complaints"), complaintData);
      
      // Find admin to send notification
      const adminQuery = query(collection(db, "users"), where("email", "==", ADMIN_EMAIL), limit(1));
      const adminSnapshot = await getDocs(adminQuery);
      if (!adminSnapshot.empty) {
        const adminUid = adminSnapshot.docs[0].id;
        const adminNotification: FirestoreNotification = {
          userId: adminUid,
          title: "New Complaint Filed",
          message: `User ${user.displayName || user.email} filed a complaint against provider ${provider.fullName}.`,
          type: 'admin_alert',
          href: `/admin/complaints?id=${complaintDocRef.id}`,
          read: false,
          createdAt: Timestamp.now(),
        };
        await addDoc(collection(db, "userNotifications"), adminNotification);
      } else {
        console.warn("Could not find admin user to send complaint notification.");
      }

      toast({ title: "Complaint Submitted", description: "Your complaint has been received and will be reviewed." });
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast({ title: "Error", description: "Could not submit your complaint. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>File a Complaint Against {provider.fullName}</DialogTitle>
          <DialogDescription>
            Please provide details about the issue. This will be sent to our support team for review.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complaint Title</FormLabel>
                  <FormControl><Input placeholder="e.g., Unprofessional Behavior" {...field} disabled={isSubmitting} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complaint Description</FormLabel>
                  <FormControl><Textarea placeholder="Please describe the issue in detail..." {...field} rows={5} disabled={isSubmitting} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Complaint
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

