import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import AuthTokenProvider from "@/components/AuthTokenProvider";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ornate Solar — Marketing Collateral Hub",
  description:
    "Internal platform for managing marketing collateral across Ornate Solar products and partners.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AuthTokenProvider>{children}</AuthTokenProvider>
        </AuthProvider>
        <ChatWidget />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
