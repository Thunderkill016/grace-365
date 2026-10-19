# Grace 365 🌱

Khung 365 ngày **biết tha**: mỗi ngày 1 micro-task cho kỹ năng bạn chọn + nhật ký công khai.
Điểm khác biệt với habit tracker trơn: tha 1–2 ngày/tháng (streak không đứt),
luật không lỡ 2 ngày liền, onboarding bắt buộc 1 câu if-then, 4 "mùa" × 91 ngày.

Stack 0 đồng: **Next.js 16 (App Router) + Cloudflare Workers** (qua `@opennextjs/cloudflare`)
+ **D1 (SQLite)** + **Drizzle ORM** + **better-auth** (OTP email 6 số, KHÔNG magic-link) +
**Resend** (free 100 mail/ngày) + **Cron Triggers** nhắc giờ.

---

## Chạy local

```bash
cd app
npm install

# 1. Copy biến môi trường dev (KHÔNG commit file thật)
cp .dev.vars.example .dev.vars
#    Sửa BETTER_AUTH_SECRET: openssl rand -base64 32
#    Chưa có RESEND_API_KEY thì OTP in ra console (dev) — vẫn test được full flow.

# 2. Sinh migration (đã có sẵn trong drizzle/, chạy lại khi đổi schema)
npm run db:generate

# 3. Build Next + build worker Cloudflare
npm run cf:build

# 4. Tạo bảng D1 local + chạy thử worker local
npm run db:migrate:local
npx wrangler dev --port 8787
#    Mở http://127.0.0.1:8787
#    Test cron local: curl "http://127.0.0.1:8787/cdn-cgi/local/scheduled"
```

`npm run dev` (next dev) cũng chạy được nhờ `initOpenNextCloudflareForDev()`,
nhưng D1 binding chỉ đầy đủ khi chạy qua `wrangler dev` / `npm run preview`.

## Tạo D1 + migrate + deploy (cần Cloudflare login)

```bash
# 1. Đăng nhập 1 lần
npx wrangler login

# 2. Tạo D1 database
npx wrangler d1 create grace-365-db
#    -> copy database_id dán vào wrangler.jsonc (thay REPLACE_AFTER_WRANGLER_D1_CREATE)

# 3. Chạy migration lên D1 remote
npm run db:migrate:remote

# 4. Đặt secrets (KHÔNG hardcode, KHÔNG commit)
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put RESEND_API_KEY        # optional — thiếu thì OTP log ra console
#    (vars thường như EMAIL_FROM, BETTER_AUTH_URL đặt trong wrangler.jsonc)

# 5. Deploy
npm run deploy
```

## Biến môi trường

| Biến               | Bắt buộc | Mô tả                                                        |
| ------------------ | -------- | ------------------------------------------------------------ |
| `BETTER_AUTH_SECRET` | ✅      | Secret ký session (32+ ký tự ngẫu nhiên), đặt bằng `wrangler secret put` |
| `RESEND_API_KEY`     | ❌      | Thiếu thì mail OTP/nhắc nhở chỉ log ra console (dev)         |
| `BETTER_AUTH_URL`    | ❌      | URL public của app (vd `https://grace-365.xxx.workers.dev`)   |
| `EMAIL_FROM`         | ❌      | Địa chỉ gửi mail. Resend free chưa verify domain: dùng `Grace 365 <onboarding@resend.dev>` |

Binding: `DB` (D1). Cron: `0 * * * *` (mỗi giờ) → `scheduled()` trong `worker.ts`.

## Kiến trúc nhanh

```
app/                  Trang (landing, login, onboarding, today, journey, u/[handle], settings)
app/api/              auth/[...all] (better-auth) · checkin · grace · streak · heatmap · profile/setup · settings
lib/
  schema.ts           Drizzle schema: bảng better-auth (user/session/account/verification)
                      + profile · challenge · check_in (unique challengeId+localDate) · push_subscription
  auth.ts             createAuth(env) per-request — KHÔNG instance global
  session.ts          getSessionUser() — await connection() để dừng prerender (Next 16 pattern)
  dates.ts            "Hôm nay" theo tz user, cắt ngày 03:00 (chỉ dùng Intl, không Node API)
  streak.ts           Query streak gaps-and-islands ĐÚNG mẫu SPEC (không lưu bộ đếm)
  season.ts           4 mùa × 91 ngày, mốc mùa 1: 7/21/40/66
  microtask.ts        Gợi ý micro-task xoay vòng (deterministic, chưa dùng AI)
  reminders.ts        Logic cron nhắc giờ (không import next/* để worker bundle được)
worker.ts             Entry worker: fetch = opennext worker + scheduled() cron
drizzle/              Migration SQL (drizzle-kit generate)
wrangler.jsonc        main=worker.ts, D1 binding DB, nodejs_compat, cron hourly
```

## Luật nghiệp vụ (từ SPEC — không tự ý đổi)

1. "Hôm nay" tính ở server theo timezone user, cắt ngày lúc 03:00.
2. Streak KHÔNG lưu bộ đếm — tính live bằng gaps-and-islands mỗi lần đọc.
3. Ngày tha là hàng riêng `kind='grace'`; quota **tối đa 2 ngày/tháng**.
4. Streak sống nếu ngày active gần nhất ≥ hôm nay − 1.
5. Onboarding bắt buộc câu if-then ≥ 10 ký tự.
6. 4 mùa × 91 ngày = 364, ngày 365 tổng kết. Mốc mùa 1: 7/21/40/66.
7. 1 user = 1 challenge active (MVP).

## Chưa làm

- Xếp hạng / bảng thành tích
- Nhóm bạn, friend streak
- Thu phí / thanh toán
- App native (iOS/Android)
- Web push iOS (SPEC ghi: iOS chỉ nhận sau Add to Home Screen)
- AI sinh micro-task (hiện tại: mẫu xoay vòng deterministic, 0 đồng)
- Giảm nhắc dần sau ngày ~66 (SPEC nghiên cứu có nhắc, MVP chưa implement)

## Ghi chú kỹ thuật

- `cacheComponents: false` trong `next.config.ts`: theo docs Next 16, Cache Components
  yêu cầu Node.js runtime — không đảm bảo trên Workers (workerd). MVP dùng classic
  dynamic rendering cho chắc; đây là quyết định config, không đổi luật nghiệp vụ.
- better-auth ≥ 1.7.7 (CVE magic-link đã fix ở bản này); chỉ dùng plugin `emailOTP`,
  tuyệt đối không thêm magic-link plugin.
- Cron chạy qua wrapper `worker.ts` (re-export fetch của opennext worker + `scheduled()`),
  vì opennext worker không tự có scheduled handler.
- Không dùng Node API trong route handler/edge; gửi mail qua Resend SDK (fetch-based).
