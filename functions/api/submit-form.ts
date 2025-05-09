import type { PagesFunction } from '@cloudflare/workers-types';
import { Resend } from 'resend';

interface Env {
    RESEND_API_KEY: string;
    // Add other bindings if needed, like KV or D1
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env, data /* data is Record<string, unknown> */ } = context;

    try {
        const rawFormData = await request.formData();
        const body: Record<string, string | File> = Object.fromEntries(rawFormData);

        // Spam Filtering
        const honeypotValue = body.honeypot;
        if (honeypotValue && typeof honeypotValue === 'string' && honeypotValue.trim() !== '') {
            console.log("Honeypot field filled. Marking as spam."); // Keep spam log
            return new Response("Forbidden", { status: 403 });
        }
        const country = request.headers.get("CF-IPCountry")?.toUpperCase();
        // console.log("Submitter Country (CF-IPCountry):", country); // Cleanup: Commented out
        if (country !== "US" && country !== undefined && country !== "T1") {
            console.log(`Submission from non-US country (${country}). Rejecting.`); // Keep rejection log
            return new Response("Forbidden: Submissions accepted from US only.", { status: 403 });
        }

        // 3. Email Sending (Using Resend)

        if (!env.RESEND_API_KEY) {
            console.error("RESEND_API_KEY is not set in environment secrets."); // Keep error log
            return new Response("Internal Server Error: Email configuration missing", { status: 500 });
        }

        const resend = new Resend(env.RESEND_API_KEY);

        const firstName = body['first-name'];
        const subjectName = (typeof firstName === 'string' && firstName) ? firstName : 'N/A';
        const emailSubject = `New Contact Form Submission from ${subjectName}`;

        // Format Phone Number
        let formattedPhone = '';
        const phoneValue = body.phone;
        if (phoneValue && typeof phoneValue === 'string') {
            const digits = phoneValue.replace(/\D/g, ''); // Remove non-digits
            if (digits.length === 10) {
                formattedPhone = `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 10)}`;
            } else {
                formattedPhone = phoneValue; // Keep original if not 10 digits
            }
        }

        let emailBodyHtml = "<html><body>";
        emailBodyHtml += "<h1>New Contact Form Submission</h1>";
        emailBodyHtml += "<p>You have received a new message from your website contact form:</p>";
        emailBodyHtml += "<table border=\"1\" cellpadding=\"5\" cellspacing=\"0\" style=\"border-collapse: collapse;\">";
        emailBodyHtml += "<thead><tr><th colspan=\"2\" style=\"background-color: #f0f0f0; text-align: left; padding: 8px;\">Submission Details</th></tr></thead><tbody>";

        for (const [key, value] of Object.entries(body)) {
            let displayValue = typeof value === 'string' ? value : (value instanceof File ? `[File: ${value.name}]` : '');
            if (key === 'phone' && formattedPhone) {
                displayValue = formattedPhone; // Use formatted phone number
            }

            if (key !== 'honeypot' && displayValue) {
                const prettyKey = key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                emailBodyHtml += `<tr><td style=\"padding: 8px; background-color: #f9f9f9; font-weight: bold;\">${prettyKey}:</td><td style=\"padding: 8px;\">${displayValue}</td></tr>`;
            }
        }
        emailBodyHtml += "</tbody></table>";
        emailBodyHtml += "<p style=\"margin-top: 15px; font-size: 0.9em; color: #555;\">This email was sent from the contact form on radiant307.com.</p>";
        emailBodyHtml += "</body></html>";

        const { data: sendData, error: sendError } = await resend.emails.send({
            from: 'Radiant 307 Leads <forms@leads.radiant307.com>',
            to: ['radiant307@gmail.com', 'me@stetson.dev'],
            subject: emailSubject,
            html: emailBodyHtml
        });

        if (sendError) {
            console.error("Error sending email via Resend:", sendError); // Keep error log
            return new Response(`Error sending email: ${sendError.message}`, { status: 500 });
        }


        // 4. Response Handling (PRG Pattern)
        const thankYouUrl = new URL(request.url).origin + "/contact/thank-you/";
        return Response.redirect(thankYouUrl, 303);

    } catch (error: any) {
        console.error("Error processing form submission:", error); // Keep error log
        let errorMessage = "Error processing request";
        if (error.message) { errorMessage += `: ${error.message}`; }
        if (error.cause) { errorMessage += ` | Cause: ${JSON.stringify(error.cause)}`; }
        return new Response(errorMessage, { status: 500 });
    }
}; 
