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
  experimental: {
    serverActions: {
      // Default Next.js è 1MB — troppo poco per form che caricano più
      // immagini nella stessa submit (es. ArchivePost: thumbnail + hero +
      // OG + Twitter, fino a 2MB l'una dopo la compressione client-side).
      // Cloudflare Workers accetta richieste fino a 100MB, quindi il vincolo
      // reale è qui, non lato piattaforma.
      bodySizeLimit: "10mb",
    },
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
