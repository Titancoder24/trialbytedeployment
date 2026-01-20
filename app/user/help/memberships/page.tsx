"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";

export default function MembershipsPage() {
  const features = [
    "Unlimited Upload",
    "Advanced Statistic",
    "Profile Badge",
    "Access to the community",
  ];

  const invoices = [
    { name: "Invoice_2024/10.pdf", date: "Apr 02, 2024" },
    { name: "Invoice_2024/10.pdf", date: "Mar 02, 2024" },
    { name: "Invoice_2024/10.pdf", date: "Feb 02, 2024" },
    { name: "Invoice_2024/10.pdf", date: "Jan 02, 2024" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Membership</h1>

        {/* Membership Details Card */}
        <Card className="border-2 border-blue-400 mb-8">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Side - Plan Details */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium">
                    Starter
                  </span>
                  <span className="text-gray-600">plan</span>
                </div>

                <div className="flex items-baseline space-x-2 mb-6">
                  <span className="text-4xl font-bold text-gray-900">$100</span>
                  <span className="text-gray-600">/mo</span>
                </div>

                <Button className="bg-blue-500 hover:bg-blue-600 text-white px-6">
                  Upgrade Plan
                </Button>
              </div>

              {/* Right Side - Payment Info */}
              <div className="space-y-4">
                <div>
                  <span className="text-gray-600 text-sm">Next Payment</span>
                  <div className="font-medium">on May 30, 2024</div>
                </div>

                <div>
                  <span className="text-gray-600 text-sm">
                    Registration Date
                  </span>
                  <div className="font-medium">20-01-2024</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Features</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-4">
                <div className="text-gray-700 font-medium">{feature}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoices Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Invoices (4)</h2>
          <div className="space-y-3">
            {invoices.map((invoice, index) => (
              <Card key={index} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <div className="w-4 h-4 bg-gray-400 rounded-sm"></div>
                      </div>
                      <span className="font-medium text-gray-900">
                        {invoice.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-gray-600 text-sm">
                          Date of invoice
                        </div>
                        <div className="font-medium">{invoice.date}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
