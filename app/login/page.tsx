import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-10">
      <Link href="/" className="text-lg font-extrabold text-emerald-600">
        🌱 Grace 365
      </Link>
      <h1 className="mt-6 text-2xl font-extrabold">Đăng nhập</h1>
      <p className="mt-2 text-sm text-slate-600">
        Nhập email, chúng tôi gửi mã 6 số — không mật khẩu, không link ma thuật.
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </main>
  );
}
