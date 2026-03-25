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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
    Edit, 
    Trash2, 
    Monitor, 
    Smartphone, 
    Clock, 
    MousePointerClick, 
    MoveVertical, 
    LogOut 
} from "lucide-react";
import { deletePopup, togglePopupStatus } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
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

interface PopupListProps {
    popups: any[];
    onEdit: (popup: any) => void;
    onRefresh: () => void;
    isLoading: boolean;
}

export default function PopupList({ popups, onEdit, onRefresh, isLoading }: PopupListProps) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [popupToDelete, setPopupToDelete] = useState<string | null>(null);

    const handleDelete = async () => {
        if (!popupToDelete) return;
        
        setIsDeleting(true);
        const res = await deletePopup(popupToDelete);
        if (res.success) {
            toast({ title: "Success", description: "Popup deleted successfully." });
            onRefresh();
        } else {
            toast({ title: "Error", description: "Failed to delete popup.", variant: "destructive" });
        }
        setIsDeleting(false);
        setPopupToDelete(null);
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const res = await togglePopupStatus(id, !currentStatus);
        if (res.success) {
            toast({ title: "Success", description: "Popup status updated." });
            onRefresh();
        } else {
            toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
        }
    };

    const getTriggerIcon = (type: string) => {
        switch (type) {
            case 'on_load': return <Clock className="h-4 w-4" />;
            case 'delay': return <Clock className="h-4 w-4" />;
            case 'scroll': return <MoveVertical className="h-4 w-4" />;
            case 'exit': return <LogOut className="h-4 w-4" />;
            default: return <MousePointerClick className="h-4 w-4" />;
        }
    };

    const getDeviceIcons = (devices: string) => {
        if (devices === 'all') return (
            <div className="flex gap-1">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <Smartphone className="h-4 w-4 text-muted-foreground" />
            </div>
        );
        if (devices === 'desktop') return <Monitor className="h-4 w-4 text-muted-foreground" />;
        if (devices === 'mobile') return <Smartphone className="h-4 w-4 text-muted-foreground" />;
        return null;
    };

    if (isLoading) {
        return (
            <div className="border rounded-lg p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[150px]" />
                        </div>
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                ))}
            </div>
        );
    }

    if (popups.length === 0) {
        return (
            <div className="border border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="bg-muted p-4 rounded-full">
                    <MousePointerClick className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">No popups found</h3>
                    <p className="text-muted-foreground">Get started by creating your first popup campaign.</p>
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
                            <TableHead>Popup Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Trigger</TableHead>
                            <TableHead>Devices</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {popups.map((popup) => (
                            <TableRow key={popup.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{popup.name}</span>
                                        <span className="text-xs text-muted-foreground capitalize">{popup.type}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                        {popup.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-sm">
                                        {getTriggerIcon(popup.trigger_type)}
                                        <span className="capitalize">{popup.trigger_type.replace('_', ' ')}</span>
                                        {popup.trigger_value > 0 && (
                                            <span className="text-xs text-muted-foreground">
                                                ({popup.trigger_value}{popup.trigger_type === 'scroll' ? '%' : 's'})
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {getDeviceIcons(popup.devices)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Switch 
                                            checked={popup.is_active === 1 || popup.is_active === true} 
                                            onCheckedChange={() => handleToggleStatus(popup.id, popup.is_active)}
                                        />
                                        <span className="text-xs">
                                            {(popup.is_active === 1 || popup.is_active === true) ? 'Active' : 'Disabled'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(popup)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => setPopupToDelete(popup.id)} 
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
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

            <AlertDialog open={!!popupToDelete} onOpenChange={(open) => !open && setPopupToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the popup campaign
                            and all its settings from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete Popup"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
