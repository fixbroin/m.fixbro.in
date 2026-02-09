"use client";

import Header from './Header';
import Footer from './Footer';
import { usePathname } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import PopupDisplayManager from '@/components/shared/PopupDisplayManager';
import GlobalAdminPopup from '@/components/chat/GlobalAdminPopup';
import ReviewSubmissionModal from '@/components/reviews/ReviewSubmissionModal';
import type { FirestoreBooking } from '@/types/firestore';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import BottomNavigationBar from './BottomNavigationBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import CookieConsentBanner from '@/components/shared/CookieConsentBanner';
import CompleteProfileDialog from '@/components/auth/CompleteProfileDialog';
import PwaInstallButton from '@/components/shared/PwaInstallButton';
import LocationPermissionDialog from '@/components/auth/LocationPermissionDialog';

const AppLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const pathname = usePathname();

  // ---------- ROUTE HELPERS (Single Source of Truth)

  const BOTTOM_NAV_PATHS = [
    '/', '/chat','/notifications','/my-bookings','/profile','/referral',
    '/checkout/schedule','/custom-service','/checkout/address',
    '/checkout/payment','/checkout/thank-you','/cart','/categories',
    '/my-address','/about-us','/contact-us','/terms-of-service',
    '/privacy-policy','/cancellation-policy','/account'
  ];

  const pathSegments = pathname.split('/').filter(Boolean);

  const isSimpleCategoryPage = pathname.startsWith('/category/');
  const isCityCategoryPage =
    pathSegments.length === 3 &&
    pathSegments[1] === 'category';

  const isAreaCategoryPage =
    pathSegments.length === 3 &&
    !isCityCategoryPage &&
    !['service','blog','admin','provider'].includes(pathSegments[1]);

  const isAnyCategoryPage =
    isSimpleCategoryPage ||
    isCityCategoryPage ||
    isAreaCategoryPage;

  // ---------- STATE

  const [isClientMounted, setIsClientMounted] = useState(false);
  const [showFooter, setShowFooter] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const lastScrollY = useRef(0);

  const { user, firestoreUser, isLoading: authIsLoading,
    isCompletingProfile,
    userCredentialForProfileCompletion,
    pendingSignUpDetails,
    completeProfileSetup,
    cancelProfileCompletion
  } = useAuth();

  const [pendingReviewBooking, setPendingReviewBooking] = useState<FirestoreBooking | null>(null);
  const [isReviewPopupOpen, setIsReviewPopupOpen] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [locationDialogInitialCenter, setLocationDialogInitialCenter] = useState<{lat:number,lng:number}|null>(null);

  const isMobile = useIsMobile();

  // ---------- USER ACTIVITY TRACKING

  const lastDbUpdateTimeRef = useRef<number>(Date.now());
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const THROTTLE_UPDATE_MS = 2 * 60 * 1000;
  const INACTIVITY_THRESHOLD_MS = 5 * 60 * 1000;

  const updateUserLastSeen = useCallback(async (useBeacon=false)=>{
    if(!user) return;

    try{
      if(useBeacon && navigator.sendBeacon){
        const payload = JSON.stringify({ uid:user.uid, ts:Date.now() });
        navigator.sendBeacon("/api/mark-last-seen", new Blob([payload],{type:"application/json"}));
        lastDbUpdateTimeRef.current = Date.now();
        return;
      }

      await updateDoc(doc(db,"users",user.uid),{
        lastLoginAt: serverTimestamp()
      });

      lastDbUpdateTimeRef.current = Date.now();
    }catch(e){
      console.error("lastSeen error:",e);
    }
  },[user]);

  const scheduleInactivityTimeout = useCallback(()=>{
    if(inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);

    inactivityTimeoutRef.current = setTimeout(()=>{
      updateUserLastSeen();
      inactivityTimeoutRef.current=null;
    },INACTIVITY_THRESHOLD_MS);
  },[updateUserLastSeen]);

  const resetInactivity = useCallback(()=>{
    if(Date.now() - lastDbUpdateTimeRef.current > THROTTLE_UPDATE_MS){
      updateUserLastSeen();
    }
    scheduleInactivityTimeout();
  },[scheduleInactivityTimeout,updateUserLastSeen]);

  useEffect(()=>{
    if(!user || typeof window==="undefined") return;

    const events:["mousemove","click","keydown","scroll","touchstart","touchmove"] =
      ["mousemove","click","keydown","scroll","touchstart","touchmove"];

    const onActivity = ()=> resetInactivity();

    const onVisibility=()=>{
      if(document.visibilityState==="visible") resetInactivity();
      else updateUserLastSeen(true);
    };

    events.forEach(e=>window.addEventListener(e,onActivity,{passive:true}));
    document.addEventListener("visibilitychange",onVisibility);
    window.addEventListener("pagehide",()=>updateUserLastSeen(true));
    window.addEventListener("beforeunload",()=>updateUserLastSeen(true));

    resetInactivity();

    return ()=>{
      events.forEach(e=>window.removeEventListener(e,onActivity));
      document.removeEventListener("visibilitychange",onVisibility);
      if(inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    };

  },[user,resetInactivity,updateUserLastSeen]);

  useEffect(() => {
  if (user) resetInactivity();
}, [pathname, user, resetInactivity]);


  // ---------- MOUNT

  useEffect(()=>{
    setIsClientMounted(true);
    const prevent=(e:MouseEvent)=>e.preventDefault();
    document.addEventListener('contextmenu',prevent);
    return ()=>document.removeEventListener('contextmenu',prevent);
  },[]);

  // ---------- HEADER SCROLL

  useEffect(()=>{
    const control=()=>{
      const y=window.scrollY;
      setIsHeaderVisible(y<lastScrollY.current || y<80);
      lastScrollY.current=y;
    };

    window.addEventListener('scroll',control,{passive:true});
    return ()=>window.removeEventListener('scroll',control);
  },[]);

  // ---------- FOOTER LOGIC

  useEffect(()=>{
    if(!isClientMounted) return;

    const isAdmin = pathname.startsWith('/admin');
    const isProvider = pathname.startsWith('/provider');
    const isAuth = pathname.startsWith('/auth/');
    const isCheckout = pathname.startsWith('/checkout');

    const showBottom =
      isMobile &&
      (BOTTOM_NAV_PATHS.includes(pathname) || isAnyCategoryPage);

    const hideFooter =
      showBottom ||
      isAnyCategoryPage ||
      pathname.startsWith('/service/') ||
      pathname.startsWith('/custom-service');

    setShowFooter(
      !isAdmin && !isProvider && !isAuth && !isCheckout && !hideFooter
    );

  },[pathname,isMobile,isClientMounted,isAnyCategoryPage]);

  // ---------- REVIEW FETCH

  const fetchPendingReview = useCallback(async ()=>{
    if(user && !authIsLoading && !pendingReviewBooking && !isReviewPopupOpen){
      const q=query(
        collection(db,"bookings"),
        where("userId","==",user.uid),
        where("status","==","Completed"),
        where("isReviewedByCustomer","==",false),
        limit(1)
      );
      const snap=await getDocs(q);
      if(!snap.empty){
        const b={id:snap.docs[0].id,...snap.docs[0].data()} as FirestoreBooking;
        setPendingReviewBooking(b);
        setIsReviewPopupOpen(true);
      }
    }
  },[user,authIsLoading,pendingReviewBooking,isReviewPopupOpen]);

  useEffect(()=>{
    if(isClientMounted && user && !authIsLoading){
      if(!pathname.startsWith('/auth/')
        && !pathname.startsWith('/admin/')
        && !pathname.startsWith('/provider/')
      ){
        fetchPendingReview();
      }
    }
    if(!user && !authIsLoading){
      setIsReviewPopupOpen(false);
      setPendingReviewBooking(null);
    }
  },[user,authIsLoading,isClientMounted,pathname,fetchPendingReview]);

  // ---------- LOCATION

  const handleLocationClick = useCallback(()=>{
    if(firestoreUser?.latitude!=null && firestoreUser?.longitude!=null){
      setLocationDialogInitialCenter({
        lat:firestoreUser.latitude,
        lng:firestoreUser.longitude
      });
    }else{
      setLocationDialogInitialCenter(null);
    }
    setIsLocationDialogOpen(true);
  },[firestoreUser]);

  useEffect(()=>{
    if(
      user &&
      firestoreUser &&
      !isCompletingProfile &&
      (firestoreUser.latitude==null || firestoreUser.longitude==null)
    ){
      const excluded=['/admin','/provider','/auth','/checkout','/my-address','/profile'];
      if(!excluded.some(p=>pathname.startsWith(p))){
        handleLocationClick();
      }
    }
  },[user,firestoreUser,pathname,isCompletingProfile,handleLocationClick]);

  const shouldShowBottomNav =
    isClientMounted &&
    isMobile &&
    (BOTTOM_NAV_PATHS.includes(pathname) || isAnyCategoryPage);

  const currentIsHomePage = pathname === '/';

  const shouldShowHeader =
    isClientMounted &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/provider') &&
    !pathname.startsWith('/auth/');

  const shouldShowNewsletter =
    isClientMounted &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/provider') &&
    currentIsHomePage;

  const shouldShowAdminPopup =
    isClientMounted &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/provider');

  const shouldShowPwaButton =
    isClientMounted &&
    !pathname.includes('/category/');

  // ---------- RENDER

  return (
    <div className="flex flex-col min-h-screen">

      {shouldShowHeader && (
        <div className={cn(
          "sticky top-0 z-50 transition-transform duration-300",
          isHeaderVisible ? "translate-y-0" : "-translate-y-full"
        )}>
          <Header onLocationClick={handleLocationClick}/>
        </div>
      )}

      <main className={cn("flex-grow",{ "pb-16":shouldShowBottomNav })}>
        {children}
      </main>

      {showFooter && <Footer/>}
      {shouldShowBottomNav && <BottomNavigationBar/>}
      {shouldShowNewsletter && <PopupDisplayManager/>}
      {shouldShowAdminPopup && <GlobalAdminPopup/>}

      {isClientMounted && pendingReviewBooking && (
        <ReviewSubmissionModal
          booking={pendingReviewBooking}
          isOpen={isReviewPopupOpen}
          onReviewSubmitted={()=>{ setIsReviewPopupOpen(false); setPendingReviewBooking(null); fetchPendingReview(); }}
        />
      )}

      {isClientMounted && userCredentialForProfileCompletion && (
        <CompleteProfileDialog
          isOpen={isCompletingProfile}
          userCredential={userCredentialForProfileCompletion}
          pendingDetails={pendingSignUpDetails}
          onSubmit={completeProfileSetup}
          onClose={cancelProfileCompletion}
        />
      )}

      {isClientMounted && isLocationDialogOpen && (
        <LocationPermissionDialog
          isOpen={isLocationDialogOpen}
          onLocationSet={()=>setIsLocationDialogOpen(false)}
          initialCenter={locationDialogInitialCenter}
        />
      )}

      {isClientMounted && <CookieConsentBanner/>}
      {shouldShowPwaButton && <PwaInstallButton/>}

    </div>
  );
};

export default AppLayout;
