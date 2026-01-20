"use client";

import { use } from "react";
import { EditTherapeuticFormProvider } from "../context/edit-form-context";

export default function EditLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  
  return (
    <EditTherapeuticFormProvider trialId={resolvedParams.id}>
      <div className="min-h-screen bg-background">{children}</div>
    </EditTherapeuticFormProvider>
  );
}
