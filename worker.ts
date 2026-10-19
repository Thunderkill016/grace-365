// Entry point của Worker (wrangler.jsonc -> main).
// - fetch: re-export từ opennext worker (.open-next/worker.js, sinh ra bởi `npm run cf:build`)
// - scheduled: cron mỗi giờ -> quét challenge active và gửi mail nhắc.
//
// Chạy `npm run cf:build` trước khi preview/deploy để có .open-next/worker.js.
// @ts-ignore - module chỉ tồn tại sau khi opennext build
import openNextWorker from "./.open-next/worker.js";
import { runHourlyReminders } from "./lib/reminders";
import type { Env } from "./lib/env";

export default {
  fetch: openNextWorker.fetch,
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(runHourlyReminders(env));
  },
} satisfies ExportedHandler<Env>;
