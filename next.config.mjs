/** @type {import('next').NextConfig} */
const nextConfig = {
    /*
     * The two case-study images are the only raster assets on the site and
     * both are screenshots, so AVIF first is a real saving on a page whose
     * whole pitch is load speed.
     */
    images: {
        formats: ['image/avif', 'image/webp'],
    },
    poweredByHeader: false,
    allowedDevOrigins: ['*.trycloudflare.com', 'statutory-src-packs-senators.trycloudflare.com'],
};

export default nextConfig;
