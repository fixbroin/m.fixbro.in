import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import nodemailer from 'nodemailer';
import { getEmailSettingsInternal } from '@/lib/server-settings';
import { getContactDetails } from '@/app/admin/settings/actions/contact-actions';
import { APP_NAME } from '@/lib/config';
import { createNotification } from '@/app/admin/notifications/actions';

export interface VerifiedOrderInput {
  customer_name: string;
  customer_email: string;
  plan_title: string;
  amount: number;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  status: 'completed' | 'failed';
}

async function sendOrderConfirmationEmails(orderDetails: {
  customer_name: string;
  customer_email: string;
  plan_title: string;
  amount: number;
  razorpay_order_id: string;
}) {
  try {
    const [emailSettings, contactDetails] = await Promise.all([
      getEmailSettingsInternal(),
      getContactDetails(),
    ]);

    if (
      !emailSettings.smtp_host ||
      !emailSettings.smtp_user ||
      !emailSettings.smtp_password ||
      !emailSettings.smtp_sender_email
    ) {
      console.warn('SMTP settings are not fully configured. Skipping order confirmation emails.');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: emailSettings.smtp_host,
      port: emailSettings.smtp_port,
      secure: emailSettings.smtp_port === 465,
      auth: {
        user: emailSettings.smtp_user,
        pass: emailSettings.smtp_password,
      },
    });

    await Promise.all([
      transporter.sendMail({
        from: `"${APP_NAME}" <${emailSettings.smtp_sender_email}>`,
        to: contactDetails.email,
        subject: `New Order Received - ${orderDetails.plan_title}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2 style="color: #333;">New Order Notification</h2>
              <p>A new order has been placed on your website.</p>
              <hr>
              <p><strong>Customer Name:</strong> ${orderDetails.customer_name}</p>
              <p><strong>Customer Email:</strong> <a href="mailto:${orderDetails.customer_email}">${orderDetails.customer_email}</a></p>
              <p><strong>Plan Purchased:</strong> ${orderDetails.plan_title}</p>
              <p><strong>Amount:</strong> ₹${orderDetails.amount.toLocaleString()}</p>
              <p><strong>Razorpay Order ID:</strong> ${orderDetails.razorpay_order_id}</p>
              <hr>
              <p style="font-size: 0.9em; color: #888;">This email was sent from the automated system on ${APP_NAME}.</p>
          </div>
        `,
      }),
      transporter.sendMail({
        from: `"${APP_NAME}" <${emailSettings.smtp_sender_email}>`,
        to: orderDetails.customer_email,
        subject: `Your Order Confirmation from ${APP_NAME}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2 style="color: #333;">Thank You For Your Order, ${orderDetails.customer_name}!</h2>
              <p>We have successfully received your payment. Here are the details of your purchase:</p>
              <div style="padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
                  <p><strong>Plan:</strong> ${orderDetails.plan_title}</p>
                  <p><strong>Amount Paid:</strong> ₹${orderDetails.amount.toLocaleString()}</p>
                  <p><strong>Order ID:</strong> ${orderDetails.razorpay_order_id}</p>
              </div>
              <hr style="margin: 20px 0;">
              <p>We will get started on your project right away. If you have any questions, please feel free to contact us.</p>
              <p>Best Regards,</p>
              <p><strong>The ${APP_NAME} Team</strong></p>
          </div>
        `,
      }),
    ]);
  } catch (error) {
    console.error('Failed to send order confirmation emails:', error);
  }
}

/**
 * Persists an already-verified order to MySQL and dispatches notifications/emails.
 * Must only be called from server-side code after signature verification.
 */
export async function persistVerifiedOrder(input: VerifiedOrderInput): Promise<void> {
  const { customer_name, customer_email, plan_title, amount, razorpay_payment_id, razorpay_order_id, status } = input;
  const id = uuidv4();

  await db.query(
    'INSERT INTO orders (id, customer_name, customer_email, plan_title, plan_price, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, customer_name, customer_email, plan_title, amount.toString(), razorpay_payment_id, status]
  );

  if (status === 'completed') {
    await createNotification({
      type: 'order',
      message: `${customer_name} just purchased the ${plan_title} for ₹${amount.toLocaleString()}.`,
    });

    after(() =>
      sendOrderConfirmationEmails({
        customer_name,
        customer_email,
        plan_title,
        amount,
        razorpay_order_id,
      })
    );
  }

  revalidatePath('/admin/orders');
  revalidatePath('/admin/dashboard');
}
