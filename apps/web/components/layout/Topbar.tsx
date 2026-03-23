"use client";

import { UserButton } from "@clerk/nextjs";
import GlobalSearch from "@/components/search/GlobalSearch";
import { Bell } from "lucide-react";

export default function Topbar() {
  return (
    <header className="flex h-[60px] items-center border-b-[3px] border-[#E8611A] bg-white/95 backdrop-blur-sm px-6 animate-fade-in-down">
      {/* Left: Page title area */}
      <div className="flex-1" />

      {/* Center: Search bar - compact */}
      <div className="w-full max-w-md mx-4">
        <GlobalSearch />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:scale-105 active:scale-95">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#E8611A] text-[9px] font-bold text-white">
            3
          </span>
        </button>
        <div className="h-6 w-px bg-border" />
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              avatarBox: "h-9 w-9 ring-2 ring-border hover:ring-[#E8611A]/30 transition-all",
            },
          }}
        />
      </div>
    </header>
  );
}
