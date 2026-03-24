
'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash } from 'lucide-react';
import { clearVisitorLogs } from './actions';

export default function ClearLogsButton() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleClear = () => {
    startTransition(async () => {
      const result = await clearVisitorLogs();
      if (result.success) {
        toast({ description: 'All visitor logs have been cleared.' });
      } else {
        toast({ variant: 'destructive', description: result.error || 'Failed to clear logs.' });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash className="mr-2 h-4 w-4" /> Clear All Logs
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete all visitor log data from your database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleClear} disabled={isPending}>
            {isPending ? 'Clearing...' : 'Continue'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
