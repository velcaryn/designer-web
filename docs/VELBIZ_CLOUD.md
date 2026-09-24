# VelBiz Cloud

The ERP (invoicing, accounting, CRM, inventory, HR) sold as VelBiz Cloud. It
was built in the Velcaryn repo as "Velcaryn Cloud" and moved here in September
2026. The marketing page for it is `/cloud`; everything below is the product.

## Where it lives

| Path | What |
|---|---|
| `app/(erp)/layout.js` | The ERP's own root layout. Separate from the site's so Tailwind and the ERP's reset never load together; moving between them is a full page load. |
| `app/(erp)/cloud/login`, `app/(erp)/cloud/dashboard/**` | The tenant app. |
| `app/(erp)/cloud/doc/[docNumber]/[secretKey]` | The public link a tenant sends a customer. |
| `app/(erp)/admin/**` | The admin area: approve signups, manage tenants. Google sign-in with the velbiz.com Google account's OAuth client; allow-list in `lib/auth.js`. |
| `app/api/cloud/**`, `app/api/admin/cloud/**` | The APIs. |
| `app/api/cron/generate-recurring-invoices` + `netlify/functions/scheduled-recurring-invoices.js` | Hourly recurring invoices. |
| `components/cloud-app/`, `components/dashboard/`, `components/admin/` | ERP components. (`components/cloud/` is the marketing page's.) |
| `lib/` | `mongodb`, `cloudAuth`, `permissions`, `cloud/entitlements`, `cloud/accounting/*`, `templateEngine`, `pdfBrowser`, and helpers. |
| `app/global-not-found.js` | The 404 for unmatched URLs, needed because there are two root layouts. |

## How a tenant comes to exist

1. A business fills in `/cloud/onboarding`. `app/api/cloud/onboarding` records
   it as a tenant with status `pending_approval` (`lib/cloud/pendingTenant.js`)
   and sends the Telegram alert.
2. An admin approves it at `/admin/cloud/requests`, setting the username,
   password, document prefix and brand colour. Only now can anyone sign in.
3. The tenant signs in at `/cloud/login`.

## The database

`lib/mongodb.js` decides the database once, from `CLOUD_DB_NAME`, and every
`client.db(...)` call resolves to it whatever name the code passes. Unset, it
is `velbiz_dev`. The live database is used only where `CLOUD_DB_NAME=velbiz`
is set, which is the production Netlify site and nowhere else. A laptop, even
running `next start`, cannot reach it by accident.

Indexes: `node --env-file=.env.local scripts/setup-indexes.cjs` (idempotent).

## Environment variables (Netlify, production)

| Variable | Value |
|---|---|
| `MONGODB_URI` | The Atlas connection string. |
| `CLOUD_DB_NAME` | `velbiz` |
| `CLOUD_JWT_SECRET` | A long random string, not shared with anything else. Required: without it production refuses to sign anyone in. |
| `NEXTAUTH_SECRET` | A different long random string, for the admin sign-in. |
| `NEXTAUTH_URL` | `https://velbiz.com` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | A Google OAuth client whose authorised redirect URI is `https://velbiz.com/api/auth/callback/google`. |
| `CRON_SECRET` | A long random string; the scheduled function sends it to the cron route. |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `SITE_HOST` | Already set for the site's forms. |

## Checks

`npm run verify` includes `check:accounting` (the general-ledger guards) and
`check:entitlements` (plan ceiling enforced before the owner bypass, and the
module lists in step). Lint turns off `react-hooks/set-state-in-effect` for the
ERP folders only; see `eslint.config.mjs` for why.

The other scripts are for development data and diagnosis and default to
`velbiz_dev`: `seed-analytics-demo.cjs`, `update-seed-costprice.cjs`,
`backfill-unposted-invoices.mjs`, `migrate-cashbook-to-vouchers.mjs`,
`fix-duplicate-vouchers.mjs`, `fix-logo-backdrops.mjs`,
`run-business-cycle.mjs`, `render-sample-pdf.mjs`, and the browser checks
`verify-accounting*.mjs` and `snapshot-accounting.mjs` (which expect
`npm run dev` on port 4000).
