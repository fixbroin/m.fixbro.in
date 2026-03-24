'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getVisitorLogs, VisitorLog } from './actions';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ClearLogsButton from './ClearLogsButton';

export default function VisitorLogsPage() {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    const fetchedLogs = await getVisitorLogs(50);
    setLogs(fetchedLogs);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval); // Cleanup on component unmount
  }, []);

  const ActivityTableSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><Skeleton className="h-5 w-24" /></TableHead>
          <TableHead><Skeleton className="h-5 w-24" /></TableHead>
          <TableHead><Skeleton className="h-5 w-24" /></TableHead>
          <TableHead><Skeleton className="h-5 w-24" /></TableHead>
          <TableHead><Skeleton className="h-5 w-20" /></TableHead>
          <TableHead className="text-right"><Skeleton className="h-5 w-20" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(10)].map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
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
            <h1 className="text-3xl font-bold">Visitor Logs</h1>
            <p className="text-muted-foreground mt-2">A log of recent visitors to your website, auto-refreshing every 10 seconds.</p>
        </div>
        <ClearLogsButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Visitors</CardTitle>
          <CardDescription>Here are the last 50 visitors to your site.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <ActivityTableSkeleton /> : (
            <Table className="responsive-table">
              <TableHeader>
                <TableRow>
                  <TableHead>City</TableHead>
                  <TableHead>State/Region</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Postal Code</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell data-label="City" className="font-medium">{log.city || 'N/A'}</TableCell>
                    <TableCell data-label="State/Region">{log.region || 'N/A'}</TableCell>
                    <TableCell data-label="Country">{log.country || 'N/A'}</TableCell>
                    <TableCell data-label="Postal Code">{log.postal || 'N/A'}</TableCell>
                    <TableCell data-label="Device">{log.device || 'N/A'}</TableCell>
                    <TableCell data-label="Time" className="text-right text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">No visitor logs recorded yet.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
