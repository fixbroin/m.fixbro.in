
'use server';

import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';

interface Setting {
    enabled: boolean;
    value: string;
}

export interface MarketingSettings {
    googleTagManagerId: Setting;
    googleAnalyticsId: Setting;
    googleAdsId: Setting;
    googleAdsLabel: Setting;
    googleRemarketing: Setting;
    googleOptimizeId: Setting;
    metaPixelId: Setting;
    metaPixelAccessToken: Setting;
    metaConversionsApiKey: Setting;
    bingUetTagId: Setting;
    pinterestTagId: Setting;
    microsoftClarityId: Setting;
    customHeadScript: Setting;
    customBodyScript: Setting;
}

export const getMarketingSettings = cache(async (): Promise<MarketingSettings> => {
    return await unstable_cache(
        async () => {
            try {
                const rows = await db.query<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', ['marketing_settings']);
                if (rows.length > 0) {
                    const data = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
                    return data as MarketingSettings;
                } else {
                    // Default data if the document doesn't exist
                    const defaultSettingValue = { enabled: false, value: '' };
                    const defaultData: MarketingSettings = {
                        googleTagManagerId: { ...defaultSettingValue },
                        googleAnalyticsId: { ...defaultSettingValue },
                        googleAdsId: { ...defaultSettingValue },
                        googleAdsLabel: { ...defaultSettingValue },
                        googleRemarketing: { ...defaultSettingValue },
                        googleOptimizeId: { ...defaultSettingValue },
                        metaPixelId: { ...defaultSettingValue },
                        metaPixelAccessToken: { ...defaultSettingValue },
                        metaConversionsApiKey: { ...defaultSettingValue },
                        bingUetTagId: { ...defaultSettingValue },
                        pinterestTagId: { ...defaultSettingValue },
                        microsoftClarityId: { ...defaultSettingValue },
                        customHeadScript: { ...defaultSettingValue },
                        customBodyScript: { ...defaultSettingValue },
                    };
                    await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', 
                        ['marketing_settings', JSON.stringify(defaultData)]);
                    return defaultData;
                }
            } catch (error) {
                console.error("Failed to fetch marketing settings:", error);
                throw error;
            }
        },
        ['marketing-settings'],
        { tags: ['settings', 'marketing-settings'], revalidate: 86400 }
    )();
});

export async function updateMarketingSettings(settings: MarketingSettings): Promise<void> {
    try {
        const rows = await db.query<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', ['marketing_settings']);
        let existingData = {};
        if (rows.length > 0) {
            existingData = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
        }
        
        const mergedData = { ...existingData, ...settings };

        await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', 
            ['marketing_settings', JSON.stringify(mergedData)]);
            
        revalidateTag('marketing-settings');
        // Revalidate the entire site layout since these scripts affect every page
        revalidatePath('/', 'layout');
    } catch (error) {
        console.error("Failed to update marketing settings:", error);
        throw error;
    }
}
