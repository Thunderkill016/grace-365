import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb } from "./db";
import * as schema from "./schema";
import type { Env } from "./env";

// Per-request createAuth(env) — gọi trong route handler / server component qua
// getCloudflareContext(). KHÔNG tạo instance global (env chỉ có ở request time).
// Đăng nhập bằng Google OAuth (theo yêu cầu của Hoàng, thay email OTP).
export function createAuth(env: Env) {
  const db = createDb(env);
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
      camelCase: true,
    }),
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID as string,
        clientSecret: env.GOOGLE_CLIENT_SECRET as string,
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
