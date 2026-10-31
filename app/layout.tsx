import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import "./globals.css";

const suit = localFont({
  src: "./fonts/SUIT-Variable.woff2",
  variable: "--font-suit",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "triplog · 여행 기록", template: "%s · triplog" },
  description: "장소와 사진, 하루의 기록을 하나의 다이어리에.",
  appleWebApp: { capable: true, title: "triplog", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#FAF8F4",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={suit.variable}>
      <body>
        <a href="#main-content" className="skip-link">본문으로 건너뛰기</a>
        <div className="app-shell">
          <header className="app-header">
            <Link href="/" className="brand" aria-label="triplog 홈">
              <svg aria-hidden="true" width="34" height="34" viewBox="0 0 48 48" fill="none">
                <rect x="3" y="6" width="34" height="30" rx="3" stroke="currentColor" strokeWidth="1.8" />
                <path d="M3 14h34M10 21l5 4-5 4m10 0h6" stroke="currentColor" strokeWidth="1.8" />
                <path d="m23 37 7-8-3-10 3-2 6 8 7-4 3 2-9 8-1 11-3 1-3-9-6 5z" fill="#B69A7D" stroke="#FAF8F4" strokeWidth="1.5" />
              </svg>
              <span>triplog</span>
            </Link>
            <span className="text-sm text-muted">나의 여행 수첩</span>
          </header>
          <Navigation />
          <main id="main-content" tabIndex={-1}>{children}</main>
          <footer className="app-footer">개발 중인 화면입니다. 아직 기록을 저장할 수 없어요.</footer>
        </div>
      </body>
    </html>
  );
}
