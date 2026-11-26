import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { getGeneralSettings } from '@/app/admin/settings/actions/general-actions';
import { getContactDetails } from '@/app/admin/settings/actions/contact-actions';
import { APP_NAME } from '@/lib/config';
import { generateOrderReceiptPdf } from '@/lib/receipt-pdf';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const rows = await db.query<any[]>('SELECT * FROM orders WHERE id = ? LIMIT 1', [id]);
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const order = rows[0];
  const [generalSettings, contactDetails] = await Promise.all([
    getGeneralSettings(),
    getContactDetails(),
  ]);

  const currencySymbol = generalSettings?.currency_symbol || '₹';
  const pdfBuffer = generateOrderReceiptPdf({
    orderId: order.id,
    companyName: APP_NAME,
    companyEmail: contactDetails?.email,
    companyPhone: contactDetails?.phone,
    companyAddress: contactDetails?.location,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    planTitle: order.plan_title,
    amount: Number(order.plan_price),
    currencySymbol,
    paymentMethod:
      order.payment_method === 'pay_later' ? 'Pay Later / Offline' : 'Online Payment (Razorpay)',
    status: order.status,
    dateStr: new Date(order.created_at).toLocaleDateString('en-IN'),
  });

  const download = request.nextUrl.searchParams.get('download') === '1';
  const disposition = download
    ? `attachment; filename="receipt-${order.id.slice(0, 8)}.pdf"`
    : `inline; filename="receipt-${order.id.slice(0, 8)}.pdf"`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': disposition,
      'Cache-Control': 'no-store',
    },
  });
}
