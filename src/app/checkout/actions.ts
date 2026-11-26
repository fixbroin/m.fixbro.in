
'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getPaymentSettingsInternal } from '@/lib/server-settings';
import { persistVerifiedOrder } from '@/lib/order-service';
import { requireAdmin } from '@/lib/auth';

export interface SaveOrderPayload {
    customer_name: string;
    customer_email: string;
    plan_title: string;
    amount: number;
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    status: 'completed' | 'failed';
}

const orderSchema = z.object({
    customer_name: z.string(),
    customer_email: z.string().email(),
    plan_title: z.string(),
    amount: z.number(),
    razorpay_payment_id: z.string(),
    razorpay_order_id: z.string(),
    razorpay_signature: z.string().optional().nullable(),
    status: z.enum(['completed', 'failed']),
});


export async function saveOrder(payload: SaveOrderPayload): Promise<{success: boolean, error?: string}> {
    const validated = orderSchema.safeParse(payload);
    if (!validated.success) {
        console.error('Invalid order payload:', validated.error);
        return { success: false, error: 'Invalid data provided.' };
    }

    try {
        const { customer_name, customer_email, plan_title, amount, razorpay_payment_id, razorpay_order_id, razorpay_signature, status } = validated.data;
        
        // Security check for completed payments (never allow bypass from client-callable Server Action)
        if (status === 'completed') {
            const paymentSettings = await getPaymentSettingsInternal();
            if (!paymentSettings?.razorpay_key_secret) {
                return { success: false, error: 'Payment secret not configured.' };
            }
            if (!razorpay_signature) {
                return { success: false, error: 'Payment verification failed. Missing signature.' };
            }
            
            const generated_signature = crypto
                .createHmac('sha256', paymentSettings.razorpay_key_secret)
                .update(razorpay_order_id + "|" + razorpay_payment_id)
                .digest('hex');

            if (generated_signature !== razorpay_signature) {
                 return { success: false, error: 'Payment verification failed. Signature mismatch.' };
            }
        }

        await persistVerifiedOrder({
            customer_name,
            customer_email,
            plan_title,
            amount,
            razorpay_payment_id,
            razorpay_order_id,
            status,
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to save order:', error);
        return { success: false, error: 'Could not save the order to the database.' };
    }
}


export interface Order {
    id: string;
    customer_name: string;
    customer_email: string;
    plan_title: string;
    amount: number;
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    status: 'completed' | 'failed';
    created_at: string;
}

export async function getOrderSummaryStats(): Promise<{ totalRevenue: number; completedCount: number }> {
    await requireAdmin();
    try {
        const rows = await db.query<any[]>(
            "SELECT COUNT(*) as completedCount, COALESCE(SUM(CAST(plan_price AS DECIMAL(12,2))), 0) as totalRevenue FROM orders WHERE status = 'completed'"
        );
        return {
            completedCount: Number(rows[0]?.completedCount || 0),
            totalRevenue: Number(rows[0]?.totalRevenue || 0),
        };
    } catch (error) {
        console.error('Failed to fetch order summary stats:', error);
        return { completedCount: 0, totalRevenue: 0 };
    }
}

export async function getOrders(): Promise<Order[]> {
    await requireAdmin();
    try {
        const rows = await db.query<any[]>('SELECT * FROM orders ORDER BY created_at DESC');
        return rows.map(row => {
            return {
                id: row.id,
                customer_name: row.customer_name,
                customer_email: row.customer_email,
                plan_title: row.plan_title,
                amount: Number(row.plan_price),
                razorpay_payment_id: row.payment_method,
                status: row.status,
                created_at: new Date(row.created_at).toLocaleString(),
            } as Order;
        });
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        return [];
    }
}

export async function createRazorpayOrder({ 
    amount, 
    customer_name, 
    customer_email, 
    customer_phone, 
    plan_title 
}: { 
    amount: number,
    customer_name: string,
    customer_email: string,
    customer_phone: string,
    plan_title: string
}): Promise<{ success: boolean; order?: any; error?: string }> {
    try {
        const paymentSettings = await getPaymentSettingsInternal();
        if (!paymentSettings || !paymentSettings.razorpay_key_id || !paymentSettings.razorpay_key_secret) {
            return { success: false, error: "Razorpay credentials are not configured." };
        }

        const instance = new Razorpay({
            key_id: paymentSettings.razorpay_key_id,
            key_secret: paymentSettings.razorpay_key_secret,
        });

        const options = {
            amount: amount * 100, // amount in the smallest currency unit
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`,
            payment_capture: 1, // Enable auto-capture
            notes: {
                customer_name,
                customer_email,
                customer_phone,
                plan_title,
                amount
            }
        };

        const order = await instance.orders.create(options);

        if (!order) {
            return { success: false, error: "Failed to create Razorpay order." };
        }

        return { success: true, order };
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        return { success: false, error: "Could not initiate payment." };
    }
}

export async function deleteOrder(id: string): Promise<{ success: boolean; error?: string }> {
    await requireAdmin();
    try {
      await db.query('DELETE FROM orders WHERE id = ?', [id]);
      revalidatePath('/admin/orders');
      revalidatePath('/admin/dashboard');
      return { success: true };
    } catch (error) {
      console.error('Failed to delete order:', error);
      return { success: false, error: 'An unexpected error occurred.' };
    }
}
