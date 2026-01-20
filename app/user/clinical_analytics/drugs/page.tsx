"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function ClinicalAnalyticsDrugs() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Clinical Analytics - Drugs</h1>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Explore analytics and KPIs for clinical trials related to drugs.
              </p>
            </div>
            <Button
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
              onClick={() =>
                router.push("/user/clinical_analytics/drug_analytics")
              }
            >
              Trial Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
