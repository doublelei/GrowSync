import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "GrowSync",
  description: "学业追踪与奖励系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col items-center bg-background text-foreground">
        <main className="w-full min-h-[100dvh] flex flex-col relative overflow-x-hidden">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}
