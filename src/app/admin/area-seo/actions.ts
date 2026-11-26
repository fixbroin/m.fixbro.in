'use server';

import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { cache } from 'react';
import { requireAdmin } from '@/lib/auth';
import { generateRandomAreaSeo, slugifyLocation } from '@/lib/seo-templates';
import { SeoCity } from '../city-seo/actions';

export interface SeoArea {
  id: string;
  city_id: string;
  name: string;
  slug: string;
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

export interface SeoAreaWithCity extends SeoArea {
  city_name: string;
  city_slug: string;
}

function mapAreaRow(row: any): SeoArea {
  return {
    id: row.id,
    city_id: row.city_id,
    name: row.name,
    slug: row.slug,
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

export const getActiveAreasByCityId = cache(async (cityId: string): Promise<SeoArea[]> => {
  return await unstable_cache(
    async () => {
      try {
        const rows = await db.query<any[]>(
          'SELECT * FROM seo_areas WHERE city_id = ? AND is_active = TRUE ORDER BY name ASC',
          [cityId]
        );
        return rows.map(mapAreaRow);
      } catch (error) {
        console.error(`Failed to fetch active areas for city ${cityId}:`, error);
        return [];
      }
    },
    [`seo-areas-city-${cityId}`],
    { tags: ['seo-areas', `seo-areas-city-${cityId}`], revalidate: false }
  )();
});

export const getAreaBySlugs = cache(
  async (citySlug: string, areaSlug: string): Promise<{ area: SeoArea; city: SeoCity } | null> => {
    if (!citySlug || !areaSlug || citySlug.includes('.') || areaSlug.includes('.')) return null;
    return await unstable_cache(
      async () => {
        try {
          const rows = await db.query<any[]>(
            `SELECT a.*, c.id as c_id, c.name as c_name, c.slug as c_slug, c.country as c_country,
                    c.latitude as c_lat, c.longitude as c_lng, c.h1_title as c_h1, c.paragraph as c_para,
                    c.meta_title as c_mt, c.meta_description as c_md, c.meta_keywords as c_mk, c.is_active as c_active
             FROM seo_areas a
             INNER JOIN seo_cities c ON a.city_id = c.id
             WHERE c.slug = ? AND a.slug = ? AND c.is_active = TRUE AND a.is_active = TRUE
             LIMIT 1`,
            [citySlug, areaSlug]
          );
          if (rows.length === 0) return null;
          const r = rows[0];
          const area = mapAreaRow(r);
          const city: SeoCity = {
            id: r.c_id,
            name: r.c_name,
            slug: r.c_slug,
            country: r.c_country || 'India',
            latitude: r.c_lat !== null ? Number(r.c_lat) : null,
            longitude: r.c_lng !== null ? Number(r.c_lng) : null,
            h1_title: r.c_h1,
            paragraph: r.c_para,
            meta_title: r.c_mt,
            meta_description: r.c_md,
            meta_keywords: r.c_mk || '',
            is_active: Boolean(r.c_active),
          };
          return { area, city };
        } catch (error) {
          console.error(`Failed to fetch area ${citySlug}/${areaSlug}:`, error);
          return null;
        }
      },
      [`seo-area-${citySlug}-${areaSlug}`],
      { tags: ['seo-areas', 'seo-cities', `seo-area-${citySlug}-${areaSlug}`], revalidate: false }
    )();
  }
);

export const getAllActiveAreasWithCity = cache(async (): Promise<SeoAreaWithCity[]> => {
  return await unstable_cache(
    async () => {
      try {
        const rows = await db.query<any[]>(
          `SELECT a.*, c.name as city_name, c.slug as city_slug
           FROM seo_areas a
           INNER JOIN seo_cities c ON a.city_id = c.id
           WHERE a.is_active = TRUE AND c.is_active = TRUE
           ORDER BY c.name ASC, a.name ASC`
        );
        return rows.map((r) => ({
          ...mapAreaRow(r),
          city_name: r.city_name,
          city_slug: r.city_slug,
        }));
      } catch (error) {
        console.error('Failed to fetch all active areas:', error);
        return [];
      }
    },
    ['seo-areas-all-active'],
    { tags: ['seo-areas', 'seo-cities'], revalidate: false }
  )();
});

export async function getAreasByCityAdmin(cityId: string): Promise<SeoArea[]> {
  await requireAdmin();
  try {
    const rows = await db.query<any[]>(
      'SELECT * FROM seo_areas WHERE city_id = ? ORDER BY created_at DESC, name ASC',
      [cityId]
    );
    return rows.map(mapAreaRow);
  } catch (error) {
    console.error('Failed to fetch admin areas:', error);
    return [];
  }
}

export async function saveAreaSeo(
  data: Partial<SeoArea> & { city_id: string; name: string }
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  try {
    const cityRows = await db.query<any[]>('SELECT name, slug FROM seo_cities WHERE id = ? LIMIT 1', [data.city_id]);
    if (cityRows.length === 0) {
      return { success: false, error: 'Parent city not found.' };
    }
    const city = cityRows[0];
    const name = data.name.trim();
    const slug = slugifyLocation(data.slug?.trim() || name);
    if (!name || !slug) {
      return { success: false, error: 'Invalid area name or slug.' };
    }

    const generated = generateRandomAreaSeo(name, city.name);
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
        `UPDATE seo_areas
         SET name = ?, slug = ?, latitude = ?, longitude = ?,
             h1_title = ?, paragraph = ?, meta_title = ?, meta_description = ?, meta_keywords = ?, is_active = ?
         WHERE id = ?`,
        [name, slug, lat, lng, h1_title, paragraph, meta_title, meta_description, meta_keywords, is_active, data.id]
      );
    } else {
      await db.query(
        `INSERT INTO seo_areas
         (id, city_id, name, slug, latitude, longitude, h1_title, paragraph, meta_title, meta_description, meta_keywords, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name), latitude = VALUES(latitude), longitude = VALUES(longitude)`,
        [uuidv4(), data.city_id, name, slug, lat, lng, h1_title, paragraph, meta_title, meta_description, meta_keywords, is_active]
      );
    }

    revalidateTag('seo-areas');
    revalidateTag(`seo-areas-city-${data.city_id}`);
    revalidateTag(`seo-area-${city.slug}-${slug}`);
    revalidatePath(`/${city.slug}`);
    revalidatePath(`/${city.slug}/${slug}`);
    revalidatePath('/sitemap');
    revalidatePath('/sitemap.xml');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to save area SEO:', error);
    return { success: false, error: error.message || 'Failed to save area.' };
  }
}

export async function toggleAreaActive(id: string, isActive: boolean): Promise<{ success: boolean }> {
  await requireAdmin();
  try {
    await db.query('UPDATE seo_areas SET is_active = ? WHERE id = ?', [isActive, id]);
    revalidateTag('seo-areas');
    revalidatePath('/sitemap');
    revalidatePath('/sitemap.xml');
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle area:', error);
    return { success: false };
  }
}

export async function regenerateAreaSeo(id: string): Promise<{ success: boolean }> {
  await requireAdmin();
  try {
    const rows = await db.query<any[]>(
      `SELECT a.name, a.slug, a.city_id, c.name as city_name, c.slug as city_slug
       FROM seo_areas a INNER JOIN seo_cities c ON a.city_id = c.id
       WHERE a.id = ? LIMIT 1`,
      [id]
    );
    if (rows.length === 0) return { success: false };
    const r = rows[0];
    const generated = generateRandomAreaSeo(r.name, r.city_name);
    await db.query(
      'UPDATE seo_areas SET h1_title = ?, paragraph = ?, meta_title = ?, meta_description = ?, meta_keywords = ? WHERE id = ?',
      [generated.h1_title, generated.paragraph, generated.meta_title, generated.meta_description, generated.meta_keywords, id]
    );
    revalidateTag('seo-areas');
    revalidateTag(`seo-areas-city-${r.city_id}`);
    revalidateTag(`seo-area-${r.city_slug}-${r.slug}`);
    revalidatePath(`/${r.city_slug}/${r.slug}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to regenerate area SEO:', error);
    return { success: false };
  }
}

export async function batchRegenerateCityAreaSeo(cityId: string): Promise<{ success: boolean; updated: number }> {
  await requireAdmin();
  try {
    const rows = await db.query<any[]>(
      `SELECT a.id, a.name, a.slug, c.name as city_name, c.slug as city_slug
       FROM seo_areas a INNER JOIN seo_cities c ON a.city_id = c.id
       WHERE a.city_id = ?`,
      [cityId]
    );
    let updated = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const generated = generateRandomAreaSeo(r.name, r.city_name, i + Math.floor(Math.random() * 32));
      await db.query(
        'UPDATE seo_areas SET h1_title = ?, paragraph = ?, meta_title = ?, meta_description = ?, meta_keywords = ? WHERE id = ?',
        [generated.h1_title, generated.paragraph, generated.meta_title, generated.meta_description, generated.meta_keywords, r.id]
      );
      revalidateTag(`seo-area-${r.city_slug}-${r.slug}`);
      revalidatePath(`/${r.city_slug}/${r.slug}`);
      updated++;
    }
    revalidateTag('seo-areas');
    revalidateTag(`seo-areas-city-${cityId}`);
    return { success: true, updated };
  } catch (error) {
    console.error('Failed to batch regenerate area SEO:', error);
    return { success: false, updated: 0 };
  }
}

export async function deleteAreaSeo(id: string): Promise<{ success: boolean }> {
  await requireAdmin();
  try {
    await db.query('DELETE FROM seo_areas WHERE id = ?', [id]);
    revalidateTag('seo-areas');
    revalidatePath('/sitemap');
    revalidatePath('/sitemap.xml');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete area SEO:', error);
    return { success: false };
  }
}

export async function importAreasBatch(
  cityId: string,
  items: Array<{ name: string; lat: number; lon: number }>
): Promise<{ success: boolean; imported: number; error?: string }> {
  await requireAdmin();
  try {
    const cityRows = await db.query<any[]>('SELECT name, slug FROM seo_cities WHERE id = ? LIMIT 1', [cityId]);
    if (cityRows.length === 0) {
      return { success: false, imported: 0, error: 'Parent city not found.' };
    }
    const city = cityRows[0];

    let imported = 0;
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      const name = a.name.trim();
      const slug = slugifyLocation(name);
      if (!name || !slug || slug === city.slug) continue;

      const seo = generateRandomAreaSeo(name, city.name, i + Math.floor(Math.random() * 32));
      const [res]: any = await db.pool.query(
        `INSERT IGNORE INTO seo_areas
         (id, city_id, name, slug, latitude, longitude, h1_title, paragraph, meta_title, meta_description, meta_keywords, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [uuidv4(), cityId, name, slug, a.lat, a.lon, seo.h1_title, seo.paragraph, seo.meta_title, seo.meta_description, seo.meta_keywords]
      );
      if (res?.affectedRows > 0) imported++;
    }

    revalidateTag('seo-areas');
    revalidateTag(`seo-areas-city-${cityId}`);
    revalidatePath(`/${city.slug}`);
    revalidatePath('/sitemap');
    revalidatePath('/sitemap.xml');
    return { success: true, imported };
  } catch (error: any) {
    console.error('Batch area import error:', error);
    return { success: false, imported: 0, error: error.message || 'Failed to import areas.' };
  }
}

export async function autoImportAreasFromOSM(
  cityId: string,
  maxAreas: number = 30
): Promise<{ success: boolean; imported: number; error?: string }> {
  await requireAdmin();
  try {
    const cityRows = await db.query<any[]>('SELECT * FROM seo_cities WHERE id = ? LIMIT 1', [cityId]);
    if (cityRows.length === 0) {
      return { success: false, imported: 0, error: 'City not found.' };
    }
    const city = cityRows[0];
    let lat = city.latitude ? Number(city.latitude) : null;
    let lon = city.longitude ? Number(city.longitude) : null;

    // Fallback: geocode city name via Nominatim if lat/lon missing
    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(`${city.name}, ${city.country || 'India'}`)}`,
        {
          headers: { 'User-Agent': 'FixBroInteriorsSEO/1.0' },
          signal: AbortSignal.timeout(10000),
        }
      );
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (Array.isArray(nomData) && nomData.length > 0) {
          lat = parseFloat(nomData[0].lat);
          lon = parseFloat(nomData[0].lon);
          await db.query('UPDATE seo_cities SET latitude = ?, longitude = ? WHERE id = ?', [lat, lon, cityId]);
        }
      }
    }

    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
      return { success: false, imported: 0, error: 'Could not determine coordinates for this city.' };
    }

    const overpassQuery = `[out:json][timeout:25];(node["place"~"suburb|neighbourhood|quarter|locality"](around:20000,${lat},${lon}););out body ${Math.min(maxAreas * 2, 100)};`;

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
      if (!slug || slug === city.slug || seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);
      candidates.push({
        name: name.trim(),
        slug,
        lat: Number(el.lat),
        lon: Number(el.lon),
      });
      if (candidates.length >= maxAreas) break;
    }

    let imported = 0;
    for (let i = 0; i < candidates.length; i++) {
      const a = candidates[i];
      const seo = generateRandomAreaSeo(a.name, city.name, i + Math.floor(Math.random() * 32));
      const [res]: any = await db.pool.query(
        `INSERT IGNORE INTO seo_areas
         (id, city_id, name, slug, latitude, longitude, h1_title, paragraph, meta_title, meta_description, meta_keywords, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [uuidv4(), cityId, a.name, a.slug, a.lat, a.lon, seo.h1_title, seo.paragraph, seo.meta_title, seo.meta_description, seo.meta_keywords]
      );
      if (res?.affectedRows > 0) imported++;
    }

    revalidateTag('seo-areas');
    revalidateTag(`seo-areas-city-${cityId}`);
    revalidatePath(`/${city.slug}`);
    revalidatePath('/sitemap');
    revalidatePath('/sitemap.xml');
    return { success: true, imported };
  } catch (error: any) {
    console.error('OSM area import error:', error);
    return { success: false, imported: 0, error: error.message || 'OpenStreetMap area import failed.' };
  }
}
