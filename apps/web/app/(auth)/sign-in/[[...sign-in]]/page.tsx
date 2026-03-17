import { SignIn } from "@clerk/nextjs";
import { Sun, Zap, Shield, BarChart3 } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#1A1A1A] via-[#2D2D2D] to-[#1A1A1A]">
        {/* Decorative elements */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[#E8611A]/20 blur-[100px]" />
        <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-[#E8611A]/10 blur-[100px]" />
        <div className="absolute right-20 top-20 h-3 w-3 rounded-full bg-[#E8611A] animate-float opacity-60" />
        <div className="absolute left-40 bottom-40 h-2 w-2 rounded-full bg-orange-300 animate-float opacity-40" style={{ animationDelay: "2s" }} />
        <div className="absolute right-60 top-[60%] h-2.5 w-2.5 rounded-full bg-orange-400 animate-float opacity-30" style={{ animationDelay: "1s" }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://i.ibb.co/spgKSWdX"
              alt="Ornate Solar"
              className="h-12 object-contain"
            />
          </div>

          {/* Main content */}
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E8611A]/10 px-4 py-1.5 mb-6">
              <div className="h-1.5 w-1.5 rounded-full bg-[#E8611A] animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#E8611A]">
                Marketing Collateral Hub
              </span>
            </div>

            <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Your central hub for
              <span className="block mt-1 bg-gradient-to-r from-[#E8611A] to-[#FF8A50] bg-clip-text text-transparent">
                marketing collateral
              </span>
            </h1>

            <p className="mt-4 text-base text-white/50 leading-relaxed">
              Store, manage, and share brochures, datasheets, videos, and presentations
              across all Ornate Solar products and partners.
            </p>

            {/* Feature list */}
            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 backdrop-blur-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8611A]/20">
                  <Sun className="h-4 w-4 text-[#E8611A]" />
                </div>
                <span className="text-sm font-medium text-white/70">Solar Products</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 backdrop-blur-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20">
                  <Zap className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-sm font-medium text-white/70">Inverters</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 backdrop-blur-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20">
                  <Shield className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-white/70">Compliance</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 backdrop-blur-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20">
                  <BarChart3 className="h-4 w-4 text-amber-400" />
                </div>
                <span className="text-sm font-medium text-white/70">Analytics</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/30">
              &copy; {new Date().getFullYear()} Ornate Solar. All rights reserved.
            </p>
            <a
              href="https://ornatesolar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/30 hover:text-[#E8611A] transition-colors"
            >
              ornatesolar.com
            </a>
          </div>
        </div>
      </div>

      {/* Right Panel — Sign In Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-[#F4F5F7] relative">
        {/* Mobile logo */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 lg:hidden flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://i.ibb.co/spgKSWdX"
            alt="Ornate Solar"
            className="h-10 object-contain"
          />
        </div>

        {/* Background decoration */}
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-[#E8611A]/5 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-[#E8611A]/5 blur-2xl" />

        <div className="relative z-10 w-full max-w-md px-6 animate-fade-in">
          {/* Welcome text above Clerk */}
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Welcome back</h2>
            <p className="mt-1 text-sm text-[#6B7280]">Sign in to access your marketing collateral</p>
          </div>

          <SignIn
            forceRedirectUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-xl rounded-2xl border border-[#E5E7EB]/50 w-full",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "rounded-xl border-[#E5E7EB] hover:bg-orange-50 hover:border-[#E8611A]/30 transition-all",
                formButtonPrimary:
                  "bg-[#E8611A] hover:bg-[#D4550F] rounded-xl shadow-md shadow-orange-200/30 transition-all",
                formFieldInput:
                  "rounded-xl border-[#E5E7EB] focus:border-[#E8611A] focus:ring-[#E8611A]/20",
                footerActionLink: "text-[#E8611A] hover:text-[#D4550F]",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
