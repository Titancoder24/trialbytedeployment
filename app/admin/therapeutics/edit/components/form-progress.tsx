"use client";

import { useEditTherapeuticForm } from "../context/edit-form-context";
import { useRouter, useParams } from "next/navigation";

interface FormProgressProps {
  currentStep: number;
}

const steps = [
  { number: 1, title: "Trial Overview", path: "/admin/therapeutics/edit/[id]/5-consolidated" },
  { number: 2, title: "Outcome Measured", path: "/admin/therapeutics/edit/[id]/5-consolidated" },
  { number: 3, title: "Participation Criteria", path: "/admin/therapeutics/edit/[id]/5-consolidated" },
  { number: 4, title: "Timing", path: "/admin/therapeutics/edit/[id]/5-consolidated" },
  { number: 5, title: "Results", path: "/admin/therapeutics/edit/[id]/5-consolidated" },
  { number: 6, title: "Sites", path: "/admin/therapeutics/edit/[id]/5-consolidated" },
  { number: 7, title: "Other Sources", path: "/admin/therapeutics/edit/[id]/5-consolidated" },
  { number: 8, title: "Logs", path: "/admin/therapeutics/edit/[id]/5-consolidated" },
];

export default function FormProgress({ currentStep }: FormProgressProps) {
  const { formData } = useEditTherapeuticForm();
  const router = useRouter();
  const params = useParams();


  const handleStepClick = (step: typeof steps[0]) => {
    const path = step.path.replace('[id]', params.id as string);
    router.push(path);
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation - Matching drugs design */}
      <div className="rounded-lg" style={{ backgroundColor: '#61CCFA66' }}>
        <div className="flex">
          {steps.map((step) => {
            const isActive = currentStep === step.number;

            return (
              <button
                key={step.number}
                onClick={() => handleStepClick(step)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  isActive
                    ? "text-white border-b-transparent"
                    : "text-gray-700 border-b-transparent hover:bg-white hover:bg-opacity-20"
                }`}
                style={{
                  backgroundColor: isActive ? '#204B73' : 'transparent'
                }}
              >
                <div className="flex items-center gap-2">
                  {step.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
