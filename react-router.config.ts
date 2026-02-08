import type { Config } from "@react-router/dev/config";

export default {
  // Disable SSR for Vercel compatibility - runs as SPA
  ssr: false,
} satisfies Config;
