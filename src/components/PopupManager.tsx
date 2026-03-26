'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Play } from "lucide-react";
import { getActivePopups, submitPopupLead } from "@/app/admin/popups/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function PopupManager() {
    const pathname = usePathname();
    const { toast } = useToast();
    const [popups, setPopups] = useState<any[]>([]);
    const [activePopup, setActivePopup] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasShownThisLoad, setHasShownThisLoad] = useState(false);
    const [leadForm, setLeadForm] = useState({
        name: '',
        email: '',
        phone: ''
    });

    // Don't show on admin pages
    const isAdmin = pathname?.startsWith('/admin');

    const fetchPopups = useCallback(async () => {
        if (isAdmin) return;
        const activePopups = await getActivePopups();
        setPopups(activePopups);
    }, [isAdmin]);

    useEffect(() => {
        fetchPopups();
    }, [fetchPopups]);

    const showPopup = useCallback((popup: any) => {
        // Prevent showing multiple popups in one page load if already shown
        if (hasShownThisLoad) return;

        const isExit = popup.trigger_type === 'exit';

        // Standard checks for non-exit popups
        if (!isExit) {
            // Check session storage
            if (sessionStorage.getItem('popup_shown_session') && popup.frequency !== 'always') return;

            // Check frequency in local storage
            const storageKey = `popup_shown_${popup.id}`;
            const lastShown = localStorage.getItem(storageKey);
            const now = new Date().getTime();

            if (popup.frequency === 'once' && lastShown) return;
            if (popup.frequency === 'daily' && lastShown) {
                const oneDay = 24 * 60 * 60 * 1000;
                if (now - parseInt(lastShown) < oneDay) return;
            }
        }

        // Check device (Applies to all)
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (popup.devices === 'mobile' && !isMobile) return;
        if (popup.devices === 'desktop' && isMobile) return;

        // Check page targeting (Applies to all)
        const targetPages = typeof popup.pages === 'string' ? JSON.parse(popup.pages) : (popup.pages || ['all']);
        const currentSlug = pathname === '/' ? 'home' : pathname.replace(/^\//, '');
        
        const isTargetPage = targetPages.includes('all') || targetPages.includes(currentSlug);
        if (!isTargetPage) return;

        // Show it!
        setActivePopup(popup);
        setIsOpen(true);
        setHasShownThisLoad(true);
        
        // Only mark session as shown for non-exit popups to not interfere with exit intent
        if (!isExit) {
            sessionStorage.setItem('popup_shown_session', 'true');
            localStorage.setItem(`popup_shown_${popup.id}`, new Date().getTime().toString());
        }
    }, [pathname, hasShownThisLoad]);

    useEffect(() => {
        if (isAdmin || popups.length === 0 || isOpen || hasShownThisLoad) return;

        const handlers: any[] = [];

        popups.forEach(popup => {
            if (popup.trigger_type === 'on_load') {
                showPopup(popup);
            } else if (popup.trigger_type === 'delay') {
                const timer = setTimeout(() => showPopup(popup), (popup.trigger_value || 0) * 1000);
                handlers.push({ type: 'timer', value: timer });
            } else if (popup.trigger_type === 'scroll') {
                const handleScroll = () => {
                    const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                    if (scrollPercent >= (popup.trigger_value || 50)) {
                        showPopup(popup);
                        window.removeEventListener('scroll', handleScroll);
                    }
                };
                window.addEventListener('scroll', handleScroll);
                handlers.push({ type: 'scroll', value: handleScroll });
            } else if (popup.trigger_type === 'exit') {
                // Desktop Exit Intent
                const handleExit = (e: MouseEvent) => {
                    if (e.clientY <= 0) {
                        showPopup(popup);
                    }
                };
                document.addEventListener('mouseleave', handleExit);
                handlers.push({ type: 'exit', value: handleExit });

                // Mobile Exit Intent (Visibility API)
                const handleVisibilityChange = () => {
                    if (document.visibilityState === 'hidden') {
                        showPopup(popup);
                    }
                };
                document.addEventListener('visibilitychange', handleVisibilityChange);
                handlers.push({ type: 'visibility', value: handleVisibilityChange });

                // Mobile Exit Intent (Back Button)
                window.history.pushState({ popup: true }, '', window.location.href);
                const handlePopState = () => {
                    showPopup(popup);
                };
                window.addEventListener('popstate', handlePopState);
                handlers.push({ type: 'popstate', value: handlePopState });
            }
        });

        return () => {
            handlers.forEach(h => {
                if (h.type === 'timer') clearTimeout(h.value);
                if (h.type === 'scroll') window.removeEventListener('scroll', h.value);
                if (h.type === 'exit') document.removeEventListener('mouseleave', h.value);
                if (h.type === 'visibility') document.removeEventListener('visibilitychange', h.value);
                if (h.type === 'popstate') window.removeEventListener('popstate', h.value);
            });
        };
    }, [popups, isAdmin, isOpen, hasShownThisLoad, showPopup]);

    const handleLeadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const res = await submitPopupLead({
            popup_id: activePopup.id,
            ...leadForm,
            page_url: window.location.href
        });

        if (res.success) {
            toast({
                title: "Thank you!",
                description: "Your information has been received.",
            });
            // If there's a CTA link, redirect or just close
            if (activePopup.cta_link && !activePopup.cta_text) {
                window.location.href = activePopup.cta_link;
            } else {
                setIsOpen(false);
            }
        } else {
            toast({
                title: "Error",
                description: "Failed to submit. Please try again.",
                variant: "destructive"
            });
        }
        setIsSubmitting(false);
    };

    if (isAdmin || !activePopup) return null;

    const formFields = typeof activePopup.form_fields === 'string' 
        ? JSON.parse(activePopup.form_fields) 
        : (activePopup.form_fields || {});

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className={cn(
                "p-0 border-none shadow-2xl rounded-2xl overflow-hidden transition-all duration-500",
                activePopup.media_type !== 'none' ? "sm:max-w-[850px]" : "sm:max-w-md"
            )}>
                <div className="relative overflow-y-auto flex-1 custom-scrollbar flex flex-col sm:flex-row">
                    {activePopup.media_type !== 'none' && (
                        <div className="w-full sm:w-1/2 bg-muted flex-shrink-0 relative overflow-hidden flex flex-col justify-center">
                            {activePopup.media_type === 'image' && activePopup.media_url && (
                                <div className="w-full aspect-square">
                                    <img 
                                        src={activePopup.media_url} 
                                        alt={activePopup.title} 
                                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                    />
                                </div>
                            )}

                            {activePopup.media_type === 'video' && activePopup.media_url && (
                                <div className="w-full h-full aspect-video sm:aspect-auto sm:min-h-[400px] bg-black">
                                    <video 
                                        src={activePopup.media_url} 
                                        autoPlay 
                                        muted 
                                        loop 
                                        playsInline
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div className={cn(
                        "p-6 sm:p-10 space-y-4 bg-card flex flex-col justify-center",
                        activePopup.media_type !== 'none' ? "w-full sm:w-1/2" : "w-full"
                    )}>
                        <div className="space-y-1">
                            <DialogTitle className="text-xl sm:text-3xl font-black tracking-tight text-foreground leading-tight">
                                {activePopup.title}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground text-xs sm:text-base leading-relaxed">
                                {activePopup.description}
                            </DialogDescription>
                        </div>

                        {activePopup.show_form ? (
                            <form onSubmit={handleLeadSubmit} className="space-y-3 pt-1">
                                <div className="grid grid-cols-1 gap-3">
                                    {formFields.name && (
                                        <div className="space-y-1">
                                            <Label htmlFor="lead-name" className="text-[10px] font-bold uppercase tracking-wider text-primary ml-1">Name</Label>
                                            <Input 
                                                id="lead-name" 
                                                placeholder="Your Name" 
                                                value={leadForm.name}
                                                onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                                                required 
                                                className="bg-muted/50 border-none focus-visible:ring-primary h-10 rounded-xl text-sm"
                                            />
                                        </div>
                                    )}
                                    {formFields.email && (
                                        <div className="space-y-1">
                                            <Label htmlFor="lead-email" className="text-[10px] font-bold uppercase tracking-wider text-primary ml-1">Email</Label>
                                            <Input 
                                                id="lead-email" 
                                                type="email" 
                                                placeholder="your@email.com" 
                                                value={leadForm.email}
                                                onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                                                required 
                                                className="bg-muted/50 border-none focus-visible:ring-primary h-10 rounded-xl text-sm"
                                            />
                                        </div>
                                    )}
                                    {formFields.phone && (
                                        <div className="space-y-1">
                                            <Label htmlFor="lead-phone" className="text-[10px] font-bold uppercase tracking-wider text-primary ml-1">Phone</Label>
                                            <Input 
                                                id="lead-phone" 
                                                type="tel" 
                                                placeholder="+91 00000 00000" 
                                                value={leadForm.phone}
                                                onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                                                required 
                                                className="bg-muted/50 border-none focus-visible:ring-primary h-10 rounded-xl text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                <Button 
                                    type="submit" 
                                    className="w-full h-11 text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 mt-2"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Processing...' : (activePopup.cta_text || 'Submit')}
                                </Button>
                            </form>
                        ) : (
                            activePopup.cta_text && activePopup.cta_link && (
                                <Button 
                                    asChild
                                    className="w-full h-11 text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                                >
                                    <a href={activePopup.cta_link} onClick={() => setIsOpen(false)}>
                                        {activePopup.cta_text}
                                    </a>
                                </Button>
                            )
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
