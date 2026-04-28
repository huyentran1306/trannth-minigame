import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "🌸 Kawaii Arcade",
  description: "Super cute mini games collection ✨",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen" style={{ background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #ede9fe 100%)" }}>
        {children}
      </body>
    </html>
  );
}
