
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CircleUser, Menu, Bell, Search, LogOut, User as UserIcon, Settings } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "./login/auth-actions";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getUnreadNotificationsCount, markAllNotificationsAsRead } from "./notifications/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function AdminHeader({ user }: { user: any }) {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => {
        let isMounted = true;
        const fetchNotifications = async () => {
            const count = await getUnreadNotificationsCount();
            if (isMounted) {
                setNotificationCount(count);
            }
        };
        
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); 
        
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await logout(); 
            toast({
                title: 'Logged Out',
                description: 'Session ended successfully.',
            });
            router.replace('/admin/login');
        } catch (error) {
            console.error('Logout Error:', error);
            toast({
                title: 'Logout Failed',
                description: 'An error occurred while logging out.',
                variant: 'destructive',
            });
        }
    }
    
    const handleNotificationClick = async () => {
        await markAllNotificationsAsRead();
        setNotificationCount(0);
        router.push('/admin/notifications');
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-white/80 dark:bg-background/60 backdrop-blur-xl px-4 lg:px-8 shadow-sm dark:shadow-none">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 md:hidden hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                        <Menu className="h-5 w-5 text-muted-foreground" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0 bg-card text-card-foreground border-border">
                   <SheetHeader className="sr-only">
                        <SheetTitle>Admin Menu</SheetTitle>
                   </SheetHeader>
                   <AdminSidebar onLinkClick={() => setIsSheetOpen(false)} />
                </SheetContent>
            </Sheet>

            <div className="flex-1 flex items-center max-w-md">
                <div className="relative w-full hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search dashboard..." 
                        className="bg-muted border-border pl-10 focus-visible:ring-primary/20 h-9 transition-all hover:bg-muted/80 text-foreground"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative bg-muted hover:bg-muted/80 rounded-xl h-10 w-10 transition-colors border border-border" 
                    onClick={handleNotificationClick}
                >
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {notificationCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center p-1 text-[10px] font-bold bg-primary hover:bg-primary border-2 border-background text-white rounded-full">
                            {notificationCount}
                        </Badge>
                    )}
                </Button>

                <ThemeSwitcher />

                <div className="h-6 w-px bg-border mx-1" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="p-1 hover:bg-muted rounded-xl flex items-center gap-3 transition-all">
                            <Avatar className="h-8 w-8 rounded-lg shadow-sm border border-border">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs rounded-lg">
                                    {user?.username?.charAt(0).toUpperCase() || <CircleUser className="h-5 w-5" />}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden lg:block text-left mr-2">
                                <p className="text-sm font-semibold leading-none text-foreground">{user?.username || 'Admin'}</p>
                                <p className="text-[10px] text-muted-foreground mt-1 leading-none font-medium">Administrator</p>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mt-2 bg-card text-card-foreground border-border shadow-xl">
                        <DropdownMenuLabel className="font-normal p-4">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-bold leading-none text-foreground">Signed in as</p>
                                <p className="text-xs leading-none text-muted-foreground mt-1 truncate">{user?.username}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem asChild className="hover:bg-muted focus:bg-muted cursor-pointer py-2.5 px-4 font-medium">
                            <Link href="/admin/profile" className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                <span>Profile Settings</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="hover:bg-muted focus:bg-muted cursor-pointer py-2.5 px-4 font-medium">
                            <Link href="/admin/settings" className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                <span>Site Configuration</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 focus:bg-red-50 dark:focus:bg-red-500/10 cursor-pointer py-2.5 px-4 font-semibold">
                            <div className="flex items-center gap-2">
                                <LogOut className="h-4 w-4" />
                                <span>End Session</span>
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
