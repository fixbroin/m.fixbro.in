"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import AdminLayoutContent from './AdminLayoutContent';
import { getSession } from './login/auth-actions';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

function FullScreenLoader() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-md p-6 space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            </div>
        </div>
    );
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<any>(null);

  const checkAuth = useCallback(async () => {
    try {
      const session = await getSession();
      if (session) {
        setUser(session);
        setAuthStatus('authenticated');
      } else {
        setUser(null);
        setAuthStatus('unauthenticated');
      }
    } catch (error) {
      console.error("Auth Check Error:", error);
      setAuthStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth, pathname]); // Re-check on path change

  useEffect(() => {
    if (authStatus === "loading") return;

    if (authStatus === 'unauthenticated' && pathname !== "/admin/login") {
        router.replace("/admin/login");
        return;
    }

    if (authStatus === 'authenticated' && pathname === "/admin/login") {
        router.replace("/admin/dashboard");
    }
  }, [authStatus, pathname, router]);


  if (authStatus === 'loading') {
    return <FullScreenLoader />;
  }

  if (authStatus === 'authenticated' && user) {
    if (pathname === '/admin/login') {
        return <FullScreenLoader />;
    }
    return <AdminLayoutContent user={user}>{children}</AdminLayoutContent>;
  }
  
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return <FullScreenLoader />;
}
