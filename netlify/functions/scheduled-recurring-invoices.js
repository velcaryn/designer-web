/**
 * Netlify Scheduled Function: runs the recurring-invoice generator
 * (app/api/cron/generate-recurring-invoices/route.js) every hour, on the
 * schedule set in netlify.toml.
 *
 * It does no work itself. It calls the API route, which holds all the logic
 * and the tenant scoping, with the Bearer CRON_SECRET the route requires.
 * CRON_SECRET must be set in the site's Netlify environment variables.
 */
exports.handler = async () => {
    const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL;
    const cronSecret = process.env.CRON_SECRET;

    if (!siteUrl) {
        console.error('[scheduled-recurring-invoices] No site URL available (process.env.URL missing).');
        return { statusCode: 500, body: 'Missing site URL' };
    }
    if (!cronSecret) {
        console.error('[scheduled-recurring-invoices] CRON_SECRET is not set, refusing to call the cron endpoint unauthenticated.');
        return { statusCode: 500, body: 'Missing CRON_SECRET' };
    }

    try {
        const res = await fetch(`${siteUrl}/api/cron/generate-recurring-invoices`, {
            headers: { Authorization: `Bearer ${cronSecret}` },
        });
        const body = await res.text();
        console.log(`[scheduled-recurring-invoices] status=${res.status} body=${body}`);
        return { statusCode: res.status, body };
    } catch (err) {
        console.error('[scheduled-recurring-invoices] Failed to call cron endpoint:', err);
        return { statusCode: 500, body: 'Failed to reach cron endpoint' };
    }
};
