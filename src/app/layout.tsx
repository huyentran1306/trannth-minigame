import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "🕹️ RetroArcade - Classic Games",
  description: "10 classic retro games with modern UI",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-[#0a0a0f] text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
