'use server';

import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { cache } from 'react';
import { requireAdmin } from '@/lib/auth';
import { generateRandomCitySeo, slugifyLocation } from '@/lib/seo-templates';

export interface SeoCity {
  id: string;
  name: string;
  slug: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  h1_title: string;
  paragraph: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  is_active: boolean;
  created_at?: string;
}

const RESERVED_SLUGS = new Set([
  'admin', 'api', 'about', 'services', 'portfolio', 'pricing', 'contact',
  'checkout', 'terms', 'privacy-policy', 'refund-policy', 'cancellation-policy',
  'sitemap', 'sitemap.xml', 'robots.txt', 'sw.js', '_next',
]);

function mapCityRow(row: any): SeoCity {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    country: row.country || 'India',
    latitude: row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : null,
    longitude: row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : null,
    h1_title: row.h1_title,
    paragraph: row.paragraph,
    meta_title: row.meta_title,
    meta_description: row.meta_description,
    meta_keywords: row.meta_keywords || '',
    is_active: Boolean(row.is_active),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at || ''),
  };
}

export const getActiveCities = cache(async (): Promise<SeoCity[]> => {
  return await unstable_cache(
    async () => {
      try {
        const rows = await db.query<any[]>(
          'SELECT * FROM seo_cities WHERE is_active = TRUE ORDER BY name ASC'
        );
        return rows.map(mapCityRow);
      } catch (error) {
        console.error('Failed to fetch active cities:', error);
        return [];
      }
    },
    ['seo-cities-active'],
    { tags: ['seo-cities'], revalidate: false }
  )();
});

export const getCityBySlug = cache(async (slug: string): Promise<SeoCity | null> => {
  if (!slug || slug.includes('.') || RESERVED_SLUGS.has(slug)) return null;
  return await unstable_cache(
    async () => {
      try {
        const rows = await db.query<any[]>(
          'SELECT * FROM seo_cities WHERE slug = ? AND is_active = TRUE LIMIT 1',
          [slug]
        );
        return rows.length > 0 ? mapCityRow(rows[0]) : null;
      } catch (error) {
        console.error(`Failed to fetch city ${slug}:`, error);
        return null;
      }
    },
    [`seo-city-${slug}`],
    { tags: ['seo-cities', `seo-city-${slug}`], revalidate: false }
  )();
});

export async function getAllCitiesAdmin(): Promise<SeoCity[]> {
  await requireAdmin();
  try {
    const rows = await db.query<any[]>('SELECT * FROM seo_cities ORDER BY created_at DESC, name ASC');
    return rows.map(mapCityRow);
  } catch (error) {
    console.error('Failed to fetch cities for admin:', error);
    return [];
  }
}

export async function saveCitySeo(data: Partial<SeoCity> & { name: string }): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  try {
    const name = data.name.trim();
    const slug = slugifyLocation(data.slug?.trim() || name);
    if (!name || !slug || RESERVED_SLUGS.has(slug)) {
      return { success: false, error: 'Invalid or reserved city name/slug.' };
    }

    const country = data.country?.trim() || 'India';
    const generated = generateRandomCitySeo(name, country);
    const h1_title = data.h1_title?.trim() || generated.h1_title;
    const paragraph = data.paragraph?.trim() || generated.paragraph;
    const meta_title = data.meta_title?.trim() || generated.meta_title;
    const meta_description = data.meta_description?.trim() || generated.meta_description;
    const meta_keywords = data.meta_keywords?.trim() || generated.meta_keywords;
    const is_active = data.is_active !== undefined ? data.is_active : true;
    const lat = data.latitude ?? null;
    const lng = data.longitude ?? null;

    if (data.id) {
      await db.query(
        `UPDATE seo_cities
         SET name = ?, slug = ?, country = ?, latitude = ?, longitude = ?,
             h1_title = ?, paragraph = ?, meta_title = ?, meta_description = ?, meta_keywords = ?, is_active = ?
         WHERE id = ?`,
        [name, slug, country, lat, lng, h1_title, paragraph, meta_title, meta_description, meta_keywords, is_active, data.id]
      );
    } else {
      await db.query(
        `INSERT INTO seo_cities
         (id, name, slug, country, latitude, longitude, h1_title, paragraph, meta_title, meta_description, meta_keywords, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name), country = VALUES(country), latitude = VALUES(latitude), longitude = VALUES(longitude)`,
        [uuidv4(), name, slug, country, lat, lng, h1_title, paragraph, meta_title, meta_description, meta_keywords, is_active]
      );
    }

    revalidateTag('seo-cities');
    revalidateTag(`seo-city-${slug}`);
    revalidatePath(`/${slug}`);
    revalidatePath('/sitemap');
    revalidatePath('/sitemap.xml');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to save city SEO:', error);
    return { success: false, error: error.message || 'Failed to save city.' };
  }
}

