import type { NextConfig } from "next";

// Backend en desarrollo. Con `DIAMANTE_API` (p. ej. https://back-diamante.mania-agent.online o
// http://localhost:8080), Next reenvía `/api/*` y `/media/*` a ese backend: el navegador solo
// habla con Next (un solo origen), así la cookie de sesión y la verificación de `Origin` del
// backend funcionan sin CORS. El backend debe permitir el origen de Next en `DIAMANTE_ORIGENES`
// (ver `src/api/api.md`, sección 2). En producción no se define: el proxy del servidor (Traefik)
// manda esas rutas al backend antes de llegar a Next.
const backend = process.env.DIAMANTE_API?.trim().replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backend) return [];
    return [
      { source: "/api/:ruta*", destination: `${backend}/api/:ruta*` },
      { source: "/media/:ruta*", destination: `${backend}/media/:ruta*` },
    ];
  },
  experimental: {
    agentFeedback: true,
    // La app se renderiza solo en el navegador (`browser()` en el layout raíz),
    // así que solo se validan los segmentos que exporten `instant` explícitamente.
    instantInsights: {
      validationLevel: "manual-warning",
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
