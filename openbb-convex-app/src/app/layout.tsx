import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { Navigation } from "@/components/ui/Navigation";
import { ToastContainer } from "@/components/ui/Toast";
import { DemoDataInitializer } from "@/components/DemoDataInitializer";
import { DebugPanel } from "@/components/debug/DebugPanel";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OpenBB Web App",
  description: "基於 OpenBB 的金融數據分析平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className={`${inter.className} antialiased`}>
        <ConvexClientProvider>
          <DemoDataInitializer />
          <Navigation />
          {children}
          <ToastContainer />
          <DebugPanel />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
