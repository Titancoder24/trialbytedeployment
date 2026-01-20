"use client";

import { TherapeuticFormProvider } from "./context/therapeutic-form-context";

export default function TherapeuticFormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TherapeuticFormProvider>
      <div className="min-h-screen bg-background">{children}</div>
    </TherapeuticFormProvider>
  );
}
