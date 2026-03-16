"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, AlertCircle, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axios from "axios";

interface SharedData {
  signedUrl: string;
  document: {
    id: string;
    name: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    company: {
      label: string;
      logoUrl: string;
      icon: string;
    };
  };
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    axios
      .get(`${apiUrl}/share/${token}`)
      .then((res) => setData(res.data))
      .catch((err) => {
        const message =
          err.response?.data?.error || "Failed to load shared file";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F5F7]">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#E8611A] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F5F7]">
        <div className="mx-4 max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-bold">Link Unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = data.signedUrl;
    link.download = data.document.originalName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F5F7]">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="flex items-center gap-2 text-center justify-center">
          <Sun className="h-6 w-6 text-[#E8611A]" />
          <span className="text-lg font-bold text-[#E8611A]">
            Ornate Solar
          </span>
        </div>

        <div className="mt-6 flex flex-col items-center">
          <Avatar className="h-16 w-16 rounded-lg">
            <AvatarImage
              src={data.document.company.logoUrl}
              alt={data.document.company.label}
            />
            <AvatarFallback className="rounded-lg text-2xl">
              {data.document.company.icon}
            </AvatarFallback>
          </Avatar>

          <p className="mt-3 text-sm text-muted-foreground">
            {data.document.company.label}
          </p>
          <h2 className="mt-1 text-center text-xl font-semibold">
            {data.document.name}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.document.originalName}
          </p>
        </div>

        <Button className="mt-6 w-full" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download File
        </Button>
      </div>
    </div>
  );
}
