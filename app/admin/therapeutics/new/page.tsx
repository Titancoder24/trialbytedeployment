"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewTherapeuticPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the consolidated new trial form
    router.push("/admin/therapeutics/new/5-consolidated");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EAF8FF] to-white p-6">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Loading New Trial Form...</h1>
          <p className="text-gray-600">Redirecting to trial creation form...</p>
        </div>
      </div>
    </div>
  );
}
