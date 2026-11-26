
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "./ThemeSwitcher";
import LoadingLink from "./LoadingLink";
import type { GeneralSettings } from "@/app/admin/settings/actions/general-actions";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function HeaderContent({ settings }: { settings?: GeneralSettings | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background border-border h-16 opacity-0">
            <div className="container h-full flex items-center justify-between" />
        </header>
    );
  }

  const isHome = pathname === "/";
  const isTransparent = isHome && !scrolled;

  const NavLink = ({ href, label }: { href: string, label: string }) => {
    const isActive = pathname === href;
    return (
      <LoadingLink
        href={href}
        onClick={() => setIsOpen(false)}
        className={cn(
          "relative py-2 text-sm font-medium tracking-wide transition-all group",
          isTransparent
            ? isActive ? "text-white font-semibold" : "text-white/85 hover:text-white"
            : isActive ? "text-primary font-semibold" : "text-foreground/75 hover:text-primary"
        )}
      >
        {label}
        <span className={cn(
            "absolute bottom-0 left-0 w-full h-0.5 transform origin-left transition-transform duration-300",
            isTransparent ? "bg-white" : "bg-primary",
            isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        )} />
      </LoadingLink>
    );
  };

  return (
    <header className={cn(
      "z-50 w-full transition-all duration-300",
      isHome ? "fixed inset-x-0 top-0" : "sticky top-0",
      isTransparent
        ? "bg-transparent border-transparent h-20"
        : "bg-background/65 backdrop-blur-2xl border-b border-white/25 dark:border-white/10 h-16 shadow-sm"
    )}>
      <div className="container h-full flex items-center justify-between md:px-8">
        <div className={cn(isTransparent && "[&_span]:text-white")}>
          <Logo appName={settings?.website_name} logoUrl={settings?.logo} />
        </div>
        
        <nav className="hidden items-center space-x-8 lg:flex">
          {navLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className={cn(isTransparent && "text-white [&_button]:border-white/25 [&_button]:bg-white/10 [&_button]:text-white [&_button:hover]:bg-white/20")}>
            <ThemeSwitcher />
          </div>
          
          <Button asChild className="hidden md:flex h-10 px-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm group shadow-lg transition-all hover:scale-105 active:scale-95">
            <LoadingLink href={settings?.header_cta_link || "/contact"}>
                {settings?.header_cta_text || "Get free quote"}
                <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </LoadingLink>
          </Button>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button 
                variant="outline" 
                size="icon" 
                className={cn(
                  "rounded-full transition-all shadow-sm h-10 w-10 backdrop-blur-xl",
                  isTransparent
                    ? "border-white/30 bg-white/15 text-white hover:bg-white/25"
                    : "border-white/30 dark:border-white/15 bg-card/60 hover:bg-card/80"
                )}
              >
                <span className="flex flex-col items-center justify-center gap-1.5" aria-hidden="true">
                  <span className="w-4 h-[1.6px] bg-current rounded-full" />
                  <span className="w-4 h-[1.6px] bg-current rounded-full" />
                </span>
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full p-0 bg-white/90 dark:bg-[#0b181f]/90 backdrop-blur-2xl border-l border-black/10 dark:border-white/15 shadow-2xl text-slate-900 dark:text-white">
              <SheetHeader className="p-6 flex flex-row items-center justify-between border-b border-black/10 dark:border-white/15 bg-white/40 dark:bg-white/5">
                <Logo appName={settings?.website_name} logoUrl={settings?.logo} />
                <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col h-[calc(100vh-100px)]">
                <div className="flex-grow overflow-y-auto custom-scrollbar pb-20">
                    <nav className="flex flex-col space-y-1.5 p-4">
                    {navLinks.map((link, index) => (
                        <LoadingLink
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                                "group flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 animate-mobile-menu-item",
                                pathname === link.href
                                  ? "bg-primary/15 text-primary shadow-sm"
                                  : "text-slate-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
                            )}
                            style={{ animationDelay: `${index * 40}ms` }}
                        >
                            <span className="text-xl font-bold uppercase tracking-tight">{link.label}</span>
                            <ArrowRight className={cn(
                                "h-5 w-5 transition-all duration-300",
                                pathname === link.href ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0"
                            )} />
                        </LoadingLink>
                    ))}
                    </nav>
                    
                    <div className="p-6 space-y-4">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300 dark:via-white/20 to-transparent" />
                        
                        <div className="space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-white/70 px-2 text-center text-balance">Start Your Interior Project</p>
                            <Button asChild size="lg" className="w-full h-14 rounded-xl font-black text-base shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all" onClick={() => setIsOpen(false)}>
                                <LoadingLink href={settings?.header_cta_link || "/contact"}>
                                    {settings?.header_cta_text || "Start Your Project"}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </LoadingLink>
                            </Button>
                        </div>
                    </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export default function Header({ appName, settings }: { appName?: string, settings?: GeneralSettings | null }) {
    const pathname = usePathname();
    if (pathname.startsWith('/admin')) {
        return null;
    }
    return <HeaderContent settings={settings} />;
}
