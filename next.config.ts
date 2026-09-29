import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Content-Security-Policy : barrière principale contre le XSS.
  // 'unsafe-inline' sur les styles est nécessaire (Next injecte les styles),
  // 'unsafe-eval' est réservé au dev (React refresh).
  //
  // Pas de 'upgrade-insecure-requests' : cette directive est appliquée
  // quelles que soient les conditions et fait passer en https tous les
  // sous-ressources, y compris same-origin. Sur un site servi en http simple
  // (aperçu local, accès réseau local), chaque CSS/JS/fonts passe alors en
  // https et échoue en ERR_SSL_PROTOCOL_ERROR : la page s'affiche sans aucun
  // style. Sur un hébergeur en https (Vercel) elle n'apportait rien de plus,
  // le navigateur bloquant déjà le contenu mixte. HSTS ci-dessus suffit.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com",
      "media-src 'self' blob: https://res.cloudinary.com",
      "font-src 'self' data:",
      "connect-src 'self' https://api.wave.com https://*.supabase.co",
      "frame-src https://api.wave.com https://checkout.wave.com",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.25.32.1", "localhost", "127.0.0.1"],
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
