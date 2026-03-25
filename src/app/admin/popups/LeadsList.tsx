'use client';

import { useState } from "react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { Users, Mail, Phone, Calendar, Link as LinkIcon, Eye, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteLead } from "./actions";
import { useToast } from "@/hooks/use-toast";

interface LeadsListProps {
    leads: any[];
    isLoading: boolean;
    onRefresh: () => void;
}

export default function LeadsList({ leads, isLoading, onRefresh }: LeadsListProps) {
    const { toast } = useToast();
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

    const handleViewLead = (lead: any) => {
        setSelectedLead(lead);
        setIsViewOpen(true);
    };

    const handleDeleteLead = async () => {
        if (!leadToDelete) return;
        
        setIsDeleting(true);
        const res = await deleteLead(leadToDelete);
        if (res.success) {
            toast({ title: "Success", description: "Lead deleted successfully." });
            onRefresh();
        } else {
            toast({ title: "Error", description: "Failed to delete lead.", variant: "destructive" });
        }
        setIsDeleting(false);
        setLeadToDelete(null);
    };

    if (isLoading) {
        return (
            <div className="border rounded-lg p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[150px]" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (leads.length === 0) {
        return (
            <div className="border border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="bg-muted p-4 rounded-full">
                    <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">No leads yet</h3>
                    <p className="text-muted-foreground">Captured leads from your popups will appear here.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="border rounded-lg overflow-hidden bg-card">
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Lead Info</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Source Popup</TableHead>
                            <TableHead>Page</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.map((lead) => (
                            <TableRow key={lead.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{lead.name || 'Anonymous'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        {lead.email && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <Mail className="h-3 w-3 text-muted-foreground" />
                                                <span>{lead.email}</span>
                                            </div>
                                        )}
                                        {lead.phone && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <Phone className="h-3 w-3 text-muted-foreground" />
                                                <span>{lead.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm">{lead.popup_name || 'Deleted Popup'}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-xs">
                                        <LinkIcon className="h-3 w-3 text-muted-foreground" />
                                        <span className="truncate max-w-[150px]">{lead.page_url}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-xs">
                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                        <span>{format(new Date(lead.created_at), 'PPp')}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                            onClick={() => handleViewLead(lead)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => setLeadToDelete(lead.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </div>
            </div>

            {/* View Lead Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Lead Details</DialogTitle>
                        <DialogDescription>
                            Detailed information captured from the popup.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLead && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-3 gap-4 border-b pb-4">
                                <div className="text-sm font-semibold text-muted-foreground">Name</div>
                                <div className="col-span-2 text-sm">{selectedLead.name || 'Anonymous'}</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 border-b pb-4">
                                <div className="text-sm font-semibold text-muted-foreground">Email</div>
                                <div className="col-span-2 text-sm">{selectedLead.email || 'N/A'}</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 border-b pb-4">
                                <div className="text-sm font-semibold text-muted-foreground">Phone</div>
                                <div className="col-span-2 text-sm">{selectedLead.phone || 'N/A'}</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 border-b pb-4">
                                <div className="text-sm font-semibold text-muted-foreground">Source Popup</div>
                                <div className="col-span-2 text-sm">{selectedLead.popup_name || 'Deleted Popup'}</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 border-b pb-4">
                                <div className="text-sm font-semibold text-muted-foreground">Captured On</div>
                                <div className="col-span-2 text-sm break-all">{selectedLead.page_url}</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-sm font-semibold text-muted-foreground">Date & Time</div>
                                <div className="col-span-2 text-sm">
                                    {format(new Date(selectedLead.created_at), 'PPPPpppp')}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setIsViewOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Lead Confirmation */}
            <AlertDialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the captured lead
                            from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteLead();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete Lead"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
