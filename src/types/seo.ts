
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
    h1_title: 'Cinematic Ads that Drive Business Growth',
    paragraph: 'CineElite ADS is a premier video production house specializing in high-impact commercials, corporate storytelling, and digital ad campaigns that captivate audiences.',
    meta_title: 'CineElite ADS | Premium Video Production & Advertising Agency',
    meta_description: 'Award-winning video production agency specializing in TV commercials, social media ads, corporate brand films, and cinematic storytelling. We turn visions into cinematic reality.',
    meta_keywords: 'video production company, ad film agency, commercial video production, corporate videos, digital marketing ads, cinematic production house, brand storytelling',
    og_image: '',
    schema_type: 'ProfessionalService',
    canonical_url: '',
};
