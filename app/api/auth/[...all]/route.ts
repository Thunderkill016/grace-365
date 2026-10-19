import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "@/lib/auth";
import type { Env } from "@/lib/env";

async function handler(req: Request): Promise<Response> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const auth = createAuth(env as unknown as Env);
    return await auth.handler(req);
  } catch (e) {
    console.error("[auth] handler error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export async function GET(req: Request): Promise<Response> {
  return handler(req);
}

export async function POST(req: Request): Promise<Response> {
  return handler(req);
}
