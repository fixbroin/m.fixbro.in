
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, PackageSearch, Handshake, Users, User, Clock, CheckCircle, ExternalLink, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import type { UserProviderConnection, FirestoreUser, ProviderApplication } from '@/types/firestore';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDocs, where, documentId, Timestamp, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ExpiryCountdown from '@/components/shared/ExpiryCountdown';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ConnectionDetailsModal from '@/components/admin/ConnectionDetailsModal';

interface EnrichedConnection extends UserProviderConnection {
  userName?: string;
  userEmail?: string;
  userMobileNumber?: string;
  providerName?: string;
  providerWorkCategory?: string;
}

const formatDate = (timestamp?: Timestamp) => {
  if (!timestamp) return 'N/A';
  return timestamp.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getAccessTypeLabel = (accessType: UserProviderConnection['accessType']) => {
    switch (accessType) {
        case 'oneTime': return 'One-Time';
        case 'sevenDays': return '7 Days';
        case 'thirtyDays': return '30 Days';
        case 'lifetime': return 'Lifetime';
        case 'free': return 'Free';
        default: return 'Unknown';
    }
};

export default function AdminConnectionsPage() {
  const [connections, setConnections] = useState<EnrichedConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [selectedConnection, setSelectedConnection] = useState<EnrichedConnection | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const connectionsRef = collection(db, "userProviderConnections");
    const q = query(connectionsRef, orderBy("grantedAt", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        setConnections([]);
        setIsLoading(false);
        return;
      }
      
      const fetchedConnections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProviderConnection));
      
      try {
        const userIds = [...new Set(fetchedConnections.map(c => c.userId).filter(Boolean))];
        const providerIds = [...new Set(fetchedConnections.map(c => c.providerId).filter(Boolean))];

        const usersMap = new Map<string, FirestoreUser>();
        const providersMap = new Map<string, ProviderApplication>();

        const CHUNK_SIZE = 30;

        for (let i = 0; i < userIds.length; i += CHUNK_SIZE) {
            const chunk = userIds.slice(i, i + CHUNK_SIZE);
            if (chunk.length > 0) {
                const usersQuery = query(collection(db, "users"), where(documentId(), "in", chunk));
                const usersSnapshot = await getDocs(usersQuery);
                usersSnapshot.forEach(doc => usersMap.set(doc.id, { id: doc.id, ...doc.data() } as FirestoreUser));
            }
        }

        for (let i = 0; i < providerIds.length; i += CHUNK_SIZE) {
            const chunk = providerIds.slice(i, i + CHUNK_SIZE);
            if(chunk.length > 0) {
                const providersQuery = query(collection(db, "providerApplications"), where(documentId(), "in", chunk));
                const providersSnapshot = await getDocs(providersQuery);
                providersSnapshot.forEach(doc => providersMap.set(doc.id, { id: doc.id, ...doc.data() } as ProviderApplication));
            }
        }

        const enrichedData = fetchedConnections.map(conn => {
          const user = usersMap.get(conn.userId);
          const provider = providersMap.get(conn.providerId);
          return {
            ...conn,
            userName: user?.displayName || 'Unknown User',
            userEmail: user?.email || 'N/A',
            userMobileNumber: user?.mobileNumber || 'N/A',
            providerName: provider?.fullName || 'Unknown Provider',
            providerWorkCategory: provider?.workCategoryName || 'N/A',
          };
        });

        setConnections(enrichedData);
      } catch (error) {
        console.error("Error enriching connection data:", error);
        toast({ title: "Data Error", description: "Could not load all user/provider details.", variant: "destructive" });
        setConnections(fetchedConnections as EnrichedConnection[]); // Show basic data on error
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      console.error("Error fetching connections:", error);
      toast({ title: "Error", description: "Could not fetch connection history.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleViewDetails = (connection: EnrichedConnection) => {
    setSelectedConnection(connection);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!connectionId) {
      toast({ title: "Error", description: "Connection ID is missing.", variant: "destructive" });
      return;
    }
    setIsDeleting(connectionId);
    try {
      await deleteDoc(doc(db, "userProviderConnections", connectionId));
      // The onSnapshot listener will automatically update the UI.
      toast({ title: "Success", description: "Connection record deleted." });
    } catch (error) {
      console.error("Error deleting connection:", error);
      toast({ title: "Error", description: (error as Error).message || "Could not delete connection record.", variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };

  const renderMobileCard = (conn: EnrichedConnection) => (
    <Card key={conn.id} className="mb-4 shadow-sm">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-sm font-bold">
                    {conn.userName}
                </CardTitle>
                <CardDescription className="text-xs pt-1">
                    → {conn.providerName}
                </CardDescription>
            </div>
            <Badge variant="secondary">{getAccessTypeLabel(conn.accessType)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-sm space-y-2">
        <p><strong>Customer:</strong> <Link href={`/admin/users?q=${conn.userEmail}`} className="text-primary hover:underline">{conn.userEmail}</Link></p>
        <p><strong>Provider:</strong> <span className="text-muted-foreground">{conn.providerWorkCategory}</span></p>
        <p className="text-xs"><strong>Granted:</strong> {formatDate(conn.grantedAt)}</p>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center">
        <div>
            {conn.expiresAt && conn.expiresAt.toDate() > new Date() ? (
                <ExpiryCountdown expiryDate={conn.expiresAt.toDate()} className="text-blue-700"/>
            ) : conn.accessType !== 'lifetime' && conn.expiresAt && conn.expiresAt.toDate() <= new Date() ? (
                <div className="flex items-center text-destructive text-xs gap-1.5"><Clock className="h-3 w-3"/> Access Expired</div>
            ) : conn.accessType === 'lifetime' ? (
                <div className="flex items-center text-green-600 text-xs gap-1.5"><CheckCircle className="h-3 w-3"/> Lifetime Access</div>
            ) : null}
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleViewDetails(conn)}><Eye className="mr-1 h-4 w-4"/> View</Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="h-9 w-9" title="Delete Connection" disabled={isDeleting === conn.id || !conn.id}>
                        {isDeleting === conn.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        <span className="sr-only">Delete</span>
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription>
                            Delete connection record for {conn.userName}? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteConnection(conn.id!)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <>
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Handshake className="mr-2 h-6 w-6 text-primary" /> Connection History
          </CardTitle>
          <CardDescription>
            Log of all instances where users have unlocked provider contact details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
          ) : connections.length === 0 ? (
            <div className="text-center py-10">
              <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No provider connections have been made yet.</p>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Access Type</TableHead>
                      <TableHead>Date Granted</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Payment ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connections.map(conn => (
                      <TableRow key={conn.id}>
                        <TableCell>
                          <div className="font-medium">{conn.userName}</div>
                          <div className="text-xs text-muted-foreground">{conn.userEmail}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{conn.providerName}</div>
                          <div className="text-xs text-muted-foreground">{conn.providerWorkCategory}</div>
                        </TableCell>
                        <TableCell><Badge variant="secondary">{getAccessTypeLabel(conn.accessType)}</Badge></TableCell>
                        <TableCell className="text-xs">{formatDate(conn.grantedAt)}</TableCell>
                        <TableCell className="text-xs">
                          {conn.accessType === 'lifetime' ? 'Never' : formatDate(conn.expiresAt)}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{conn.paymentId || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                           <div className="flex gap-2 justify-end">
                               <Button variant="outline" size="sm" onClick={() => handleViewDetails(conn)}><Eye className="mr-1 h-4 w-4"/>View</Button>
                               <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="icon" disabled={isDeleting === conn.id}>
                                          {isDeleting === conn.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                                      </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                      <AlertDialogHeader>
                                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                              Permanently delete connection for {conn.userName}?
                                          </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteConnection(conn.id!)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
                           </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden">
                {connections.map(renderMobileCard)}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
    <ConnectionDetailsModal 
      isOpen={isDetailsModalOpen}
      onClose={() => setIsDetailsModalOpen(false)}
      connection={selectedConnection}
    />
    </>
  );
}

  