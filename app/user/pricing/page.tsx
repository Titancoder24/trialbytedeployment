"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, Star } from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "$100",
      period: "/mo",
      description:
        "Get started with basic access to clinical trial tools and updates.",
      features: [
        { name: "Unlimited Upload", included: true },
        { name: "Advanced Statistic", included: true },
        { name: "Profile Badge", included: true },
        { name: "Access to the community", included: true },
        { name: "History of all Liked Photos", included: false },
        { name: "Directory Listing", included: false },
        { name: "Customize Your Profile", included: false },
        { name: "Display Your Workshops", included: false },
      ],
      popular: false,
    },
    {
      name: "Popular",
      price: "$1400",
      period: "/mo",
      description:
        "Unlock advanced features and enhanced support for ongoing trials.",
      features: [
        { name: "Unlimited Upload", included: true },
        { name: "Advanced Statistic", included: true },
        { name: "Profile Badge", included: true },
        { name: "Access to the community", included: true },
        { name: "History of all Liked Photos", included: true },
        { name: "Directory Listing", included: true },
        { name: "Customize Your Profile", included: true },
        { name: "Display Your Workshops", included: true },
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$2100",
      period: "/mo",
      description:
        "Full-service plan with premium support and team-based management tools.",
      features: [
        { name: "Unlimited Upload", included: true },
        { name: "Advanced Statistic", included: true },
        { name: "Profile Badge", included: true },
        { name: "Access to the community", included: true },
        { name: "History of all Liked Photos", included: true },
        { name: "Directory Listing", included: true },
        { name: "Customize Your Profile", included: true },
        { name: "Display Your Workshops", included: true },
      ],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Choose a plan for a more advanced business
              </h1>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card
                key={plan.name}
                className={`relative ${
                  plan.popular
                    ? "bg-gradient-to-b from-blue-400 to-blue-600 text-white border-blue-500 transform scale-105"
                    : "bg-white border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span>Best Offer</span>
                    </div>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="mb-4">
                    {plan.popular ? (
                      <Star className="w-8 h-8 mx-auto text-white" />
                    ) : index === 0 ? (
                      <div className="w-8 h-8 mx-auto border-2 border-gray-300 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-gray-300 rounded-full" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-gray-400 rounded" />
                      </div>
                    )}
                  </div>
                  <h3
                    className={`text-xl font-bold ${
                      plan.popular ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm ${
                      plan.popular ? "text-blue-100" : "text-gray-600"
                    } mt-2`}
                  >
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Price */}
                  <div className="text-center">
                    <div className="flex items-baseline justify-center">
                      <span
                        className={`text-4xl font-bold ${
                          plan.popular ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {plan.price}
                      </span>
                      <span
                        className={`text-lg ${
                          plan.popular ? "text-blue-100" : "text-gray-600"
                        } ml-1`}
                      >
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-1">
                    <h4
                      className={`font-semibold text-sm ${
                        plan.popular ? "text-white" : "text-gray-900"
                      } mb-3`}
                    >
                      What's included:
                    </h4>
                    <div className="space-y-2">
                      {plan.features.map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-center space-x-3"
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              feature.included
                                ? plan.popular
                                  ? "bg-white text-blue-600"
                                  : "bg-green-100 text-green-600"
                                : "bg-gray-200"
                            }`}
                          >
                            {feature.included && <Check className="w-3 h-3" />}
                          </div>
                          <span
                            className={`text-sm ${
                              feature.included
                                ? plan.popular
                                  ? "text-white"
                                  : "text-gray-900"
                                : "text-gray-400"
                            }`}
                          >
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-white text-blue-600 hover:bg-gray-100"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    Choose Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
