import type { NextConfig } from "next";
import path from "path";
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd()),
  turbopack: { root: process.cwd() },
};
export default nextConfig;