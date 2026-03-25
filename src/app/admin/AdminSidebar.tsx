
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  Home, Settings, Mail, ShoppingBag, 
  Globe, User, MessageSquare, 
  Database, Activity, Users, Bell, 
  ChevronRight, ExternalLink, BookOpen, Archive,
  MousePointerClick
} from "lucide-react";
import { usePathname } from "next/navigation";

const adminNavLinks = [
    { group: "Overview", links: [
        { href: "/admin/dashboard", label: "Dashboard", icon: Home },
        { href: "/admin/user-activity", label: "Activity", icon: Activity },
        { href: "/admin/visitor-logs", label: "Visitors", icon: Users },
    ]},
    { group: "Communication", links: [
        { href: "/admin/notifications", label: "Announcements", icon: Bell },
        { href: "/admin/submissions", label: "Inbox", icon: Mail },
        { href: "/admin/marketing", label: "Subscribers", icon: Users },
        { href: "/admin/popups", label: "Popups", icon: MousePointerClick },
        { href: "/admin/testimonials", label: "Reviews", icon: MessageSquare },
    ]},
    { group: "Business", links: [
        { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
        { href: "/admin/seo-geo-settings", label: "SEO & Geo", icon: Globe },
    ]},
    { group: "System", links: [
        { href: "/admin/settings", label: "Configuration", icon: Settings },
        { href: "/admin/image-backup", label: "Media Backup", icon: Archive },
        { href: "/admin/database-tools", label: "Maintenance", icon: Database },
        { href: "/admin/deployment-guide", label: "Hosting Guide", icon: Globe },
        { href: "/admin/profile", label: "My Profile", icon: User },
    ]},
];

interface AdminSidebarProps {
  className?: string;
  onLinkClick?: () => void;
}

export default function AdminSidebar({ className, onLinkClick }: AdminSidebarProps) {
    const pathname = usePathname();

    return (
        <aside className={cn("bg-muted text-muted-foreground text-muted-foreground border-r border-border flex flex-col h-screen sticky top-0 shadow-sm", className)}>
            <div className="p-6 mb-2">
                <div className="flex items-center gap-3 px-2">
                    <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                        <Settings className="text-white h-5 w-5" />
                    </div>
                    <span className="font-black text-foreground tracking-tighter text-2xl uppercase italic">ADS<span className="text-primary">Admin</span></span>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
                {adminNavLinks.map((group, idx) => (
                    <div key={idx} className="mb-8">
                        <h3 className="px-4 text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground mb-4">
                            {group.group}
                        </h3>
                        <ul className="space-y-1.5">
                            {group.links.map((link) => {
                                const isActive = pathname.startsWith(link.href);
                                return (
                                    <li key={link.href}>
                                        <Link 
                                            href={link.href}
                                            onClick={onLinkClick}
                                            className={cn(
                                                "group flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-300 relative overflow-hidden",
                                                isActive 
                                                    ? "bg-primary/10 text-primary font-bold shadow-sm border border-primary/20"
                                                    : "hover:bg-muted hover:text-foreground text-muted-foreground hover:shadow-sm border border-transparent hover:border-border"                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <link.icon className={cn(
                                                    "h-5 w-5 transition-colors duration-300",
                                                    isActive ? "text-primary" : "text-slate-400 dark:text-slate-600 group-hover:text-primary"
                                                )} />
                                                <span className="text-sm tracking-tight">{link.label}</span>
                                            </div>
                                            {isActive && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="p-4 mt-auto border-t border-border space-y-2">
                <Link 
                    href="/docs" 
                    target="_blank"
                    className="flex items-center justify-between w-full p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors text-xs text-primary font-black shadow-sm border border-primary/20"
                >
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>Documentation</span>
                    </div>
                    <ExternalLink className="h-3 w-3" />
                </Link>
                <Link 
                    href="/" 
                    target="_blank"
                    className="flex items-center justify-between w-full p-3 rounded-xl bg-card hover:bg-muted transition-colors text-xs text-muted-foreground hover:text-foreground shadow-sm border border-border hover:border-border"
                >
                    <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        <span>View Website</span>
                    </div>
                    <ChevronRight className="h-3 w-3" />
                </Link>
            </div>
        </aside>
    )
}
