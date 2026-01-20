"use client";

import { useDrugForm } from "../context/drug-form-context";

interface DrugFormProgressProps {
  currentStep: number;
}

const steps = [
  { id: 1, name: "Overview", key: "overview" },
  { id: 2, name: "Development Status", key: "devStatus" },
  { id: 3, name: "Drug Activity", key: "activity" },
  { id: 4, name: "Development", key: "development" },
  { id: 5, name: "Other Sources", key: "otherSources" },
  { id: 6, name: "Licensing", key: "licencesMarketing" },
  { id: 7, name: "Logs", key: "logs" },
];

export default function DrugFormProgress({
  currentStep,
}: DrugFormProgressProps) {
  const { formData } = useDrugForm();


  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCurrent = currentStep === step.id;
          const isPast = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    isPast
                      ? "border-green-500 bg-green-500 text-white"
                      : isCurrent
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-300 bg-white text-gray-400"
                  }`}
                >
                  <span className="text-sm font-medium">{step.id}</span>
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isPast
                      ? "text-green-600"
                      : isCurrent
                      ? "text-blue-600"
                      : "text-gray-400"
                  }`}
                >
                  {step.name}
                </span>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div
                  className={`mx-4 h-0.5 w-16 ${
                    isPast ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

