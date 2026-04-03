import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Team Flow | Project Management SaaS",
  description: "Quản lý công việc và dự án hiệu quả phong cách Linear",
  icons: {
    icon: "/logos/logo_v4_final.png",
    apple: "/logos/logo_v4_final.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={geist.variable}>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          geist.variable,
          jetbrainsMono.variable
        )}
      >
        <Providers>
          {children}
          <Toaster position="top-right" expand={false} richColors />
        </Providers>
      </body>
    </html>
  );
}
