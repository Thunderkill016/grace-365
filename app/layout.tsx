import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grace 365 — Khung 365 ngày biết tha",
  description:
    "Mỗi ngày 1 micro-task cho kỹ năng bạn chọn. Lỡ 1–2 ngày/tháng vẫn không đứt streak.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
