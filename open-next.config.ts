// Cấu hình OpenNext cho Cloudflare.
// MVP không dùng incremental cache (cacheComponents=false, không có R2/KV),
// nên dùng config tối giản — deploy 0 đồng, không cần tạo thêm resource.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
