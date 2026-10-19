import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { createDb } from "./db";
import * as schema from "./schema";
import type { Env } from "./env";
import { sendEmail } from "./email";

// Per-request createAuth(env) — gọi trong route handler / server component qua
// getCloudflareContext(). KHÔNG tạo instance global (env chỉ có ở request time).
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
    plugins: [
      // emailOTP (mã 6 số). TUYỆT ĐỐI không dùng magic-link plugin (CVE GHSA-965c-763c-88jm).
      emailOTP({
        otpLength: 6,
        expiresIn: 300, // 5 phút
        async sendVerificationOTP({ email, otp, type }) {
          if (type !== "sign-in" && type !== "email-verification") return;
          await sendEmail(
            env,
            email,
            "Mã đăng nhập Grace 365",
            `Mã OTP của bạn là: ${otp}\nMã hết hạn sau 5 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.`,
          );
        },
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
