"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "sign-in",
      });
      if (res.error) {
        setError(res.error.message ?? "Không gửi được mã. Thử lại nhé.");
      } else {
        setStep("otp");
      }
    } catch {
      setError("Có lỗi xảy ra. Thử lại nhé.");
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authClient.signIn.emailOtp({
        email: email.trim(),
        otp: otp.trim(),
        fetchOptions: {
          onSuccess: () => router.push("/today"),
        },
      });
      if (res.error) {
        setError("Mã chưa đúng hoặc đã hết hạn. Kiểm tra lại nhé.");
      }
    } catch {
      setError("Có lỗi xảy ra. Thử lại nhé.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      {step === "email" ? (
        <form onSubmit={sendCode} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Email của bạn
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@example.com"
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-600 px-6 py-3.5 font-bold text-white disabled:opacity-50"
          >
            {loading ? "Đang gửi…" : "Gửi mã OTP →"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <p className="text-sm text-slate-600">
            Đã gửi mã 6 số tới <strong>{email}</strong> (hết hạn sau 5 phút).
          </p>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Mã OTP</span>
            <input
              inputMode="numeric"
              required
              minLength={6}
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.5em]"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-600 px-6 py-3.5 font-bold text-white disabled:opacity-50"
          >
            {loading ? "Đang kiểm tra…" : "Đăng nhập →"}
          </button>
          <button
            type="button"
            onClick={() => setStep("email")}
            className="w-full text-sm text-slate-500 underline"
          >
            Đổi email khác
          </button>
        </form>
      )}
    </div>
  );
}
