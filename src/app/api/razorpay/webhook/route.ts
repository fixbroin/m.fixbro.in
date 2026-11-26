
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getPaymentSettingsInternal } from '@/lib/server-settings';
import { persistVerifiedOrder } from '@/lib/order-service';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-razorpay-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Signature missing' }, { status: 400 });
        }

        const settings = await getPaymentSettingsInternal();
        const webhookSecret = settings.razorpay_webhook_secret;

        if (webhookSecret) {
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(body)
                .digest('hex');

            if (expectedSignature !== signature) {
                console.error('Webhook signature mismatch');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
            }
        } else if (process.env.NODE_ENV === 'production') {
            console.error('Razorpay Webhook Secret not configured in production.');
            return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
        } else {
            console.warn('Razorpay Webhook Secret not configured. Skipping signature verification in non-production.');
        }

        const payload = JSON.parse(body);
        const event = payload.event;

        // We only care about successful payments
        if (event === 'payment.captured' || event === 'order.paid') {
            const payment = payload.payload.payment?.entity || payload.payload.order?.entity;
            const orderId = payload.payload.order?.entity?.id || payload.payload.payment?.entity?.order_id;
            const paymentId = payload.payload.payment?.entity?.id;
            
            // Get data from notes
            const notes = payload.payload.payment?.entity?.notes || payload.payload.order?.entity?.notes;

            if (!notes || !notes.customer_email) {
                console.warn('Webhook received without necessary customer notes. Cannot process order automatically.');
                return NextResponse.json({ status: 'ignored', message: 'No customer notes found' });
            }

            // Check if order already exists in database
            const existingOrder = await db.query<any[]>(
                'SELECT id FROM orders WHERE payment_method = ? OR (customer_email = ? AND plan_title = ? AND created_at > NOW() - INTERVAL 1 HOUR)',
                [paymentId, notes.customer_email, notes.plan_title]
            );

            if (existingOrder.length > 0) {
                console.log(`Order for payment ${paymentId} already processed.`);
                return NextResponse.json({ status: 'ok', message: 'Order already exists' });
            }

            await persistVerifiedOrder({
                customer_name: notes.customer_name,
                customer_email: notes.customer_email,
                plan_title: notes.plan_title,
                amount: Number(notes.amount),
                razorpay_payment_id: paymentId,
                razorpay_order_id: orderId,
                status: 'completed'
            });
            console.log(`Webhook: Successfully processed order for ${notes.customer_email}`);
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
