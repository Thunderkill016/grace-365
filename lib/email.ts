import { Resend } from "resend";
import type { Env } from "./env";

// Gửi mail qua Resend (free 100 mail/ngày).
// Chưa có RESEND_API_KEY => log ra console và bỏ qua êm (chỉ dùng cho dev).
export async function sendEmail(
  env: Env,
  to: string,
  subject: string,
  text: string,
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.log(`[email:dev] to=${to} subject=${subject}\n${text}`);
    return;
  }
  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM ?? "Grace 365 <onboarding@resend.dev>",
    to,
    subject,
    text,
  });
  if (error) {
    console.error(`[email] gửi thất bại tới ${to}:`, error.message);
  }
}
