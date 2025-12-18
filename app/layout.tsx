import "./globals.css";

export const metadata = {
  title: "Korea Local Elections Map",
  description: "270toWin-style interactive map for Korean local elections (governor + sigungu).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
