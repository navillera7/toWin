import "./globals.css";

export const metadata = {
  title: "2026 지방선거 예측",
  description: "2026년 대한민국 지방선거의 각 지역별 예측을 만들어보세요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
