
'use server';
/**
 * @fileOverview A Genkit flow to send connection unlock notification emails to user, provider, and admin.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import nodemailer from 'nodemailer';
import { getBaseUrl } from '@/lib/config';

const ConnectionUnlockEmailInputSchema = z.object({
  // User Details
  userName: z.string(),
  userEmail: z.string().email().optional().or(z.literal('')), // Allow empty string or optional
  userMobile: z.string(),

  // Provider Details
  providerName: z.string(),
  providerEmail: z.string().email(),
  providerCategory: z.string(),

  // Transaction Details
  transactionId: z.string(),
  timestamp: z.string(),
  
  // SMTP Settings
  smtpHost: z.string().optional(),
  smtpPort: z.string().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  senderEmail: z.string().email().optional(),

  // Site Details
  siteName: z.string().optional(),
  logoUrl: z.string().url().optional(),
});

export type ConnectionUnlockEmailInput = z.infer<typeof ConnectionUnlockEmailInputSchema>;

export async function sendConnectionUnlockEmail(input: ConnectionUnlockEmailInput): Promise<{ success: boolean; message: string }> {
  try {
    const result = await connectionUnlockEmailFlow(input);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Failed to process connection unlock email flow: ${errorMessage}` };
  }
}

const createHtmlTemplate = (title: string, bodyContent: string, siteName: string, logoUrl?: string) => {
    const finalLogoUrl = logoUrl || `${getBaseUrl()}/default-image.png`;
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600&family=Roboto:wght@400;500&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; background-color: #F8F9FA; font-family: 'Roboto', sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; }
        .header { text-align: center; padding-bottom: 20px; }
        .header img { max-width: 150px; }
        .content { padding: 20px 0; color: #333333; line-height: 1.6; }
        .content h2, .content h3 { font-family: 'Poppins', sans-serif; color: #333333; }
        .footer { text-align: center; font-size: 12px; color: #999999; padding-top: 20px; border-top: 1px solid #eeeeee; }
        .notice { background-color: #fffbe6; border-left: 4px solid #ffe58f; padding: 15px; margin: 20px 0; font-size: 14px; }
        .details-box { border: 1px solid #e0e0e0; padding: 15px; margin-top: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F9FA;">
        <tr>
            <td align="center">
                <table class="container" width="600" border="0" cellspacing="0" cellpadding="20" style="background-color: #ffffff; margin-top: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <tr>
                        <td>
                            <div class="header">
                                <a href="${getBaseUrl()}" target="_blank"><img src="${finalLogoUrl}" alt="${siteName} Logo" style="max-width:150px;"></a>
                            </div>
                            <div class="content">
                                <h2>${title}</h2>
                                ${bodyContent}
                            </div>
                            <div class="footer">
                                &copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

const connectionUnlockEmailFlow = ai.defineFlow(
  {
    name: 'connectionUnlockEmailFlow',
    inputSchema: ConnectionUnlockEmailInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async (details) => {
    const {
      userName, userEmail, userMobile,
      providerName, providerEmail, providerCategory,
      transactionId, timestamp,
      smtpHost, smtpPort, smtpUser, smtpPass, senderEmail,
      siteName = "Fixbro", logoUrl,
    } = details;

    const adminEmail = "fixbro.in@gmail.com"; 
    
    // 1. Template for User
    const userEmailBody = `
      <p>Hello,</p>
      <p>Thank you for your purchase. You are now connected with the following provider:</p>
      <div class="details-box">
        <p><strong>Category:</strong> ${providerCategory}</p>
        <p><strong>Provider Name:</strong> ${providerName}</p>
      </div>
      <p>You may contact the provider through the platform using the unlocked contact option.</p>
      <div class="notice">
        <h3 style="margin-top:0;">Important Notice</h3>
        <p style="margin-bottom:0;">This platform’s purpose is only to connect users with service providers. We do not manage or control service quality, pricing, work execution, agreements, or transactions.</p>
        <p style="margin-bottom:0;">All service discussions, payments, and decisions are strictly between you and the provider. Please proceed carefully.</p>
        <p style="margin-bottom:0;">We verify provider KYC before onboarding; however, you are responsible for evaluating services and confirming terms before work begins.</p>
      </div>
      <p>Thank you for using our platform.</p>
    `;
    const userHtml = createHtmlTemplate("You’re Connected with a Provider", userEmailBody, siteName, logoUrl);

    // 2. Template for Provider
    const providerEmailBody = `
      <p>Hello,</p>
      <p>A customer has unlocked your profile and may contact you regarding services in the following category:</p>
      <div class="details-box">
        <p><strong>Category:</strong> ${providerCategory}</p>
      </div>
      <p>Please communicate professionally and provide honest service.</p>
      <div class="notice">
        <h3 style="margin-top:0;">Important Notice</h3>
        <p style="margin-bottom:0;">This platform connects users and providers only. We do not control service agreements, pricing, work execution, or transactions.</p>
        <p style="margin-bottom:0;">All dealings are directly between you and the customer. You are responsible for maintaining professional standards and delivering quality service.</p>
      </div>
      <p>We wish you success through our platform.</p>
    `;
    const providerHtml = createHtmlTemplate("A Customer Has Connected With You", providerEmailBody, siteName, logoUrl);

    // 3. Template for Admin
    const adminEmailBody = `
      <p>Hello Admin,</p>
      <p>A new contact unlock purchase has been completed.</p>
      <h3>User Details</h3>
      <div class="details-box">
        <p><strong>Name:</strong> ${userName}</p>
        <p><strong>Mobile Number:</strong> ${userMobile}</p>
        <p><strong>Email:</strong> ${userEmail || 'Not Provided'}</p>
      </div>
      <h3>Provider Details</h3>
      <div class="details-box">
        <p><strong>Provider Name:</strong> ${providerName}</p>
        <p><strong>Category:</strong> ${providerCategory}</p>
      </div>
      <h3>Transaction Details</h3>
      <div class="details-box">
        <p><strong>Transaction ID:</strong> ${transactionId}</p>
        <p><strong>Date & Time:</strong> ${timestamp}</p>
      </div>
      <p>Please review this transaction if required.</p>
    `;
    const adminHtml = createHtmlTemplate("New Contact Unlock Purchase", adminEmailBody, siteName, logoUrl);
    
    const canAttemptRealEmail = smtpHost && smtpPort && smtpUser && smtpPass && senderEmail;
    if (!canAttemptRealEmail) {
        console.warn("SMTP configuration incomplete. Simulating emails for connection unlock.");
        return { success: false, message: "SMTP configuration incomplete. Emails not sent." };
    }
    const portNumber = parseInt(smtpPort, 10);
    const transporter = nodemailer.createTransport({ host: smtpHost, port: portNumber, secure: portNumber === 465, auth: { user: smtpUser, pass: smtpPass }});

    const emailPromises = [];

    // User email promise
    if (userEmail) {
        emailPromises.push(transporter.sendMail({ from: `${siteName} <${senderEmail}>`, to: userEmail, subject: "You’re Connected with a Provider", html: userHtml }));
    } else { console.warn("Skipping user email: address not provided.") }

    // Admin email promise
    emailPromises.push(transporter.sendMail({ from: `${siteName} Admin <${senderEmail}>`, to: adminEmail, subject: "New Contact Unlock Purchase", html: adminHtml }));
    
    // Provider email promise
    if (providerEmail) {
      emailPromises.push(transporter.sendMail({ from: `${siteName} <${senderEmail}>`, to: providerEmail, subject: "A Customer Has Connected With You", html: providerHtml }));
    } else { console.warn("Skipping provider email: address not provided.") }

    try {
      const results = await Promise.allSettled(emailPromises);
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Email at index ${index} failed to send:`, result.reason);
        }
      });
      const allSucceeded = results.every(r => r.status === 'fulfilled');
      return { success: allSucceeded, message: allSucceeded ? "Connection unlock emails sent successfully." : "One or more emails failed to send. Check server logs." };
    } catch (error: any) {
      console.error("Critical error sending connection unlock emails:", error);
      return { success: false, message: `Email sending failed: ${error.message || 'Unknown nodemailer error'}.` };
    }
  }
);
