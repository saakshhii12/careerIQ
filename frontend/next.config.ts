import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Monorepo has lockfiles in backend/ and frontend/; pin Turbopack to this app.
  turbopack: {
    root: frontendRoot,
  },
};

export default nextConfig;
