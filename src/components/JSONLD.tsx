
import { PageSeoContent } from "@/types/seo";
import { GeneralSettings } from "@/app/admin/settings/actions/general-actions";

interface JSONLDProps {
    seoData: PageSeoContent;
    settings: GeneralSettings;
    pathname: string;
}

export default function JSONLD({ seoData, settings, pathname }: JSONLDProps) {
    const host = typeof window !== 'undefined' ? window.location.origin : 'https://cineelite.com';
    const fullUrl = `${host}${pathname === '/' ? '' : pathname}`;
    
    const baseSchema: any = {
        "@context": "https://schema.org",
        "@type": seoData.schema_type || "ProfessionalService",
        "name": settings.website_name,
        "url": host,
        "logo": settings.logo || `${host}/android-chrome-192x192.png`,
        "description": seoData.meta_description,
        "areaServed": "Worldwide",
        "serviceType": "Video Production & Advertising",
        "sameAs": [
            settings.facebook_url,
            settings.instagram_url,
            settings.twitter_url,
            settings.linkedin_url,
            settings.youtube_url
        ].filter(Boolean)
    };

    if (seoData.schema_type === 'LocalBusiness' || seoData.schema_type === 'ProfessionalService') {
        baseSchema.address = {
            "@type": "PostalAddress",
            "addressLocality": "Bangalore",
            "addressRegion": "KA",
            "addressCountry": "IN"
        };
        baseSchema.image = settings.logo || `${host}/android-chrome-192x192.png`;
    }

    if (seoData.schema_type === 'WebSite') {
        delete baseSchema.logo;
        baseSchema.potentialAction = {
            "@type": "SearchAction",
            "target": `${host}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string"
        };
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(baseSchema) }}
        />
    );
}