export async function toggleCityActive(id: string, isActive: boolean): Promise<{ success: boolean }> {
  await requireAdmin();
  try {
    await db.query('UPDATE seo_cities SET is_active = ? WHERE id = ?', [isActive, id]);
    revalidateTag('seo-cities');
    revalidatePath('/sitemap');
    revalidatePath('/sitemap.xml');
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle city status:', error);
    return { success: false };
  }
}

export async function regenerateCitySeo(id: string): Promise<{ success: boolean }> {
  await requireAdmin();
  try {
    const rows = await db.query<any[]>('SELECT name, slug, country FROM seo_cities WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return { success: false };
    const { name, slug, country } = rows[0];
    const generated = generateRandomCitySeo(name, country || 'India');
    await db.query(
      'UPDATE seo_cities SET h1_title = ?, paragraph = ?, meta_title = ?, meta_description = ?, meta_keywords = ? WHERE id = ?',
      [generated.h1_title, generated.paragraph, generated.meta_title, generated.meta_description, generated.meta_keywords, id]
    );
    revalidateTag('seo-cities');
    revalidateTag(`seo-city-${slug}`);
    revalidatePath(`/${slug}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to regenerate city SEO:', error);
    return { success: false };
  }
}

export async function batchRegenerateAllCitySeo(): Promise<{ success: boolean; updated: number }> {
  await requireAdmin();
  try {
    const rows = await db.query<any[]>('SELECT id, name, slug, country FROM seo_cities');
    let updated = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const generated = generateRandomCitySeo(r.name, r.country || 'India', i + Math.floor(Math.random() * 32));
      await db.query(
        'UPDATE seo_cities SET h1_title = ?, paragraph = ?, meta_title = ?, meta_description = ?, meta_keywords = ? WHERE id = ?',
        [generated.h1_title, generated.paragraph, generated.meta_title, generated.meta_description, generated.meta_keywords, r.id]
      );
      revalidateTag(`seo-city-${r.slug}`);
      revalidatePath(`/${r.slug}`);
      updated++;
    }
    revalidateTag('seo-cities');
    return { success: true, updated };
  } catch (error) {
    console.error('Failed to batch regenerate city SEO:', error);
    return { success: false, updated: 0 };
  }
}

export async function deleteCitySeo(id: string): Promise<{ success: boolean }> {
  await requireAdmin();
  try {
    await db.query('DELETE FROM seo_cities WHERE id = ?', [id]);
    revalidateTag('seo-cities');
    revalidateTag('seo-areas');
    revalidatePath('/sitemap');
    revalidatePath('/sitemap.xml');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete city SEO:', error);
    return { success: false };
  }
}

const COUNTRY_ISO_MAP: Record<string, string> = {
  India: 'IN',
  'United Arab Emirates': 'AE',
  'United States': 'US',
  'United Kingdom': 'GB',
  Singapore: 'SG',
  Australia: 'AU',
  Canada: 'CA',
  'Saudi Arabia': 'SA',
};

export async function importCitiesBatch(
  country: string,
  items: Array<{ name: string; lat: number | null; lon: number | null }>
): Promise<{ success: boolean; imported: number; error?: string }> {
  await requireAdmin();
  try {
    let imported = 0;
    for (let i = 0; i < items.length; i++) {
      const c = items[i];
      const name = c.name.trim();
      const slug = slugifyLocation(name);
      if (!name || !slug || RESERVED_SLUGS.has(slug)) continue;

      const seo = generateRandomCitySeo(name, country || 'India', i + Math.floor(Math.random() * 32));
      const [res]: any = await db.pool.query(
        `INSERT IGNORE INTO seo_cities
         (id, name, slug, country, latitude, longitude, h1_title, paragraph, meta_title, meta_description, meta_keywords, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [uuidv4(), name, slug, country || 'India', c.lat, c.lon, seo.h1_title, seo.paragraph, seo.meta_title, seo.meta_description, seo.meta_keywords]
      );
      if (res?.affectedRows > 0) imported++;
    }

    revalidateTag('seo-cities');
    revalidatePath('/sitemap');
    revalidatePath('/sitemap.xml');
    return { success: true, imported };
  } catch (error: any) {
    console.error('Batch city import error:', error);
    return { success: false, imported: 0, error: error.message || 'Failed to import cities.' };
  }
}

export async function autoImportCitiesFromOSM(
  country: string = 'India',
  maxCities: number = 30
): Promise<{ success: boolean; imported: number; error?: string }> {
  await requireAdmin();
  try {
    const iso = COUNTRY_ISO_MAP[country] || 'IN';
    const overpassQuery = `[out:json][timeout:25];area["ISO3166-1"="${iso}"][admin_level=2]->.searchArea;(node["place"="city"](area.searchArea););out body ${Math.min(maxCities * 2, 100)};`;

    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
    ];

    let json: any = null;
    let lastStatus = 0;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            Accept: 'application/json',
            'User-Agent': 'FixBroInteriorsSEO/1.0',
          },
          body: `data=${encodeURIComponent(overpassQuery)}`,
          signal: AbortSignal.timeout(25000),
        });
        if (response.ok) {
          json = await response.json();
          break;
        }
        lastStatus = response.status;
      } catch {
        // Try next mirror
      }
    }

    if (!json) {
      throw new Error(`OpenStreetMap Overpass API returned ${lastStatus || 'an error'}`);
    }
    const elements: any[] = Array.isArray(json?.elements) ? json.elements : [];

    const seenSlugs = new Set<string>();
    const candidates: Array<{ name: string; slug: string; lat: number; lon: number }> = [];

    for (const el of elements) {
      const name: string | undefined = el?.tags?.['name:en'] || el?.tags?.name;
      if (!name) continue;
      const slug = slugifyLocation(name);
      if (!slug || RESERVED_SLUGS.has(slug) || seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);
      candidates.push({
        name: name.trim(),
        slug,
        lat: Number(el.lat),
        lon: Number(el.lon),
      });
      if (candidates.length >= maxCities) break;
    }

    let imported = 0;
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const seo = generateRandomCitySeo(c.name, country, i + Math.floor(Math.random() * 32));
      const [res]: any = await db.pool.query(
        `INSERT IGNORE INTO seo_cities
         (id, name, slug, country, latitude, longitude, h1_title, paragraph, meta_title, meta_description, meta_keywords, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [uuidv4(), c.name, c.slug, country, c.lat, c.lon, seo.h1_title, seo.paragraph, seo.meta_title, seo.meta_description, seo.meta_keywords]
      );
      if (res?.affectedRows > 0) imported++;
    }

    revalidateTag('seo-cities');
    revalidatePath('/sitemap');
    revalidatePath('/sitemap.xml');
    return { success: true, imported };
  } catch (error: any) {
    console.error('OSM city import error:', error);
    return { success: false, imported: 0, error: error.message || 'OpenStreetMap import failed.' };
  }
}
