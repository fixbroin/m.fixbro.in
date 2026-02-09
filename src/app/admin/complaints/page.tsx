
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2, Loader2, PackageSearch, ShieldAlert, MoreHorizontal } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, Timestamp, updateDoc } from 'firebase/firestore';
import type { Complaint, ComplaintStatus } from '@/types/firestore';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDescriptionComponent, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const formatDate = (timestamp?: Timestamp): string => {
  if (!timestamp) return 'N/A';
  return timestamp.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getStatusBadgeVariant = (status?: ComplaintStatus) => {
    switch (status) {
      case 'Pending': return 'destructive';
      case 'Reviewed': return 'secondary';
      case 'Closed': return 'default';
      default: return 'outline';
    }
};

const ComplaintDetailsModal = ({ isOpen, onClose, complaint }: { isOpen: boolean; onClose: () => void; complaint: Complaint | null; }) => {
  if (!complaint) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[90vw] max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
          <DialogTitle>{complaint.title}</DialogTitle>
          <DialogDescriptionComponent>Complaint ID: {complaint.id}</DialogDescriptionComponent>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto min-h-0">
          <div className="p-6 space-y-4 text-sm">
            <div><p className="font-semibold">Against Provider:</p><p className="text-muted-foreground">{complaint.providerName} ({complaint.providerId})</p></div>
            <Separator/>
            <div><p className="font-semibold">Submitted By:</p><p className="text-muted-foreground">{complaint.userName} ({complaint.userEmail}, {complaint.userMobile})</p></div>
            <Separator/>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="font-semibold">Date Submitted:</p><p className="text-muted-foreground">{formatDate(complaint.createdAt)}</p></div>
              <div><p className="font-semibold">Status:</p><Badge variant={getStatusBadgeVariant(complaint.status)}>{complaint.status || 'Pending'}</Badge></div>
            </div>
            <Separator/>
            <div>
                <p className="font-semibold">Description:</p>
                <p className="whitespace-pre-wrap text-muted-foreground mt-1">{complaint.description}</p>
            </div>
          </div>
        </div>
        <DialogFooter className="p-6 border-t bg-muted/50 flex-shrink-0">
            <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const complaintsRef = collection(db, "complaints");
    const q = query(complaintsRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComplaints(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complaint)));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching complaints:", error);
      toast({ title: "Error", description: "Could not fetch complaints.", variant: "destructive" });
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteComplaint = async (complaintId: string) => {
    if (!complaintId) return;
    setIsDeleting(complaintId);
    try {
      await deleteDoc(doc(db, "complaints", complaintId));
      toast({ title: "Complaint Deleted", description: "The complaint has been removed." });
    } catch (error) {
      toast({ title: "Error", description: "Could not delete the complaint.", variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleUpdateStatus = async (complaintId: string, newStatus: ComplaintStatus) => {
    if (!complaintId) return;
    setIsUpdating(complaintId);
    try {
        await updateDoc(doc(db, "complaints", complaintId), { 
            status: newStatus,
            updatedAt: Timestamp.now(),
        });
        toast({ title: "Status Updated", description: `Complaint marked as ${newStatus}.`});
    } catch (error) {
        toast({ title: "Error", description: "Could not update status.", variant: "destructive" });
    } finally {
        setIsUpdating(null);
    }
  };

  const statusOptions: ComplaintStatus[] = ['Pending', 'Reviewed', 'Closed'];

  const renderMobileCard = (complaint: Complaint) => (
    <Card key={complaint.id} className="mb-4 shadow-sm">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-base font-bold break-words">{complaint.title}</CardTitle>
            <Badge variant={getStatusBadgeVariant(complaint.status)} className="capitalize text-xs whitespace-nowrap">
                {isUpdating === complaint.id ? <Loader2 className="h-4 w-4 animate-spin"/> : complaint.status || 'Pending'}
            </Badge>
        </div>
        <CardDescription className="text-xs pt-1">{formatDate(complaint.createdAt)}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-sm space-y-2">
        <p><strong>Provider:</strong> <span className="text-muted-foreground">{complaint.providerName}</span></p>
        <p><strong>User:</strong> <span className="text-muted-foreground">{complaint.userName} ({complaint.userMobile || complaint.userEmail})</span></p>
         <div>
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <Select
                value={complaint.status || 'Pending'}
                onValueChange={(newStatus) => handleUpdateStatus(complaint.id!, newStatus as ComplaintStatus)}
                disabled={isUpdating === complaint.id}
            >
                <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Update Status"/>
                </SelectTrigger>
                <SelectContent>{statusOptions.map(status => (<SelectItem key={status} value={status} className="text-xs">{status}</SelectItem>))}</SelectContent>
            </Select>
        </div>
      </CardContent>
      <CardFooter className="p-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => handleViewDetails(complaint)}><Eye className="mr-1 h-4 w-4"/> View Details</Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="h-9 w-9" title="Delete Complaint" disabled={isDeleting === complaint.id || !complaint.id}>
                        {isDeleting === complaint.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        <span className="sr-only">Delete</span>
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirm Deletion</AlertDialogTitle><AlertDialogDescription>This will permanently delete this complaint.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteComplaint(complaint.id!)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
      </CardFooter>
    </Card>
  );


  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ShieldAlert className="mr-2 h-6 w-6 text-primary" /> User Complaints</CardTitle>
          <CardDescription>Review and manage complaints submitted by users against providers.</CardDescription>
        </CardHeader>
        <CardContent>
          {complaints.length === 0 ? (
            <div className="text-center py-10"><PackageSearch className="mx-auto h-12 w-12 text-muted-foreground mb-3" /><p className="text-muted-foreground">No complaints found.</p></div>
          ) : (
            <>
              {/* Desktop and Tablet View: Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Provider</TableHead><TableHead>User</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {complaints.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium max-w-xs truncate">{c.title}</TableCell>
                        <TableCell className="text-xs">{c.providerName}</TableCell>
                        <TableCell className="text-xs">{c.userName}<br/><span className="text-muted-foreground">{c.userMobile}</span></TableCell>
                        <TableCell className="text-xs">{formatDate(c.createdAt)}</TableCell>
                        <TableCell>
                          <Select
                            value={c.status || 'Pending'}
                            onValueChange={(newStatus) => handleUpdateStatus(c.id!, newStatus as ComplaintStatus)}
                            disabled={isUpdating === c.id}
                          >
                            <SelectTrigger className="h-8 text-xs w-[120px]">
                              <Badge variant={getStatusBadgeVariant(c.status)}>{c.status || 'Pending'}</Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map(status => (
                                <SelectItem key={status} value={status} className="text-xs">{status}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(c)}><Eye className="mr-1 h-4 w-4"/>View</Button>
                          <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="destructive" size="icon" className="ml-2 h-8 w-8" disabled={isDeleting === c.id}>{isDeleting === c.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}</Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Confirm Deletion</AlertDialogTitle><AlertDialogDescription>This will permanently delete this complaint. Are you sure?</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteComplaint(c.id!)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View: Cards */}
              <div className="md:hidden">
                {complaints.map(renderMobileCard)}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {selectedComplaint && <ComplaintDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} complaint={selectedComplaint} />}
    </div>
  );
}

