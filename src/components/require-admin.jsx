"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminSessionToken } from "@/lib/client-session";

export function RequireAdmin({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAdminSessionToken();
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return <div className="surface mx-auto mt-8 max-w-xl p-6 text-center text-[#5d5340]">Checking admin session...</div>;
  }

  return children;
}
