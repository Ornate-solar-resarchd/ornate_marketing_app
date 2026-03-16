import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import AuthTokenProvider from "@/components/AuthTokenProvider";
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
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <AuthTokenProvider>
            {children}
          </AuthTokenProvider>
          <Toaster position="top-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
