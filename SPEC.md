# Grace 365 — SPEC (MVP)

Khung 365 ngày "biết tha": mỗi ngày 1 micro-task cho kỹ năng user chọn + nhật ký công khai.
Điểm khác biệt với habit tracker trơn: tha 1–2 ngày/tháng (streak không đứt), luật không lỡ 2 ngày liền,
onboarding bắt buộc 1 câu if-then, 4 "mùa" ~91 ngày.

## Stack (0 đồng, Cloudflare fullstack)

- Next.js 16 App Router + React 19, deploy Cloudflare Workers qua `@opennextjs/cloudflare`
- D1 (SQLite) + Drizzle ORM (`drizzle-orm/d1`), migration SQL trong `drizzle/`
- Auth: `better-auth` **>= 1.7.7** (bản cũ có CVE GHSA-965c-763c-88jm ở magic-link) —
  dùng plugin `emailOTP` (mã 6 số), KHÔNG dùng magic-link plugin
- Gửi mail: Resend (free 100 mail/ngày); chưa có `RESEND_API_KEY` thì log OTP ra console (chỉ dev)
- Nhắc nhở: Cron Triggers chạy mỗi giờ
- UI: Tailwind, mobile-first, **tiếng Việt**, tông sáng "đẹp, hiện đại, tươi sáng, tin cậy"
- `wrangler.jsonc`: binding D1 `DB`, `nodejs_compat`, cron `0 * * * *`

## Data model (Drizzle, D1)

Bảng của better-auth (user, session, account, verification) do adapter sở hữu.

```ts
profile:  id (fk user.id), handle unique, timezone default 'Asia/Ho_Chi_Minh', created_at
challenge: id, userId fk, skill text, minutesPerDay int, remindAt text 'HH:MM',
           ifThen text NOT NULL, startsOn text 'YYYY-MM-DD', status 'active|paused|done',
           createdAt
checkIn:  id, challengeId fk, localDate text 'YYYY-MM-DD', kind 'done|grace',
           note text, minutes int, microTask text, createdAt,
           UNIQUE(challengeId, localDate)   // bấm đúp không nhân đôi
pushSubscription: id, userId fk, endpoint unique, p256dh, auth  // v1, scaffold bảng
```

## Luật nghiệp vụ (KHÔNG được tự ý đổi)

1. **"Hôm nay"** tính ở server theo timezone của user, cắt ngày lúc **03:00**:
   `today = date((now - 3h) AT TIME ZONE tz)` — dân học khuya không bị tính nhầm ngày.
2. **Streak KHÔNG lưu bộ đếm.** Tính bằng gaps-and-islands trên `check_in` mỗi lần đọc
   (tránh lệch khi race condition, đổi múi giờ, sửa tay).
3. Ngày được tha là hàng riêng `kind='grace'` — heatmap vẫn trung thực, streak vẫn nối.
   Quota: **tối đa 2 ngày grace / tháng dương lịch** (đếm `strftime('%Y-%m', localDate)`).
4. Streak còn sống nếu ngày active gần nhất >= hôm nay - 1. Check-in hôm nay chưa có vẫn giữ streak hôm qua.
5. Onboarding bắt buộc nhập 1 câu if-then ("Nếu X thì tôi sẽ Y"), tối thiểu 10 ký tự mới cho qua.
6. 4 mùa x 91 ngày = 364, ngày 365 là tổng kết năm. Mốc mùa 1: 7 / 21 / 40 / 66.
7. Mỗi challenge đang active: 1 user = 1 challenge active (đơn giản MVP).

## Query streak (SQLite/D1) — dùng đúng mẫu này

```sql
-- :cid, :today ('YYYY-MM-DD' theo tz user)
WITH days AS (
  SELECT localDate,
         date(localDate, '-' || ROW_NUMBER() OVER (ORDER BY localDate) || ' days') AS grp,
         kind
  FROM check_in
  WHERE challengeId = :cid AND kind IN ('done','grace') AND localDate <= :today
),
islands AS (
  SELECT grp, MAX(localDate) AS maxD, COUNT(*) AS len,
         SUM(kind = 'done') AS doneN
  FROM days GROUP BY grp
)
SELECT len AS streak, doneN FROM islands
WHERE maxD = (SELECT MAX(localDate) FROM days)
  AND maxD >= date(:today, '-1 day');
-- không có hàng nào => streak = 0
```

## Trang

- `/` landing: giải thích "biết tha", CTA bắt đầu
- `/login` nhập email → nhập mã OTP 6 số
- `/onboarding` (bắt buộc sau login lần đầu): kỹ năng, phút/ngày, giờ nhắc, câu if-then
- `/today` check-in 1 chạm ("Xong hôm nay"), micro-task gợi ý, 1 dòng ghi chú, nút "Xin tha hôm nay" (hiện quota còn lại)
- `/journey` heatmap 365 ô theo mùa, mốc 7/21/40/66, streak hiện tại
- `/u/[handle]` trang công khai: heatmap + streak (không lộ email, không lộ ghi chú riêng — note chỉ hiện nếu user bật "công khai ghi chú")
- `/settings` đổi timezone, giờ nhắc, handle, tạm dừng/kết thúc challenge

## API

- `/api/auth/[...all]` — better-auth handler (per-request `createAuth(env)` qua `getCloudflareContext`)
- `POST /api/checkin` { minutes?, note? } — upsert theo unique(challengeId, localDate)
- `POST /api/grace` — kiểm tra quota tháng rồi insert kind='grace'
- `GET /api/streak`, `GET /api/heatmap?season=` — trả JSON cho UI
- Cron `scheduled()`: mỗi giờ, với mỗi challenge active: tính giờ địa phương của user,
  nếu trong ±30 phút của remindAt và chưa check-in hôm nay → gửi mail nhắc qua Resend

## Definition of done

- `npm run build` xanh; `opennextjs-cloudflare build` xanh; `drizzle-kit generate` ra migration SQL
- README.md: cách chạy local (`wrangler dev`), tạo D1, migrate, deploy, biến môi trường cần
- Không dùng Node API trong middleware/edge; không hardcode secret
- Chưa làm (ghi rõ trong README "Chưa làm"): xếp hạng, nhóm bạn, thu phí, app native, web push iOS, AI sinh micro-task
