
"use client";

import { useEffect, useState, useTransition } from "react";
import { 
    getNewsletterSubscribers, 
    deleteSubscriber, 
    NewsletterSubscriber 
} from "./newsletter-actions";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Trash2, UserCheck, Download } from "lucide-react";
import { format } from "date-fns";

export default function NewsletterSubscribers() {
    const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const fetchSubscribers = async () => {
        setIsLoading(true);
        const data = await getNewsletterSubscribers();
        setSubscribers(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this subscriber?")) return;
        
        startTransition(async () => {
            const res = await deleteSubscriber(id);
            if (res.success) {
                toast({ title: "Removed", description: "Subscriber removed successfully." });
                fetchSubscribers();
            } else {
                toast({ title: "Error", description: res.error, variant: "destructive" });
            }
        });
    };

    const exportCSV = () => {
        const headers = ["Email", "Subscribed At"];
        const rows = subscribers.map(s => [s.email, s.subscribedAt]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card className="bg-card text-card-foreground border-border shadow-sm dark:shadow-2xl overflow-hidden">
            <CardHeader className="pb-4 bg-slate-50/50 dark:bg-white/[0.02] border-b border-border flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Mail className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-xl text-foreground font-bold">Newsletter Subscribers</CardTitle>
                        <CardDescription className="text-muted-foreground">Manage your mailing list and export data.</CardDescription>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={exportCSV} 
                    disabled={subscribers.length === 0}
                    className="rounded-xl border-border font-bold gap-2"
                >
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-black/20 sticky top-0 z-10">
                            <TableRow className="border-border">
                                <TableHead className="text-foreground font-bold uppercase tracking-widest text-[10px]">Email Address</TableHead>
                                <TableHead className="text-foreground font-bold uppercase tracking-widest text-[10px]">Subscribed On</TableHead>
                                <TableHead className="text-right text-foreground font-bold uppercase tracking-widest text-[10px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-10 text-foreground">Loading subscribers...</TableCell>
                                </TableRow>
                            ) : subscribers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground font-medium italic">No subscribers yet.</TableCell>
                                </TableRow>
                            ) : (
                                subscribers.map((sub) => (
                                    <TableRow key={sub.id} className="border-border hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <TableCell className="font-bold text-foreground">{sub.email}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(sub.subscribedAt), 'MMM dd, yyyy • hh:mm a')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleDelete(sub.id)}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                
                <div className="p-6 bg-slate-50/30 dark:bg-black/10 border-t border-border flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#161922] bg-slate-200 dark:bg-white/5" />
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#161922] bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                            <UserCheck className="h-3 w-3" />
                        </div>
                    </div>
                    <p className="text-sm font-bold text-muted-foreground">
                        Total Audience: <span className="text-primary">{subscribers.length} subscribers</span>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
