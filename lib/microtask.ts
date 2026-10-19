// MVP: micro-task gợi ý KHÔNG dùng AI (SPEC "Chưa làm": AI sinh micro-task).
// Mẫu xoay vòng theo chỉ số ngày — 0 đồng, deterministic, đủ dùng cho MVP.

const TEMPLATES = [
  "Ôn lại 1 khái niệm cốt lõi của {skill} trong 2 phút",
  "Làm 1 bài tập nhỏ của {skill} — không cần hoàn hảo, chỉ cần xong",
  "Viết 3 dòng tóm tắt điều đã học về {skill} hôm qua",
  "Tìm 1 ví dụ thực tế áp dụng {skill} vào việc đang làm",
  "Luyện đúng 1 kỹ thuật nhỏ của {skill}, lặp lại 3 lần",
  "Đọc 1 trang tài liệu về {skill} rồi gạch đầu dòng ý chính",
  "Tự kiểm tra: giải thích {skill} cho người mới trong 60 giây",
  "Sửa 1 lỗi / 1 điểm yếu nhỏ đã ghi chú về {skill}",
  "Xem lại ghi chú cũ về {skill}, khoanh 1 ý quan trọng nhất",
  "Đặt 1 câu hỏi khó về {skill} rồi tự trả lời bằng ví dụ",
];

/** Gợi ý micro-task cho ngày thứ dayIndex (1-based) của challenge. */
export function microTaskFor(skill: string, dayIndex: number): string {
  const t = TEMPLATES[((dayIndex - 1) % TEMPLATES.length + TEMPLATES.length) % TEMPLATES.length];
  return t.replaceAll("{skill}", skill);
}
