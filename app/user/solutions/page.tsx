"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SolutionsPricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "$100",
      features: [
        "Unlimited Upload",
        "Advanced Statistic",
        "Profile Badge",
        "Access to the community",
      ],
    },
    {
      name: "Popular",
      price: "$1400",
      features: [
        "Unlimited Upload",
        "Advanced Statistic",
        "Profile Badge",
        "Access to the community",
        "Directory Listing",
      ],
    },
    {
      name: "Enterprise",
      price: "$2100",
      features: [
        "Unlimited Upload",
        "Advanced Statistic",
        "Profile Badge",
        "Access to the community",
        "History of all Liked Photos",
        "Directory Listing",
      ],
    },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-center text-3xl font-bold">
        Choose a plan for a more advanced business
      </h1>
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.name} className="shadow">
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-bold">
                {p.price}
                <span className="text-base font-normal">/mo</span>
              </div>
              <ul className="space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <Button className="w-full">Choose Plan</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


