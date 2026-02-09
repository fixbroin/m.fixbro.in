
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FirestoreSEOSettings } from '@/types/firestore';

// Define default SEO values that match the structure of FirestoreSEOSettings
export const defaultSeoValues: FirestoreSEOSettings = {
  siteName: 'Fixbro',
  defaultMetaTitleSuffix: ' - Fixbro',
  defaultMetaDescription: 'Find and connect with local, verified home service professionals for all your needs. Search for plumbers, electricians, and more.',
  defaultMetaKeywords: 'home services, local professionals, find experts, repair, cleaning, plumbing, electrical',
  homepageMetaTitle: 'Fixbro - Find & Connect with Local Home Service Experts',
  homepageMetaDescription: 'Find and connect directly with trusted local home service professionals. Search for electricians, plumbers, carpenters, and more in your area.',
  homepageMetaKeywords: 'local professionals, home services, find experts, repair services, maintenance',
  homepageH1: 'Connect with Trusted Home Service Professionals',
  categoryPageTitlePattern: '{{categoryName}} Professionals | Find Local Experts on Fixbro',
  categoryPageDescriptionPattern: 'Find and connect with the best {{categoryName}} professionals in your area. Browse profiles, ratings, and connect directly.',
  categoryPageKeywordsPattern: '{{categoryName}}, find {{categoryName}} experts, local {{categoryName}} services',
  categoryPageH1Pattern: '{{categoryName}} Professionals',
  cityCategoryPageTitlePattern: '{{categoryName}} Professionals in {{cityName}} | Fixbro',
  cityCategoryPageDescriptionPattern: 'Find local {{categoryName}} experts in {{cityName}}. Connect directly with verified professionals on Fixbro.',
  cityCategoryPageKeywordsPattern: '{{categoryName}} {{cityName}}, {{cityName}} {{categoryName}} professionals, find experts in {{cityName}}',
  cityCategoryPageH1Pattern: '{{categoryName}} Professionals in {{cityName}}',
  areaCategoryPageTitlePattern: '{{categoryName}} in {{areaName}}, {{cityName}} | Fixbro',
  areaCategoryPageDescriptionPattern: 'Find and connect with {{categoryName}} experts in {{areaName}}. Browse local verified professionals.',
  areaCategoryPageKeywordsPattern: '{{categoryName}} {{areaName}}, {{categoryName}} {{cityName}}, {{areaName}} professionals',
  areaCategoryPageH1Pattern: '{{categoryName}} Experts in {{areaName}}, {{cityName}}',
  servicePageTitlePattern: '{{serviceName}} - Find Providers | Fixbro',
  servicePageDescriptionPattern: 'Looking for {{serviceName}}? Find and connect with local professionals who offer this service. View profiles and ratings.',
  servicePageKeywordsPattern: '{{serviceName}}, {{categoryName}}, find {{serviceName}} providers',
  servicePageH1Pattern: '{{serviceName}} Providers',
  areaPageTitlePattern: 'Home Service Professionals in {{areaName}}, {{cityName}} | Fixbro',
  areaPageDescriptionPattern: 'Find electricians, plumbers, and more in {{areaName}}, {{cityName}}. Connect with local experts on Fixbro.',
  areaPageKeywordsPattern: '{{areaName}} professionals, {{cityName}} home services, local experts in {{areaName}}',
  areaPageH1Pattern: 'Home Service Experts in {{areaName}}, {{cityName}}',
  structuredDataType: 'LocalBusiness',
  structuredDataName: 'Fixbro',
  structuredDataStreetAddress: '',
  structuredDataLocality: '',
  structuredDataRegion: '',
  structuredDataPostalCode: '',
  structuredDataCountry: 'IN',
  structuredDataTelephone: '',
  structuredDataImage: '',
  socialProfileUrls: { facebook: '', twitter: '', instagram: '', linkedin: '', youtube: '' },
};

export async function getGlobalSEOSettings(): Promise<FirestoreSEOSettings> {
  try {
    const settingsDocRef = doc(db, 'seoSettings', 'global');
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      // Combine fetched settings with defaults, giving precedence to fetched settings
      return { ...defaultSeoValues, ...(docSnap.data() as FirestoreSEOSettings) };
    }
    // If no settings in Firestore, return the hardcoded defaults
    return defaultSeoValues;
  } catch (error) {
    console.error('Error fetching global SEO settings:', error);
    // Fallback to defaults in case of an error
    return defaultSeoValues;
  }
}

export function replacePlaceholders(template?: string, data?: Record<string, string | undefined>): string {
  if (!template) return '';
  if (!data) return template;
  let result = template;
  try {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const placeholderValue = data[key];
        if (placeholderValue !== undefined && placeholderValue !== null) {
          result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(placeholderValue));
        } else {
          // Optionally remove placeholder if value is undefined/null or replace with empty string
           result = result.replace(new RegExp(`{{${key}}}`, 'g'), '');
        }
      }
    }
  } catch (e) {
    console.error("Error in replacePlaceholders:", e, "Template:", template, "Data:", data);
    return template; // Return original template on error to prevent breaking metadata
  }
  return result.trim();
}
