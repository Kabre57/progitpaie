import type { NextConfig } from "next";

// ─── Content Security Policy ──────────────────────────────────────────────
// • script-src: 'strict-dynamic' pour Next.js / Turbopack (nonces gérés
//   automatiquement par le framework). 'unsafe-inline' est ignoré quand
//   strict-dynamic est présent sur les navigateurs modernes.
// • style-src: unsafe-inline conservé — Tailwind v4 injecte des styles inline.
// • connect-src: ws:/wss: requis pour Socket.IO en dev et prod.
// • img-src: data: & blob: pour les avatars générés côté client et les exports.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'strict-dynamic' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' ws: wss:",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
]
  .join("; ")
  .trim();

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  // Domaines autorisés pour next/image (préparation future)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.progitpaie.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  // Force l'inclusion de paquets omis par le tracing pnpm sur Windows
  // (symlinks du store virtuel non suivis par Next.js).
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/@swc/helpers/**",
      "./node_modules/@swc/counter/**",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Sécurité OWASP — Content Security Policy
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "0" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
