# Security rearchitecture status

**Status: incomplete; do not deploy this branch with real student data.** The repository now has a secure direction and several foundational controls, but several application paths still use demo/local data and the database migration has not been applied or validated against the live Supabase project.

| Area | Status | Evidence / remaining work |
|---|---|---|
| SQL injection | Partial | Scanner uses a validated server function. Audit all legacy browser queries and server functions; `sanitizeSearch()` exists but is not consistently used. |
| XSS | Partial | `escapeHtml()` exists. `document.write()` remains in `src/components/app-shell.tsx` and `src/components/driver-dashboard.tsx`; audit/interpolate safely or replace with React print views. |
| CSRF | Partial | TanStack CSRF middleware and POST server functions are configured. Verify deployed server-function behavior and all write handlers. |
| File uploads | Not implemented | No private bucket, per-user Storage RLS, server-side MIME/size checks, magic-byte checks, or signed-photo URL flow. |
| SSRF | Partial | Rule added to `AGENTS.md`; photo/storage and URL code paths still require a full audit. |
| Authentication | Partial | Supabase signup/signin/reset and verified-session guards replace mock auth. Email confirmation and production Auth settings remain manual. |
| Broken object authorization | Partial | QR/pass and selected admin functions check ownership/roles; remaining dashboard operations need server-side authorization review. |
| Rate limiting | Partial | In-memory limiter protects QR and invite functions. It is per-process and does not cover every auth, alert, or location endpoint. Use Redis/WAF in production. |
| Password policy | Partial | UI enforces 10 characters. Configure and enforce the policy in Supabase Auth. |
| MFA | Partial | Admin TOTP enrollment/challenge and `aal2` checks are present in selected routes/functions. Complete audit events and verify inactivity handling. |
| Server-side permissions | Partial | Server role checks and service-role helpers exist; not all admin data mutations have server functions. |
| Row-level security | Partial | New restrictive migration and SQL tests are present. Migration and tests are unrun. Legacy migration scripts still contain historical permissive SQL; do not edit old migrations per instruction. |
| JWT/API secrets | Partial | Root Neon path and server folder removed; env/build checks and secret scanning workflow added. Revoke any historical credentials. gitleaks was unavailable locally. |
| Tokens in local storage | Partial | Capacitor Supabase storage uses secure-storage plugin; web Supabase session uses localStorage under CSP. Other dashboard code still stores application data in localStorage. |
| Default credentials | Partial | Root login no longer uses demo/default credentials. Legacy frontend/mobile copies were removed. Search and history review still needed. |
| CORS | Partial | Express/CORS server removed. Verify Supabase Auth URL allowlists and hosting configuration; no deployed CORS test run. |
| Webhook signatures | Implemented helper | `src/lib/webhook.ts`; no webhook consumer exists. |
| Source maps | Implemented | Vite sourcemaps disabled; build scanner rejects `.map` in output. |
| Sensitive data exposure | Partial | QR now contains only signed token; static/demo records, local attendance/shift data, and print flows still require removal. |
| Vulnerable dependencies | Implemented at check time | `npm audit --omit=dev` reported zero vulnerabilities. Re-run on the deployment lockfile. |

## Database and migration limits

- The allowlist contains only `gsfcuniversity.ac.in`, as confirmed by the user.
- The migration does not copy historical per-month/per-route scan and shift rows into normalized tables because the legacy schemas do not provide reliable normalized foreign keys. They are moved to `legacy` and retained; a reviewed data-mapping migration is still required.
- Export required records from `legacy` before cleanup. `legacy.app_accounts` contains plaintext passwords and should be dropped after export; do not migrate passwords.
- Run the migration and `supabase/tests/rls.test.sql` against a disposable Supabase project, review results, then apply to production with a backup.

## Manual deployment steps

1. Rotate/revoke all Neon, JWT, and other credentials ever committed; historical git blobs are not scrubbed. The historical connection-string paths identified were `.env.example`, `README.md`, `server/db.js`, and `src/lib/neon.ts`.
2. Configure Supabase exact Site URL/redirect allowlist, email confirmation, CAPTCHA, auth rate limits, password policy, one-hour JWT expiry, refresh-token rotation, and MFA requirements as documented in `docs/SECURITY_SETUP.md`.
3. Set the actual production Supabase URL in the CSP report-only header in `vercel.json`, deploy in report-only mode, inspect violations, then remove `-Report-Only` to enforce it.
4. Configure the private photo bucket and Storage RLS; configure Redis or WAF rate limiting; verify trusted proxy IP headers.
5. Configure/payment-verify pass fee state before enabling QR issuance. The approval function currently creates an unpaid pass.
6. Install/configure the Capacitor native plugin in the platform projects and verify Keychain/Keystore behavior in release builds.
7. Run gitleaks in CI and review the complete history scan. Locally, the gitleaks executable was unavailable, so history findings are path-level only.

## Verification

- `npm run typecheck`: passed.
- `npm run test`: 6 Node test cases passed (the requested Vitest runner was not added; the tests use Node's built-in runner).
- `npm run build`: passed, with secret/bundle scan and source-map check.
- `npm audit --omit=dev`: zero vulnerabilities.
- `npm run lint`: failed with 1,364 errors and 7 warnings after removing the diverged copies; most are existing formatting/style violations. This must be fixed before treating CI as green.
