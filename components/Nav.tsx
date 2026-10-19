import Link from "next/link";

const LINKS = [
  { href: "/today", label: "Hôm nay" },
  { href: "/journey", label: "Hành trình" },
  { href: "/settings", label: "Cài đặt" },
];

export function Nav({ active }: { active?: string }) {
  return (
    <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <Link href="/today" className="text-lg font-extrabold text-emerald-600">
          🌱 Grace 365
        </Link>
        <div className="flex gap-1 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-1.5 font-medium ${
                active === l.href
                  ? "bg-emerald-100 text-emerald-800"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
