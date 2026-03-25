
import { PageSeoContent } from "@/types/seo";
import { GeneralSettings } from "@/app/admin/settings/actions/general-actions";
import { ContactDetails } from "@/app/admin/settings/actions/contact-actions";
import { WEBSITE_URL } from "@/lib/config";

interface JSONLDProps {
    seoData: PageSeoContent;
    settings: GeneralSettings;
    contactInfo?: ContactDetails;
    pathname: string;
}

export default function JSONLD({ seoData, settings, contactInfo, pathname }: JSONLDProps) {
    const host = WEBSITE_URL;
    const appName = settings.website_name || "FixBro Interiors";
    const logoUrl = settings.logo || `${host}/android-chrome-192x192.png`;
    
    // 1. Organization Schema
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${host}/#organization`,
        "name": appName,
        "url": host,
        "logo": {
            "@type": "ImageObject",
            "url": logoUrl
        },
        "sameAs": [
            settings.facebook_url,
            settings.instagram_url,
            settings.twitter_url,
            settings.linkedin_url,
            settings.youtube_url
        ].filter(Boolean)
    };

    // 2. WebSite Schema
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${host}/#website`,
        "url": host,
        "name": appName,
        "publisher": { "@id": `${host}/#organization` },
        "potentialAction": {
            "@type": "SearchAction",
            "target": `${host}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string"
        }
    };

    // 3. Breadcrumb Schema
    const pathParts = pathname.split('/').filter(Boolean);
    const breadcrumbList = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "item": {
                    "@id": host,
                    "name": "Home"
                }
            },
            ...pathParts.map((part, index) => ({
                "@type": "ListItem",
                "position": index + 2,
                "item": {
                    "@id": `${host}/${pathParts.slice(0, index + 1).join('/')}`,
                    "name": part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ')
                }
            }))
        ]
    };

    // 4. Page Specific Schema (ProfessionalService / LocalBusiness / etc)
    const pageSchema: any = {
        "@context": "https://schema.org",
        "@type": seoData.schema_type || "ProfessionalService",
        "@id": `${host}${pathname}#primary`,
        "name": seoData.h1_title || appName,
        "description": seoData.meta_description,
        "url": `${host}${pathname}`,
        "image": logoUrl,
    };

    if (seoData.schema_type === 'LocalBusiness' || seoData.schema_type === 'ProfessionalService') {
        pageSchema.address = {
            "@type": "PostalAddress",
            "streetAddress": contactInfo?.location || "Bengaluru",
            "addressLocality": "Bangalore",
            "addressRegion": "KA",
            "postalCode": "560001",
            "addressCountry": "IN"
        };
        pageSchema.telephone = contactInfo?.phone;
        pageSchema.priceRange = "₹₹";
        pageSchema.areaServed = "India";
    }

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
        </>
    );
}
