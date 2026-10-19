import { headers } from "next/headers";
import { connection } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "./auth";
import { createDb } from "./db";
import type { Env } from "./env";

// Helper dùng chung cho server component & route handler: lấy session hiện tại.
// Trả null khi chưa đăng nhập.
export async function getSessionUser() {
  // Dừng prerender ở đây — mọi code sau chỉ chạy ở request time (Next 16 pattern).
  await connection();
  const { env } = await getCloudflareContext({ async: true });
  const typedEnv = env as unknown as Env;
  const auth = createAuth(typedEnv);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return {
    env: typedEnv,
    auth,
    db: createDb(typedEnv),
    user: session.user,
    session: session.session,
  };
}
