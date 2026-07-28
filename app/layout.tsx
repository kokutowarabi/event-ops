import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "星浜祭 EventOps",
  description: "架空の星浜大学・星浜祭を題材に、参加団体、企画、シフト、投票を一元管理するポートフォリオアプリです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
