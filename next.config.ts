import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// NOTE: cacheComponents giữ false — theo docs Next 16, Cache Components yêu cầu
// Node.js runtime, không đảm bảo chạy đúng trên Cloudflare Workers (workerd).
// MVP dùng classic dynamic rendering cho chắc.
const nextConfig: NextConfig = {
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

initOpenNextCloudflareForDev();

export default nextConfig;
