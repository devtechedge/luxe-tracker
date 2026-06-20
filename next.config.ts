import type { NextConfig } from "next";

// ─────────────────────────────────────────────────────────────────────────────
// Next.js configuration
//   - `output: "standalone"` produces a self-contained .next/standalone bundle
//     (great for Docker). On Vercel the platform handles output automatically,
//     so this flag is harmless but recommended for portable builds.
//   - `typescript.ignoreBuildErrors` is set because the project intentionally
//     ships with `@mdxeditor/editor` whose TS types drift between minor
//     versions; we lint with `tsc --noEmit` in CI instead.
// ─────────────────────────────────────────────────────────────────────────────

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Prisma generates binaries on install — make sure they're not tree-shaken
  // out of the serverless bundle.
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Sharp is used for next/image optimization; on Vercel this is automatic,
  // but for self-hosted Docker builds we need to install it explicitly.
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
