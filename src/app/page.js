"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAdminSessionToken } from "@/lib/client-session";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getAdminSessionToken();
    if (token) {
      router.replace("/admin/scanner");
    } else {
      router.replace("/admin/login");
    }
  }, [router]);

  return <div className="surface mx-auto mt-8 max-w-xl p-6 text-center text-[#5d5340]">Redirecting...</div>;
}
