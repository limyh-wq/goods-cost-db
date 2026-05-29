import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "굿즈 제작 원가·공급가 DB",
  description: "굿즈 제작건의 원가·공급가·사양·파일 관리 내부 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-6 px-4">
            <Link href="/records" className="text-base font-semibold">
              굿즈 원가·공급가 DB
            </Link>
            <nav className="flex items-center gap-4 text-sm text-gray-600">
              <Link href="/records" className="hover:text-gray-900">
                제작건 목록
              </Link>
              <Link href="/records/new" className="hover:text-gray-900">
                새 제작건
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
