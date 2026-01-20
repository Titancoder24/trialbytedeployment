"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function UserDashboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Clinical Trials Section */}
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-64 h-48 relative">
              <Image
                src="/placeholder.svg?height=200&width=250"
                alt="Clinical Trials"
                fill
                className="object-contain"
              />
            </div>
            <Button
              className="group relative overflow-hidden rounded-full px-8 py-3 text-lg font-semibold text-white shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={() => router.push("/user/clinical_trial/dashboard")}
            >
              <span className="relative z-10">Clinical trials</span>
              <span className="absolute inset-0 -z-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity" />
            </Button>
          </div>

          {/* Central Drugs Section */}
          <div className="flex flex-col items-center">
            <Card className="bg-gradient-to-b from-blue-400 to-blue-600 text-white p-8 rounded-3xl shadow-2xl max-w-sm w-full">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <div className="text-white font-bold text-xl">Rx</div>
                  </div>
                </div>

                <Button onClick={() => router.push("/user/drugs")} className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-2 rounded-full font-medium">
                  Drugs
                </Button>

                <div className="space-y-4 text-sm leading-relaxed">
                  <p>
                    Advancing the development of safe and effective drugs
                    through rigorous clinical research.
                  </p>
                  <p>
                    From molecule to market, we accelerate breakthroughs in
                    therapeutic innovation.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Trial Analytics Section */}
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-64 h-48 relative">
              <Image
                src="/placeholder.svg?height=200&width=250"
                alt="Trial Analytics"
                fill
                className="object-contain"
              />
            </div>
            <Button
              className="group relative overflow-hidden rounded-full px-8 py-3 text-lg font-semibold text-white shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              onClick={() => router.push("/user/clinical_analytics/drug_analytics")}
            >
              <span className="relative z-10">Trial analytics</span>
              <span className="absolute inset-0 -z-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
