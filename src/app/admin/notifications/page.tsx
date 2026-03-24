'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getNotifications, clearAllNotifications, Notification } from './actions';
import { useEffect, useState, useTransition } from 'react';
import { Bell, ShoppingBag, User, Mail, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
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


const iconMap = {
    visit: <User className="h-5 w-5 text-blue-500" />,
    submission: <Mail className="h-5 w-5 text-green-500" />,
    order: <ShoppingBag className="h-5 w-5 text-purple-500" />
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isClearing, startClearingTransition] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        async function fetchNotifications() {
            setIsLoading(true);
            const data = await getNotifications();
            setNotifications(data);
            setIsLoading(false);
        }
        fetchNotifications();
    }, []);

    const handleClearAll = () => {
        startClearingTransition(async () => {
            const result = await clearAllNotifications();
            if (result.success) {
                toast({ description: "All notifications cleared."});
                setNotifications([]);
            } else {
                toast({ variant: 'destructive', description: result.error || "Failed to clear notifications."});
            }
        });
    }

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Notifications</h1>
                    <p className="text-muted-foreground">A log of all user activity on your website.</p>
                </div>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={notifications.length === 0 || isClearing}>
                            <Trash className="mr-2 h-4 w-4" /> Clear All
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all notifications.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearAll} disabled={isClearing}>
                            {isClearing ? 'Clearing...' : 'Continue'}
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Activity Feed</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p>Loading notifications...</p>
                    ) : notifications.length > 0 ? (
                        <ul className="space-y-4">
                            {notifications.map(notification => (
                                <li 
                                    key={notification.id} 
                                    className={cn(
                                        "flex items-start gap-4 p-4 rounded-lg border",
                                        !notification.isRead && "bg-secondary"
                                    )}
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        {iconMap[notification.type]}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-medium">{notification.message}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Bell className="mx-auto h-12 w-12" />
                            <p className="mt-4">No notifications yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
