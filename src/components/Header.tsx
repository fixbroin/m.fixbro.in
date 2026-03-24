
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

  const NavLink = ({ href, label }: { href: string, label: string }) => {
    const isActive = pathname === href;
    return (
      <LoadingLink
        href={href}
        onClick={() => setIsOpen(false)}
        className={cn(
          "relative py-2 text-sm font-black uppercase tracking-widest transition-all hover:text-primary group",
          isActive ? "text-primary" : "text-slate-600 dark:text-white"
        )}
      >
        {label}
        <span className={cn(
            "absolute bottom-0 left-0 w-full h-0.5 bg-primary transform origin-left transition-transform duration-300",
            isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        )} />
      </LoadingLink>
    );
  };

  return (
    <header className={cn(
  "sticky top-0 z-50 w-full transition-all duration-300 border-b",
  "bg-background/80 backdrop-blur-xl border-border",
  scrolled ? "h-14 shadow-sm" : "h-16"
)}>
      <div className="container h-full flex items-center justify-between md:px-8">
        <Logo appName={settings?.website_name} logoUrl={settings?.logo} />
        
        <nav className="hidden items-center space-x-10 lg:flex">
          {navLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          
          <Button asChild className="hidden md:flex h-11 px-6 rounded-full font-black text-xs uppercase tracking-widest group shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <LoadingLink href="/contact">
                Start Project
                <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
            </LoadingLink>
          </Button>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-xl border-border bg-card/50 hover:bg-muted transition-all shadow-sm h-10 w-10"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full p-0 bg-background border-none shadow-2xl">
              <SheetHeader className="p-6 flex flex-row items-center justify-between border-b border-border">
                <Logo appName={settings?.website_name} logoUrl={settings?.logo} />
                <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col h-[calc(100vh-80px)] overflow-y-auto">
                <nav className="flex flex-col space-y-2 p-6">
                  {navLinks.map((link, index) => (
                    <LoadingLink
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                            "group flex items-center justify-between p-4 rounded-2xl transition-all duration-300 active:bg-primary/5",
                            pathname === link.href ? "bg-primary/10 text-primary" : "text-slate-900 dark:text-white"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <span className="text-2xl font-black uppercase tracking-tight">{link.label}</span>
                        <ArrowRight className={cn(
                            "h-6 w-6 transition-all duration-300",
                            pathname === link.href ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0"
                        )} />
                    </LoadingLink>
                  ))}
                </nav>
                
                <div className="mt-auto p-8 space-y-6">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
                    
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/40 px-2 text-center">Ready to grow your brand?</p>
                        <Button asChild size="lg" className="w-full h-16 rounded-2xl font-black text-lg shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => setIsOpen(false)}>
                            <LoadingLink href="/contact">
                                Start Your Project
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </LoadingLink>
                        </Button>
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
