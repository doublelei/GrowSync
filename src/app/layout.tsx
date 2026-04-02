import type { Metadata } from "next";
import { Chakra_Petch, Fira_Code } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const firaCode = Fira_Code({
  variable: "--font-fira",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
    <html
      lang="en"
      className={`${chakraPetch.variable} ${firaCode.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col items-center bg-black text-foreground">
        <main className="w-full min-h-[100dvh] flex flex-col relative overflow-x-hidden">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}
