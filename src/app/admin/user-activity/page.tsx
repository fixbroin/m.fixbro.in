'use client';

import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getRecentPageVisits, getRecentUserEvents, PageVisit, UserEvent } from './actions';
import { formatDistanceToNow } from 'date-fns';
import ClearActivityButton from './ClearActivityButton';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserActivityPage() {
  const [pageVisits, setPageVisits] = useState<PageVisit[]>([]);
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivity = async () => {
    const [visits, events] = await Promise.all([
      getRecentPageVisits(20),
      getRecentUserEvents(20),
    ]);
    setPageVisits(visits);
    setUserEvents(events);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchActivity(); // Initial fetch
    const interval = setInterval(fetchActivity, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval); // Cleanup on component unmount
  }, []);

  const ActivityTableSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><Skeleton className="h-5 w-24" /></TableHead>
          <TableHead><Skeleton className="h-5 w-24" /></TableHead>
          <TableHead className="text-right"><Skeleton className="h-5 w-20" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="w-full space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold">User Activity</h1>
            <p className="text-muted-foreground mt-2">A real-time log of recent user interactions on your website. Refreshes every 5 seconds.</p>
        </div>
        <ClearActivityButton />
      </div>


      <div className="grid gap-8 grid-cols-1 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Page Visits</CardTitle>
            <CardDescription>The last 20 pages visited by users.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <ActivityTableSkeleton /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page URL</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="font-medium truncate max-w-xs">{visit.pageUrl}</TableCell>
                      <TableCell><Badge variant="outline">{visit.userId}</Badge></TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDistanceToNow(new Date(visit.serverTimestamp), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {pageVisits.length === 0 && (
                      <TableRow>
                          <TableCell colSpan={3} className="text-center h-24">No page visits recorded yet.</TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent User Events</CardTitle>
            <CardDescription>The last 20 actions performed by users.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <ActivityTableSkeleton /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.action}</TableCell>
                      <TableCell><Badge variant="outline">{event.userId}</Badge></TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDistanceToNow(new Date(event.serverTimestamp), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {userEvents.length === 0 && (
                      <TableRow>
                          <TableCell colSpan={3} className="text-center h-24">No user events recorded yet.</TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
