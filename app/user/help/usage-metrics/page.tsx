"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HelpUsageMetricsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Usage Metrics</h1>
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trial Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 rounded bg-muted" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Drug Trial Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
