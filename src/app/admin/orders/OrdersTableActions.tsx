
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Order, deleteOrder } from "@/app/checkout/actions";
import { Eye, Trash } from "lucide-react";

interface OrdersTableActionsProps {
  order: Order;
}

export default function OrdersTableActions({ order }: OrdersTableActionsProps) {
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
      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order from {order.customer_name}</DialogTitle>
            <DialogDescription>
              {order.created_at}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p><strong>Customer Name:</strong> {order.customer_name}</p>
            <p><strong>Email:</strong> {order.customer_email}</p>
            <p><strong>Plan:</strong> {order.plan_title}</p>
            <p><strong>Amount:</strong> ₹{Number(order.amount).toLocaleString()}</p>
            <p><strong>Status:</strong> <span className="capitalize">{order.status}</span></p>
            <p><strong>Payment ID:</strong> {order.razorpay_payment_id}</p>
            <p><strong>Order ID:</strong> {order.razorpay_order_id || 'N/A'}</p>
          </div>
        </DialogContent>
      </Dialog>

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
