
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { UserProviderConnection } from '@/types/firestore';
import { Timestamp } from "firebase/firestore";
import { Separator } from "../ui/separator";

interface EnrichedConnection extends UserProviderConnection {
  userName?: string;
  userEmail?: string;
  userMobileNumber?: string;
  providerName?: string;
  providerWorkCategory?: string;
}

interface ConnectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: EnrichedConnection | null;
}

const formatDate = (timestamp?: Timestamp) => {
  if (!timestamp) return 'N/A';
  return timestamp.toDate().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getAccessTypeLabel = (accessType?: UserProviderConnection['accessType']) => {
    switch (accessType) {
        case 'oneTime': return 'One-Time';
        case 'sevenDays': return '7 Days';
        case 'thirtyDays': return '30 Days';
        case 'lifetime': return 'Lifetime';
        case 'free': return 'Free';
        default: return 'Unknown';
    }
};

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-base text-foreground break-words">{value || "N/A"}</p>
    </div>
);


export default function ConnectionDetailsModal({ isOpen, onClose, connection }: ConnectionDetailsModalProps) {
  if (!connection) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[90vw] max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
          <DialogTitle>Connection Details</DialogTitle>
          <DialogDescription className="break-words">
            Record ID: {connection.id}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto min-h-0">
          <div className="p-6 space-y-4">
            <section>
              <h3 className="text-lg font-semibold mb-2">Customer Details</h3>
              <div className="space-y-1 text-sm">
                <DetailItem label="Name" value={connection.userName} />
                <DetailItem label="Email" value={connection.userEmail} />
                <DetailItem label="Mobile" value={connection.userMobileNumber} />
                <DetailItem label="User ID" value={connection.userId} />
              </div>
            </section>
            
            <Separator />
            
            <section>
              <h3 className="text-lg font-semibold mb-2">Provider Details</h3>
               <div className="space-y-1 text-sm">
                <DetailItem label="Name" value={connection.providerName} />
                <DetailItem label="Category" value={connection.providerWorkCategory} />
                <DetailItem label="Provider ID" value={connection.providerId} />
              </div>
            </section>
            
            <Separator />

             <section>
              <h3 className="text-lg font-semibold mb-2">Connection & Payment</h3>
              <div className="space-y-1 text-sm">
                <DetailItem label="Access Type" value={getAccessTypeLabel(connection.accessType)} />
                <DetailItem label="Date Granted" value={formatDate(connection.grantedAt)} />
                <DetailItem label="Expires At" value={connection.expiresAt ? formatDate(connection.expiresAt) : 'Never'} />
                <DetailItem label="Payment ID" value={connection.paymentId} />
              </div>
            </section>

          </div>
        </div>
        
        <DialogFooter className="p-6 border-t bg-muted/50 flex-shrink-0">
          <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

  