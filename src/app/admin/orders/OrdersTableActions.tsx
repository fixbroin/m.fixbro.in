
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Order, deleteOrder } from "@/app/checkout/actions";
import { Eye, FileText, Download, Trash } from "lucide-react";

interface OrdersTableActionsProps {
  order: Order;
  currencySymbol?: string;
}

export default function OrdersTableActions({ order, currencySymbol = '₹' }: OrdersTableActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteOrder(order.id);
      if (result.success) {
        toast({ description: "Order deleted successfully." });
        setIsDeleteDialogOpen(false);
      } else {
        toast({ variant: "destructive", description: result.error || "Failed to delete order." });
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* View Receipt Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" title="View Receipt">
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Receipt — {order.customer_name}</DialogTitle>
            <DialogDescription>
              Receipt ID: {order.id} • {order.created_at}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border bg-muted/30 p-4 space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-semibold text-right">{order.customer_name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Email</span>
              <span className="text-right">{order.customer_email}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Plan / Details</span>
              <span className="font-medium text-right">{order.plan_title}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="capitalize text-right">{order.razorpay_payment_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Status</span>
              <span className="capitalize font-semibold text-right">{order.status}</span>
            </div>
            <div className="flex justify-between gap-4 border-t pt-2.5 text-base font-bold">
              <span>Total Amount</span>
              <span>{currencySymbol}{Number(order.amount).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/admin/orders/${order.id}/receipt`} target="_blank" rel="noopener noreferrer">
                <FileText className="mr-1.5 h-4 w-4" /> View PDF
              </a>
            </Button>
            <Button size="sm" asChild>
              <a href={`/api/admin/orders/${order.id}/receipt?download=1`}>
                <Download className="mr-1.5 h-4 w-4" /> Download PDF
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button variant="ghost" size="icon" title="Download PDF Receipt" asChild>
        <a href={`/api/admin/orders/${order.id}/receipt?download=1`}>
          <Download className="h-4 w-4" />
        </a>
      </Button>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="text-destructive">
            <Trash className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this order record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
