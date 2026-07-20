/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.typamine.com",
      },
    ],
  },
};

export default nextConfig;

if (process.env.NODE_ENV === 'development') {
  // Deve essere atteso: senza await, next dev può iniziare a servire richieste
  // prima che il contesto Cloudflare sia pronto. getCloudflareContext() fallirebbe
  // silenziosamente su quelle prime richieste, e lib/prisma.ts ne mette in cache
  // il fallback su sqlite locale per tutta la vita del processo.
  const { initOpenNextCloudflareForDev } = await import('@opennextjs/cloudflare');
  await initOpenNextCloudflareForDev({
    experimental: {
      remoteBindings: process.env.DEV_REMOTE === 'true'
    }
  });
}
