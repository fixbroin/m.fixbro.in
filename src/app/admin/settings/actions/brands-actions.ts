'use server';

import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { cache } from 'react';
import { requireAdmin } from '@/lib/auth';

export interface BrandItem {
  id: string;
  name: string;
  imageUrl: string;
}

export interface BrandsSectionContent {
  title: string;
  subtitle: string;
  row1: BrandItem[];
  row2: BrandItem[];
}

const DEFAULT_BRANDS_CONTENT: BrandsSectionContent = {
  title: 'Top brands',
  subtitle: 'We use high-quality materials and fittings, only from brands we trust.',
  row1: [
    { id: 'r1-1', name: 'CenturyPly', imageUrl: '/brands/centuryply.webp' },
    { id: 'r1-2', name: 'Greenply', imageUrl: '/brands/greenply.webp' },
    { id: 'r1-3', name: 'Greenpanel', imageUrl: '/brands/greenpanel.webp' },
    { id: 'r1-4', name: 'Blum', imageUrl: '/brands/blum.webp' },
    { id: 'r1-5', name: 'Hettich', imageUrl: '/brands/hettich.webp' },
    { id: 'r1-6', name: 'Häfele', imageUrl: '/brands/hafele.webp' },
    { id: 'r1-7', name: 'Aristo', imageUrl: '/brands/aristo.webp' },
    { id: 'r1-8', name: 'Greenlam', imageUrl: '/brands/greenlam.webp' },
    { id: 'r1-9', name: 'Merino', imageUrl: '/brands/merino.webp' },
    { id: 'r1-10', name: 'Century Laminates', imageUrl: '/brands/century-laminates.webp' },
    { id: 'r1-11', name: 'Royale Touché', imageUrl: '/brands/royale-touche.webp' },
  ],
  row2: [
    { id: 'r2-1', name: 'Asian Paints', imageUrl: '/brands/asian-paints.webp' },
    { id: 'r2-2', name: 'Franke', imageUrl: '/brands/franke.webp' },
    { id: 'r2-3', name: 'Carysil', imageUrl: '/brands/carysil.webp' },
    { id: 'r2-4', name: 'Jaquar', imageUrl: '/brands/jaquar.webp' },
    { id: 'r2-5', name: 'Bosch', imageUrl: '/brands/bosch.webp' },
    { id: 'r2-6', name: 'Faber', imageUrl: '/brands/faber.webp' },
    { id: 'r2-7', name: 'Saint-Gobain', imageUrl: '/brands/saint-gobain.webp' },
    { id: 'r2-8', name: 'Dorset', imageUrl: '/brands/dorset.webp' },
    { id: 'r2-9', name: 'Philips', imageUrl: '/brands/philips.webp' },
    { id: 'r2-10', name: 'Polycab', imageUrl: '/brands/polycab.webp' },
    { id: 'r2-11', name: 'Legrand', imageUrl: '/brands/legrand.webp' },
  ],
};

export const getBrandsSection = cache(async (): Promise<BrandsSectionContent> => {
  return await unstable_cache(
    async () => {
      try {
        const rows = await db.query<RowDataPacket[]>(
          'SELECT setting_value FROM settings WHERE setting_key = ?',
          ['brands_section']
        );
        if (rows.length > 0) {
          const data =
            typeof rows[0].setting_value === 'string'
              ? JSON.parse(rows[0].setting_value)
              : rows[0].setting_value;
          return {
            title: data.title || DEFAULT_BRANDS_CONTENT.title,
            subtitle: data.subtitle || DEFAULT_BRANDS_CONTENT.subtitle,
            row1: Array.isArray(data.row1) ? data.row1 : DEFAULT_BRANDS_CONTENT.row1,
            row2: Array.isArray(data.row2) ? data.row2 : DEFAULT_BRANDS_CONTENT.row2,
          };
        }

        await db.query(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
          ['brands_section', JSON.stringify(DEFAULT_BRANDS_CONTENT)]
        );
        return DEFAULT_BRANDS_CONTENT;
      } catch (error) {
        console.error('Failed to fetch brands section:', error);
        return DEFAULT_BRANDS_CONTENT;
      }
    },
    ['brands-section'],
    { tags: ['settings', 'brands-section'], revalidate: false }
  )();
});

export async function updateBrandsSection(content: BrandsSectionContent): Promise<void> {
  await requireAdmin();
  try {
    await db.query(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
      ['brands_section', JSON.stringify(content)]
    );
    revalidateTag('brands-section');
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to update brands section:', error);
    throw error;
  }
}
