"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditTherapeuticTrialPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // Redirect to the consolidated edit page
    if (params.id) {
      router.push(`/admin/therapeutics/edit/${params.id}/5-consolidated`);
    }
  }, [params.id, router]);

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EAF8FF] to-white p-6">
        <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Loading Edit Form...</h1>
          <p className="text-gray-600">Redirecting to edit form...</p>
        </div>
      </div>
    </div>
  );
}
