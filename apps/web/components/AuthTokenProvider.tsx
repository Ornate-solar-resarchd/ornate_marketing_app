"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { setGetTokenFn } from "@/lib/api";

export default function AuthTokenProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getToken } = useAuth();

  useEffect(() => {
    setGetTokenFn(getToken);
  }, [getToken]);

  return <>{children}</>;
}
