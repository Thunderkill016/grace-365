import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-10">
      <p className="text-4xl">🌱</p>
      <h1 className="mt-4 text-3xl font-extrabold leading-tight">
        Grace 365
        <br />
        <span className="text-emerald-600">Khung 365 ngày biết tha</span>
      </h1>
      <p className="mt-4 text-slate-600 leading-relaxed">
        Không phải habit tracker trơn. Mỗi ngày bạn chỉ cần làm{" "}
        <strong>1 micro-task nhỏ</strong> cho kỹ năng mình chọn — và nếu lỡ
        1–2 ngày trong tháng, <strong>streak vẫn không đứt</strong>.
      </p>

      <ul className="mt-6 space-y-3 text-sm text-slate-700">
        <li className="rounded-2xl bg-white p-4 shadow-sm">
          <strong>💚 Biết tha, không biết phạt.</strong> Mỗi tháng được tha
          tối đa 2 ngày — ngày tha vẫn hiện trung thực trên heatmap.
        </li>
        <li className="rounded-2xl bg-white p-4 shadow-sm">
          <strong>🧠 If-then ngay từ đầu.</strong> Bạn cam kết 1 câu
          &ldquo;nếu X thì tôi sẽ Y&rdquo; để não không phải đắn đo mỗi ngày.
        </li>
        <li className="rounded-2xl bg-white p-4 shadow-sm">
          <strong>🗺️ 4 mùa × 91 ngày.</strong> Đích gần đỡ nản, ngày 365 là
          tổng kết năm. Nhật ký công khai để bạn bè cùng theo dõi.
        </li>
      </ul>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/login"
          className="rounded-2xl bg-emerald-600 px-6 py-4 text-center text-lg font-bold text-white shadow-lg shadow-emerald-200"
        >
          Bắt đầu ngày 1 →
        </Link>
        <p className="text-center text-xs text-slate-400">
          Miễn phí · Không cần thẻ · Đăng nhập bằng mã OTP qua email
        </p>
      </div>

      <footer className="mt-auto pt-10 text-center text-xs text-slate-400">
        Thói quen mất trung bình 66 ngày để hình thành — 66 ngày đầu là vùng
        sống còn. Luật duy nhất: không lỡ 2 ngày liền.
      </footer>
    </main>
  );
}
