"use client";

import { use } from "react";
import { EditDrugFormProvider } from "../context/edit-drug-form-context";

export default function EditDrugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  
  return (
    <EditDrugFormProvider drugId={resolvedParams.id}>
      {children}
    </EditDrugFormProvider>
  );
}