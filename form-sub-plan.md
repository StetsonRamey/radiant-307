# Plan: Cloudflare Pages Functions for Form Submissions

**Phase 1: Frontend Setup (HTML & Confirmation Page)**

1.  **Modify the Existing HTML Form in `src/contact.webc`:**
    *   The existing form at `src/contact.webc` uses native HTML elements (`<form>`, `<input>`, `<textarea>`, `<button type="submit">`), which is suitable for our needs.
    *   We will modify it to include:
        *   The `method="POST"` attribute.
        *   The `action` attribute, pointing to the Cloudflare Function endpoint (e.g., `/api/submit-form`).
        *   A **honeypot field**: a visually hidden input field. If this field is filled out, the submission is likely spam.
            *   Example: `<input type="text" name="honeypot" style="display:none" aria-hidden="true" autocomplete="off">`
    *   The existing form fields (name, email, message, etc.) will be used.
2.  **Create a Confirmation Page:**
    *   Design and build a simple static HTML page (e.g., `src/contact/thank-you/index.html` or a new path like `src/form-confirmation/index.html`).
    *   This page will thank the user for their submission.
    *   Ensure it's part of the Eleventy build process.

**Phase 2: Backend - Cloudflare Pages Function**

1.  **Set up Cloudflare Pages Function Directory:**
    *   Create a `functions` directory at the root of your project (alongside `src`, `_site`, etc.).
    *   Inside `functions`, create a **TypeScript** file for your form handler (e.g., `functions/submit-form.ts`). This file will define a function that handles requests to `/api/submit-form` (Cloudflare automatically maps file names to routes, removing the `/functions` prefix and any `.js`/`.ts` extension, often prefixing with `/api` by convention but this can be configured).
2.  **Implement the Form Handler Function (in TypeScript):**
    *   **Request Handling:**
        *   The function should only accept `POST` requests.
        *   Parse the incoming form data from the request body (Cloudflare provides utilities for this, typically `request.formData()`).
    *   **Spam Filtering & Validation:**
        *   **Honeypot Check:** If the honeypot field (from Phase 1.1) has a value, reject the submission (or silently ignore it to avoid tipping off spammers).
        *   **Country Check:** Inspect the `CF-IPCountry` request header (automatically added by Cloudflare) to determine the user's country. If it's not "US", reject the submission.
    *   **Data Processing (if valid):**
        *   Extract and sanitize all relevant form fields.
        *   **Email Sending (using Cloudflare Native Email):**
            *   **Prerequisite**: Ensure Cloudflare Email Routing is enabled for your domain and the designated recipient email address is verified within your Cloudflare Email Routing settings.
            *   **Configuration**: Add a `send_email` binding to your `wrangler.toml` (or `.jsonc`) file, configuring it with a name and the verified destination email address.
                *   Example `wrangler.toml` snippet:
                ```toml
                # ... other wrangler configurations ...
                send_email = [
                  {name = "FORM_SUBMISSION_EMAIL", destination_address = "your-verified-recipient@example.com"},
                ]
                ```
            *   Construct the email content (e.g., using `mimetext` to create a MIME message with HTML or plain text body from the form data).
            *   Use the `EmailMessage` object from `cloudflare:email` and the configured binding (e.g., `env.FORM_SUBMISSION_EMAIL.send(message)`) within the TypeScript function to send the email.
            *   The sender address for the email must be an address from the domain where Email Routing is active.
    *   **Response Handling:**
        *   **On Successful Validation & Email Send (PRG Pattern):** Return a `303 See Other` redirect response to the confirmation page URL (from Phase 1.2).
        *   **On Spam/Invalid Submission (e.g., honeypot filled, non-US IP):** Return a `403 Forbidden` status directly. This is efficient for bot traffic and clearly indicates the request will not be processed.

**Phase 3: Configuration, Local Development Setup, & Deployment**

1.  **Set up Wrangler for Local Development:**
    *   **Installation:** If not already installed, install Wrangler CLI (e.g., `npm install --save-dev wrangler` to add it as a project dev dependency, or `npm install -g wrangler` for global installation).
    *   **Authentication:** Log in to your Cloudflare account using `wrangler login`.
    *   **Configuration:** Ensure your `wrangler.toml` is correctly configured, especially with the `send_email` binding we planned (e.g., in the root or a `functions/wrangler.toml`). The `send_email` binding from Phase 2.2 should be defined here.
    *   **Local Dev Server Command:** Prepare the command to run your Eleventy build and serve with Wrangler. This usually involves pointing Wrangler to your output directory (e.g., `_site`) and specifying your build command. Example: `wrangler pages dev _site -- npm run start` (if `npm run start` builds and serves your Eleventy site) or simply `wrangler pages dev _site` if your build artifacts are already present.
    *   **Note on `send_email` binding locally:** Cloudflare's local development support for `send_email` bindings may have limitations (e.g., it might log to console instead of sending an email). Be prepared to verify full email sending functionality after deployment to a Cloudflare Pages preview or production environment.
2.  **Cloudflare Configuration (Dashboard):**
    *   Set up any necessary environment variables in your Cloudflare Pages project settings (though for native email, primary config is `wrangler.toml` and Email Routing setup).
    *   Ensure Email Routing is enabled and the recipient email is verified as per Phase 2.2.
3.  **Eleventy Configuration (if needed):**
    *   Ensure the new confirmation page is correctly processed by Eleventy.
    *   If you create the `functions` directory outside of `src`, ensure your `.gitignore` is updated if necessary (though typically `functions` at the root is fine and intended for Cloudflare).
4.  **Testing:**
    *   Test form submissions with JavaScript enabled and disabled.
    *   Test the honeypot field (e.g., using browser developer tools to make it visible and fill it).
    *   Test submissions from IP addresses outside the US (e.g., using a VPN).
    *   Verify email reception.
    *   Verify the redirect to the confirmation page.

**Key Considerations:**

*   **Error Handling:** Implement robust error handling within the Cloudflare Function (e.g., what happens if the email sending via the native binding fails?).
*   **Security:** While we are not using external API keys for email, ensure any other sensitive data or configurations are handled securely.
*   **Development and Debugging:** Cloudflare provides local development tools (`wrangler`) that can help test Pages Functions before deploying. Ensure your local setup can simulate or correctly interact with the `send_email` binding if possible, or be prepared to test this part thoroughly upon deployment.
*   **Cloudflare Email Routing Setup**: Confirm that Email Routing is correctly configured for your domain and the target recipient email address is verified *before* deploying the function that relies on it.
