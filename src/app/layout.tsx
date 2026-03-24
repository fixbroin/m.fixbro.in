
import type { Metadata, Viewport } from 'next';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingActionButtons from '@/components/FloatingActionButtons';
import './globals.css';
import Script from 'next/script';
import { getGeneralSettings } from './admin/settings/actions/general-actions';
import { getSeoData } from './admin/seo-geo-settings/actions';
import { ThemeProvider } from '@/components/ThemeProvider';
import { getThemeSettings } from './admin/settings/actions/theme-actions';
import { DEFAULT_DARK_THEME_COLORS_HSL, DEFAULT_LIGHT_THEME_COLORS_HSL } from '@/lib/colorUtils';
import { getVantaSettings } from './admin/settings/actions/vanta-actions';
import { getMarketingSettings } from './admin/marketing/actions';
import { headers, cookies } from 'next/headers';
import { LoadingProvider } from '@/context/LoadingContext';
import GlobalLoader from '@/components/GlobalLoader';
import { AnalyticsProvider } from '@/context/AnalyticsContext';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import { cn } from '@/lib/utils';

// export const revalidate = 86400;

import JSONLD from '@/components/JSONLD';

// Use generateMetadata for dynamic metadata
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '/';
  const host = headersList.get('host') || 'cineelite.com';
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const fullBaseUrl = `${protocol}://${host}`;
  
  // Extract slug from pathname (e.g., /services -> services, / -> home)
  let pageSlug = pathname.split('/').filter(Boolean)[0] || 'home';
  if (pathname.startsWith('/admin')) pageSlug = 'home'; // Admin pages use home SEO by default

  const settings = await getGeneralSettings();
  const seoData = await getSeoData(pageSlug);
  
  const appName = settings?.website_name || 'CineElite ADS';
  const ogImage = seoData?.og_image || settings?.logo || `${fullBaseUrl}/android-chrome-192x192.png`;
  const canonical = seoData?.canonical_url || `${fullBaseUrl}${pathname === '/' ? '' : pathname}`;

  return {
    metadataBase: new URL(fullBaseUrl),
    title: {
      default: seoData.meta_title,
      template: `%s | ${appName}`,
    },
    description: seoData.meta_description,
    keywords: seoData.meta_keywords,
    manifest: '/manifest.json',
    alternates: {
      canonical: canonical,
    },
    openGraph: {
      title: seoData.meta_title,
      description: seoData.meta_description,
      url: canonical,
      siteName: appName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoData.meta_title,
      description: seoData.meta_description,
      images: [ogImage],
    },
    icons: {
      icon: settings?.favicon || '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: appName,
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

function stripScriptTags(html: string): string {
    if (!html) return '';
    return html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '$1');
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isAdminPage = pathname.startsWith('/admin');

  const settings = await getGeneralSettings();
  const themeSettings = await getThemeSettings();
  const vantaSettings = await getVantaSettings();
  
  console.log('🎨 Theme Settings Fetched:', themeSettings ? 'Yes' : 'No');
  
  // Extract slug from pathname (e.g., /services -> services, / -> home)
  let pageSlug = pathname.split('/').filter(Boolean)[0] || 'home';
  if (pathname.startsWith('/admin')) pageSlug = 'home';
  const seoData = await getSeoData(pageSlug);

  // Only fetch marketing settings for non-admin pages
  const marketingSettings = isAdminPage ? null : await getMarketingSettings();

  // themeSettings IS already the themeColors object (light/dark palettes)
  const themeColors = themeSettings || {
    light: DEFAULT_LIGHT_THEME_COLORS_HSL,
    dark: DEFAULT_DARK_THEME_COLORS_HSL
  };

  const generateCssVariables = (palette: any) => {
    return Object.entries(palette)
      .map(([key, value]) => value ? `--${key}: ${value};` : '')
      .join('\n');
  };
  
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value || 'light';

  const cssVariables = `
    :root {
      ${generateCssVariables(themeColors.light)}
    }
    .dark {
      ${generateCssVariables(themeColors.dark)}
    }
  `;

  return (
    <html lang="en" className={cn("scroll-smooth", theme)} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        {vantaSettings.globalEnable && (
           <>
            <Script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js" strategy="afterInteractive" />
            <Script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.waves.min.js" strategy="afterInteractive" />
            <Script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.birds.min.js" strategy="afterInteractive" />
            <Script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.cells.min.js" strategy="afterInteractive" />
            <Script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.clouds.min.js" strategy="afterInteractive" />
            <Script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.dots.min.js" strategy="afterInteractive" />
            <Script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.fog.min.js" strategy="afterInteractive" />
            <Script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.globe.min.js" strategy="afterInteractive" />
            <Script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js" strategy="afterInteractive" />
            <Script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.rings.min.js" strategy="afterInteractive" />
            <Script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.trunk.min.js" strategy="afterInteractive" />
           </>
        )}
        <style dangerouslySetInnerHTML={{ __html: cssVariables }} />

        <JSONLD seoData={seoData} settings={settings} pathname={pathname} />

        {/* Marketing Scripts Injection */}
        {marketingSettings?.googleTagManagerId?.enabled && marketingSettings.googleTagManagerId.value && (
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${marketingSettings.googleTagManagerId.value}');
            `}
          </Script>
        )}
        {marketingSettings?.googleAnalyticsId?.enabled && marketingSettings.googleAnalyticsId.value && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${marketingSettings.googleAnalyticsId.value}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${marketingSettings.googleAnalyticsId.value}');
              `}
            </Script>
          </>
        )}
        {marketingSettings?.metaPixelId?.enabled && marketingSettings.metaPixelId.value && (
            <Script id="meta-pixel" strategy="afterInteractive">
                {`
                    !function(f,b,e,v,n,t,s)
                    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                    'https://connect.facebook.net/en_US/fbevents.js');
                    fbq('init', '${marketingSettings.metaPixelId.value}');
                    fbq('track', 'PageView');
                `}
            </Script>
        )}
        {marketingSettings?.microsoftClarityId?.enabled && marketingSettings.microsoftClarityId.value && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${marketingSettings.microsoftClarityId.value}");
            `}
          </Script>
        )}
        {marketingSettings?.customHeadScript?.enabled && marketingSettings.customHeadScript.value && (
            <Script id="custom-head-script" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: stripScriptTags(marketingSettings.customHeadScript.value) }} />
        )}
      </head>
      <body className="font-body antialiased transition-colors duration-300">
        {/* Noscript tags for GTM and Meta Pixel */}
        {marketingSettings?.googleTagManagerId?.enabled && marketingSettings.googleTagManagerId.value && (
          <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${marketingSettings.googleTagManagerId.value}`}
          height="0" width="0" style={{display:'none',visibility:'hidden'}}></iframe></noscript>
        )}
        {marketingSettings?.metaPixelId?.enabled && marketingSettings.metaPixelId.value && (
          <noscript><img height="1" width="1" style={{display:'none'}}
          src={`https://www.facebook.com/tr?id=${marketingSettings.metaPixelId.value}&ev=PageView&noscript=1`}
          /></noscript>
        )}

        <LoadingProvider>
          <AnalyticsProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              <AnalyticsTracker />
              <GlobalLoader />
              <Header settings={settings} />
              <main>{children}</main>
              <Footer settings={settings} />
              <FloatingActionButtons />
              <Toaster />
            </ThemeProvider>
          </AnalyticsProvider>
        </LoadingProvider>
        
        {/* Body End Scripts */}
        {marketingSettings?.customBodyScript?.enabled && marketingSettings.customBodyScript.value && (
            <Script id="custom-body-script" strategy="lazyOnload" dangerouslySetInnerHTML={{ __html: stripScriptTags(marketingSettings.customBodyScript.value) }} />
        )}
      </body>
    </html>
  );
}
