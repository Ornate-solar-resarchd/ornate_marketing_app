"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useSignIn } from "@/lib/auth-context";
import { Sun, Zap, Shield, BarChart3 } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { isLoaded, isSignedIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If already signed in, bounce to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace("/dashboard");
  }, [isLoaded, isSignedIn, router]);

  async function doLogin(e: string, p: string) {
    setError(""); setSubmitting(true);
    try {
      await signIn(e, p);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  // Auto-login when arriving from master portal with ?autologin=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autologin") === "1") {
      const e = params.get("email") || "";
      const p = params.get("password") || "";
      if (e && p) {
        setEmail(e); setPassword(p);
        window.history.replaceState({}, "", window.location.pathname);
        doLogin(e, p);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    await doLogin(email, password);
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#1A1A1A] via-[#2D2D2D] to-[#1A1A1A]">
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[#E8611A]/20 blur-[100px]" />
        <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-[#E8611A]/10 blur-[100px]" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
          <div className="flex items-center gap-3">
            <img src="https://i.ibb.co/MygcTBxJ/Ornate-Logo-1.png" alt="Ornate Solar" className="h-12 object-contain" />
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight">Marketing Collateral Hub</h1>
            <p className="text-white/70 max-w-md">Brochures, datasheets, images, videos and more — all your sales collateral in one place.</p>
            <div className="grid grid-cols-3 gap-4 mt-10">
              {[
                { Icon: Sun, label: "Solar" },
                { Icon: Zap, label: "BESS" },
                { Icon: Shield, label: "Compliance" },
                { Icon: BarChart3, label: "Reports" },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2 opacity-60">
                  <Icon className="h-6 w-6" />
                  <span className="text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-white/40">© Ornate Solar · Internal Use Only</div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-[#F4F5F7]">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <img src="https://i.ibb.co/MygcTBxJ/Ornate-Logo-1.png" alt="Ornate Solar" className="h-10 mx-auto" />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 border border-[#E5E7EB]">
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-1">Welcome back</h2>
            <p className="text-sm text-[#6B7280] mb-6">Sign in to continue to the hub</p>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#E8611A]/20 focus:border-[#E8611A]"
                  placeholder="you@ornatesolar.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#E8611A]/20 focus:border-[#E8611A]"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#E8611A] hover:bg-[#D4561A] text-white py-2.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
