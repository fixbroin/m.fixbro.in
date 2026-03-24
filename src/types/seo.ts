
export interface PageSeoContent {
    h1_title: string;
    paragraph: string;
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    og_image?: string;
    schema_type?: 'Organization' | 'LocalBusiness' | 'ProfessionalService' | 'WebSite';
    canonical_url?: string;
}

export const defaultSeoSettings: PageSeoContent = {
    h1_title: 'Exquisite Interiors that Elevate Your Lifestyle',
    paragraph: 'FixBro Interiors is a premier interior design firm specializing in high-impact residential and commercial spaces, home renovations, and bespoke decor that captivates.',
    meta_title: 'FixBro Interiors | Premium Interior Design & Home Renovation',
    meta_description: 'Award-winning interior design agency specializing in luxury residential, commercial, and bespoke renovations. We turn your dream spaces into reality.',
    meta_keywords: 'interior design, home renovation, residential design, commercial interiors, luxury decor, modern architecture, bespoke furniture, space planning',
    og_image: '',
    schema_type: 'ProfessionalService',
    canonical_url: '',
};
