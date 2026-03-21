import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import { appEnv } from "@/lib/env";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/common/toast-provider";
import { QueryProvider } from "@/providers/query-provider";

import "./globals.css";

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: `${appEnv.appName} | AI Engineering Operations Platform`,
  description:
    "面向本地研发仓库的 AI 任务编排与工程执行平台，统一管理项目、任务、验证流程与交付记录。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={cn(
        "h-full",
        "antialiased",
        sans.variable,
        mono.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.18),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-foreground">
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
