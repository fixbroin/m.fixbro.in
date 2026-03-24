'use server';

import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';

export interface PlanFeature {
    id?: string;
    name: string;
}

export interface PricingPlan {
    id?: string;
    title: string;
    price: string;
    description: string;
    is_featured: boolean;
    features: PlanFeature[];
    displayOrder: number;
    createdAt?: string;
}

export interface PricingPageContent {
    title: string;
    subtitle: string;
}

export const getPricingPageContent = cache(async (): Promise<PricingPageContent> => {
    return await unstable_cache(
        async () => {
            try {
                const settingsResult = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', ['pricing_page']);
                if (settingsResult.length > 0) {
                    return typeof settingsResult[0].setting_value === 'string'
                        ? JSON.parse(settingsResult[0].setting_value)
                        : settingsResult[0].setting_value;
                } else {
                    const defaultData: PricingPageContent = {
                        title: 'Flexible Pricing Plans',
                        subtitle: 'Choose a plan that fits your needs. All plans include one year of free support.',
                    };
                    await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)', ['pricing_page', JSON.stringify(defaultData)]);
                    return defaultData;
                }
            } catch (error) {
                console.error("Failed to fetch pricing page content:", error);
                return {
                    title: 'Flexible Pricing Plans',
                    subtitle: 'Choose a plan that fits your needs. All plans include one year of free support.',
                };
            }
        },
        ['pricing-page-content'],
        { tags: ['settings', 'pricing-page-content'], revalidate: 86400 }
    )();
});

export async function updatePricingPageContent(content: PricingPageContent): Promise<void> {
    try {
        await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
            ['pricing_page', JSON.stringify(content), JSON.stringify(content)]);
        revalidateTag('pricing-page-content');
        revalidatePath('/pricing');
        revalidatePath('/');
    } catch (error) {
        console.error('Failed to update pricing page content:', error);
        throw error;
    }
}


export const getPricingPlans = cache(async (): Promise<PricingPlan[]> => {
    return await unstable_cache(
        async () => {
            try {
                const plans = await db.query('SELECT * FROM pricing_plans ORDER BY displayOrder ASC, createdAt ASC');

                if (plans.length === 0) {
                    const defaultPlans = [
                        {
                            id: uuidv4(), title: 'Basic', price: '₹4999', description: 'Perfect for personal sites or small businesses.', is_featured: false, displayOrder: 1,
                            features: [{ name: 'Up to 5 Pages' }, { name: 'Responsive Design' }]
                        },
                        {
                            id: uuidv4(), title: 'Business Pro', price: '₹9999', description: 'Ideal for growing businesses and professionals.', is_featured: true, displayOrder: 2,
                            features: [{ name: 'Up to 10 Pages' }, { name: 'Blog Integration' }]
                        }
                    ];
                    for (const plan of defaultPlans) {
                        await db.query('INSERT INTO pricing_plans (id, title, price, description, isPopular, features, displayOrder) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [plan.id, plan.title, plan.price, plan.description, plan.is_featured, JSON.stringify(plan.features), plan.displayOrder]);
                    }
                    return defaultPlans.map(p => ({ ...p, createdAt: new Date().toISOString() }));
                }

                return plans.map((plan: any) => ({
                    ...plan,
                    is_featured: !!plan.isPopular,
                    features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
                    createdAt: plan.createdAt instanceof Date ? plan.createdAt.toISOString() : plan.createdAt
                }));
            } catch (error) {
                console.error('Failed to fetch pricing plans:', error);
                return [];
            }
        },
        ['pricing-plans'],
        { tags: ['settings', 'pricing-plans'], revalidate: 86400 }
    )();
});

export async function updatePricingPlans(plans: Omit<PricingPlan, 'id'|'createdAt'>[]): Promise<void> {
    try {
        await db.query('DELETE FROM pricing_plans');

        for (const plan of plans) {
            await db.query('INSERT INTO pricing_plans (id, title, price, description, isPopular, features, displayOrder) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [uuidv4(), plan.title, plan.price, plan.description, plan.is_featured, JSON.stringify(plan.features), plan.displayOrder]);
        }

        revalidateTag('pricing-plans');
        revalidatePath('/pricing');
        revalidatePath('/');
    } catch (error) {
        console.error('Failed to update pricing plans:', error);
        throw error;
    }
}
