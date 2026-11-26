
"use server";

import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import * as z from "zod";
import nodemailer from "nodemailer";
import { getEmailSettingsInternal } from "@/lib/server-settings";
import { getContactDetails } from "../admin/settings/actions/contact-actions";
import { APP_NAME } from "@/lib/config";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createNotification } from '../admin/notifications/actions';
import { requireAdmin } from '@/lib/auth';

const formSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  budget: z.string().optional(),
  message: z.string(),
});

type ContactFormState = {
  success: boolean;
  error?: string;
};

export async function submitContactForm(
  values: z.infer<typeof formSchema>
): Promise<ContactFormState> {
  const parsed = formSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: "Invalid form data." };
  }

  try {
    const { name, email, phone, budget, message } = parsed.data;
    const id = uuidv4();
    
    // 1. Save to database
    await db.query(
        'INSERT INTO contact_submissions (id, name, email, phone, budget, message) VALUES (?, ?, ?, ?, ?, ?)',
        [id, name, email, phone || null, budget || null, message]
    );

    // 2. Create notification
    await createNotification({
        type: 'submission',
        message: `New contact form submission from ${name}.`
    });

    // 3. Send email notifications in background after response
    after(async () => {
      try {
        const [emailSettings, contactDetails] = await Promise.all([
          getEmailSettingsInternal(),
          getContactDetails(),
        ]);

        if (emailSettings.smtp_host && emailSettings.smtp_user && emailSettings.smtp_password && emailSettings.smtp_sender_email) {
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
                  subject: `New Contact Form Submission from ${name}`,
                  html: `
                      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                          <h2 style="color: #333;">New Contact Form Submission</h2>
                          <p>You have received a new message from your website's contact form.</p>
                          <hr>
                          <p><strong>Name:</strong> ${name}</p>
                          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                          <p><strong>Budget:</strong> ${budget || 'Not provided'}</p>
                          <h3 style="color: #555;">Message:</h3>
                          <p style="padding: 10px; border-left: 4px solid #ccc; background-color: #f9f9f9;">
                              ${message}
                          </p>
                          <hr>
                          <p style="font-size: 0.9em; color: #888;">This email was sent from the contact form on ${APP_NAME}.</p>
                      </div>
                  `,
              }),
              transporter.sendMail({
                  from: `"${APP_NAME}" <${emailSettings.smtp_sender_email}>`,
                  to: email,
                  subject: `Thank you for contacting ${APP_NAME}`,
                  html: `
                      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                          <h2 style="color: #333;">Thank You For Your Message, ${name}!</h2>
                          <p>We have successfully received your message and appreciate you reaching out to us.</p>
                          <p>One of our team members will review your inquiry and get back to you as soon as possible, typically within 24-48 hours.</p>
                          <h3 style="color: #555;">Here is a copy of your message:</h3>
                          <div style="padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
                              <p><strong>Name:</strong> ${name}</p>
                              <p><strong>Email:</strong> ${email}</p>
                              <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                              <p><strong>Budget:</strong> ${budget || 'Not provided'}</p>
                              <p><strong>Message:</strong></p>
                              <p><em>${message}</em></p>
                          </div>
                          <hr style="margin: 20px 0;">
                          <p>If your matter is urgent, please feel free to call us directly at ${contactDetails.phone}.</p>
                          <p>Best Regards,</p>
                          <p><strong>The ${APP_NAME} Team</strong></p>
                      </div>
                  `,
              }),
            ]);
        } else {
            console.warn("SMTP settings are not fully configured. Skipping email notifications.");
        }
      } catch (emailError) {
        console.error("Failed to send contact form emails:", emailError);
      }
    });
    
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/submissions');

    return { success: true };

  } catch (error) {
    console.error("Failed to process contact form:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export interface Submission {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    budget: string | null;
    message: string;
    created_at: string;
}

export async function getDashboardSubmissionStats(): Promise<{ totalCount: number; recentSubmissions: Submission[] }> {
    await requireAdmin();
    try {
        const [countRows, recentRows] = await Promise.all([
            db.query<any[]>('SELECT COUNT(*) as count FROM contact_submissions'),
            db.query<any[]>('SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT 5'),
        ]);
        const totalCount = Number(countRows[0]?.count || 0);
        const recentSubmissions = recentRows.map(row => ({
            id: row.id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            budget: row.budget,
            message: row.message,
            created_at: new Date(row.created_at).toLocaleString(),
        }));
        return { totalCount, recentSubmissions };
    } catch (error) {
        console.error('Failed to fetch submission stats:', error);
        return { totalCount: 0, recentSubmissions: [] };
    }
}

export async function getSubmissions(): Promise<Submission[]> {
    await requireAdmin();
    try {
        const rows = await db.query<any[]>('SELECT * FROM contact_submissions ORDER BY created_at DESC');
        return rows.map(row => {
            return {
                id: row.id,
                name: row.name,
                email: row.email,
                phone: row.phone,
                budget: row.budget,
                message: row.message,
                created_at: new Date(row.created_at).toLocaleString(),
            }
        });
    } catch (error) {
        console.error('Failed to fetch submissions:', error);
        return [];
    }
}

export async function deleteSubmission(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  try {
    await db.query('DELETE FROM contact_submissions WHERE id = ?', [id]);
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/submissions');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete submission:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
