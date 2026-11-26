import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import nodemailer from 'nodemailer';
import { getEmailSettingsInternal } from '@/lib/server-settings';
import { getContactDetails } from '@/app/admin/settings/actions/contact-actions';
import { getGeneralSettings } from '@/app/admin/settings/actions/general-actions';
import { APP_NAME } from '@/lib/config';
import { createNotification } from '@/app/admin/notifications/actions';
import { generateOrderReceiptPdf } from '@/lib/receipt-pdf';

export interface VerifiedOrderInput {
  customer_name: string;
  customer_email: string;
  plan_title: string;
  amount: number;
  payment_method?: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  status: 'completed' | 'failed' | 'pending';
}

async function sendOrderConfirmationEmails(orderDetails: {
  customer_name: string;
  customer_email: string;
  plan_title: string;
  amount: number;
  payment_method?: string;
  order_id?: string;
  status?: string;
}) {
  try {
    const [emailSettings, contactDetails, generalSettings] = await Promise.all([
      getEmailSettingsInternal(),
      getContactDetails(),
      getGeneralSettings(),
    ]);

    const currencySymbol = generalSettings?.currency_symbol || '₹';
    const isPayLater = orderDetails.status === 'pending' || orderDetails.payment_method === 'pay_later';

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

    const receiptId = orderDetails.order_id || 'RECEIPT';
    const pdfBuffer = generateOrderReceiptPdf({
      orderId: receiptId,
      companyName: APP_NAME,
      companyEmail: contactDetails?.email,
      companyPhone: contactDetails?.phone,
      companyAddress: contactDetails?.location,
      customerName: orderDetails.customer_name,
      customerEmail: orderDetails.customer_email,
      planTitle: orderDetails.plan_title,
      amount: orderDetails.amount,
      currencySymbol,
      paymentMethod: isPayLater ? 'Pay Later / Offline' : 'Online Payment (Razorpay)',
      status: orderDetails.status || (isPayLater ? 'Pending' : 'Completed'),
      dateStr: new Date().toLocaleDateString('en-IN'),
    });

    const attachments = [
      {
        filename: `receipt-${receiptId.slice(0, 12)}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ];

    await Promise.all([
      transporter.sendMail({
        from: `"${APP_NAME}" <${emailSettings.smtp_sender_email}>`,
        to: contactDetails.email,
        subject: `New ${isPayLater ? 'Consultation Booking (Pay Later)' : 'Paid Order'} - ${orderDetails.plan_title}`,
        attachments,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2 style="color: #333;">New Order / Booking Receipt</h2>
              <p>A new order has been placed on your website. The PDF receipt is attached.</p>
              <hr>
              <p><strong>Customer Name:</strong> ${orderDetails.customer_name}</p>
              <p><strong>Customer Email:</strong> <a href="mailto:${orderDetails.customer_email}">${orderDetails.customer_email}</a></p>
              <p><strong>Plan:</strong> ${orderDetails.plan_title}</p>
              <p><strong>Amount:</strong> ${currencySymbol}${orderDetails.amount.toLocaleString()}</p>
              <p><strong>Payment Method:</strong> ${isPayLater ? 'Pay Later / Offline Consultation' : 'Online Payment (Razorpay)'}</p>
              <p><strong>Status:</strong> ${orderDetails.status || (isPayLater ? 'Pending' : 'Completed')}</p>
              ${orderDetails.order_id ? `<p><strong>Order Reference:</strong> ${orderDetails.order_id}</p>` : ''}
              <hr>
              <p style="font-size: 0.9em; color: #888;">This email was sent from the automated system on ${APP_NAME}.</p>
          </div>
        `,
      }),
      transporter.sendMail({
        from: `"${APP_NAME}" <${emailSettings.smtp_sender_email}>`,
        to: orderDetails.customer_email,
        subject: `Your Payment Receipt & Booking Confirmation from ${APP_NAME}`,
        attachments,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2 style="color: #333;">Thank You For Your Booking, ${orderDetails.customer_name}!</h2>
              <p>${isPayLater ? 'We have received your consultation booking. Your booking receipt is below and attached as a PDF.' : 'We have successfully received your payment. Your official receipt is below and attached as a PDF:'}</p>
              <div style="padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
                  <p><strong>Plan:</strong> ${orderDetails.plan_title}</p>
                  <p><strong>Total Amount:</strong> ${currencySymbol}${orderDetails.amount.toLocaleString()}</p>
                  <p><strong>Payment Method:</strong> ${isPayLater ? 'Pay Later / Offline' : 'Online Payment'}</p>
                  <p><strong>Status:</strong> ${isPayLater ? 'Pending Confirmation' : 'Paid / Confirmed'}</p>
                  ${orderDetails.order_id ? `<p><strong>Receipt / Order ID:</strong> ${orderDetails.order_id}</p>` : ''}
              </div>
              <hr style="margin: 20px 0;">
              <p>We are excited to help you transform your space. If you have any questions, feel free to reach out.</p>
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
 * Persists an order to MySQL and dispatches notifications/emails.
 */
export async function persistVerifiedOrder(input: VerifiedOrderInput): Promise<void> {
  const { 
    customer_name, 
    customer_email, 
    plan_title, 
    amount, 
    payment_method, 
    razorpay_payment_id, 
    razorpay_order_id, 
    status 
  } = input;
  const id = uuidv4();
  const method = payment_method || (razorpay_payment_id ? 'razorpay' : 'pay_later');

  await db.query(
    'INSERT INTO orders (id, customer_name, customer_email, plan_title, plan_price, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, customer_name, customer_email, plan_title, amount.toString(), method, status]
  );

  const generalSettings = await getGeneralSettings();
  const currencySymbol = generalSettings?.currency_symbol || '₹';

  if (status === 'completed') {
    await createNotification({
      type: 'order',
      message: `${customer_name} just purchased ${plan_title} for ${currencySymbol}${amount.toLocaleString()} (Paid Online).`,
    });

    after(() =>
      sendOrderConfirmationEmails({
        customer_name,
        customer_email,
        plan_title,
        amount,
        payment_method: method,
        order_id: razorpay_order_id || id,
        status: 'completed',
      })
    );
  } else if (status === 'pending') {
    await createNotification({
      type: 'order',
      message: `${customer_name} booked consultation for ${plan_title} (${currencySymbol}${amount.toLocaleString()} - Pay Later).`,
    });

    after(() =>
      sendOrderConfirmationEmails({
        customer_name,
        customer_email,
        plan_title,
        amount,
        payment_method: 'pay_later',
        order_id: id,
        status: 'pending',
      })
    );
  }

  revalidatePath('/admin/orders');
  revalidatePath('/admin/dashboard');
}
