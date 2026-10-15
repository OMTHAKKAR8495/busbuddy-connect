# Security setup checklist

## Supabase project settings

Apply the new migration set before enabling production traffic. Confirm the signup allowlist entry `gsfcuniversity.ac.in` is correct and add any approved domains to `public.allowed_email_domains` through a controlled migration.

In Supabase Auth settings:

- Require email confirmation and use the exact production Site URL and redirect allowlist entries.
- Set password minimum length to 10 characters; require strong passwords if supported.
- Configure the lowest practical sign-in, token refresh, and OTP rate limits. Enable CAPTCHA for signup and password recovery.
- Set access-token lifetime to 3600 seconds and enable refresh-token rotation and reuse detection.
- Require TOTP MFA for administrator accounts. Assign roles only through a protected server function using the service-role key after verifying the caller is an MFA-authenticated admin.
- Restrict Storage to private buckets and configure per-user folder policies, MIME allowlists, file-size limits, and short-lived signed URLs before enabling photo uploads.

Use only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in browser builds. Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `QR_SIGNING_SECRET` only in the server deployment environment. Rotate any credential previously committed to git.

## Deployment headers

Replace `YOUR_PROJECT` in `vercel.json` with the exact Supabase project reference, then deploy with `Content-Security-Policy-Report-Only`. Review browser reports and fix legitimate violations before changing the header to `Content-Security-Policy` to enforce it. Configure the Supabase Auth Site URL and redirect URLs to the exact production domains; do not use wildcards.

## Remaining operations

- Install and configure a Capacitor Keychain/Keystore storage adapter before using authenticated sessions in native builds; the web client currently uses Supabase's browser session storage.
- Configure production rate limiting with Upstash Redis or a WAF. The in-process limiter is not safe across serverless instances.
- Run the SQL/RLS verification script against a staging Supabase project before applying to production. Review the migration against the live schema and export any legacy data needed before dropping `legacy.app_accounts`.
- Review and resolve the current `npm audit --omit=dev` findings before release.

## SSRF rule

Server code must never fetch a URL supplied by a user. Store photos as paths in the private Supabase Storage bucket, validate upload bytes against an allowlist, and return only short-lived signed URLs.
