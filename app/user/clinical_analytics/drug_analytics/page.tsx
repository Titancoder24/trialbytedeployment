"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { Activity, Users, Clock, Award, Building2 } from "lucide-react";

export default function DrugAnalyticsPage() {
  // KPI Data
  const kpiData = [
    {
      title: "Total Drugs",
      value: "14,150",
      subtitle: "In Database",
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Approved",
      value: "12,110",
      subtitle: "FDA Approved",
      icon: Award,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Lead Poisoning Enrolled",
      value: "8,800",
      subtitle: "Active Trials",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Avg Trial Duration",
      value: "90 Days",
      subtitle: "Average Time",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  // Top Sponsors Data
  const topSponsors = [
    { name: "Merck", value: 380 },
    { name: "Astellas", value: 343 },
    { name: "Pfizer", value: 333 },
    { name: "Sanofi", value: 310 },
    { name: "Eisai", value: 301 },
  ];

  // Trial Distribution Over Time
  const trialDistributionData = [
    { month: "Jan", trials: 45, approved: 32 },
    { month: "Feb", trials: 52, approved: 38 },
    { month: "Mar", trials: 48, approved: 35 },
    { month: "Apr", trials: 61, approved: 45 },
    { month: "May", trials: 55, approved: 42 },
    { month: "Jun", trials: 67, approved: 48 },
    { month: "Jul", trials: 58, approved: 44 },
    { month: "Aug", trials: 72, approved: 52 },
    { month: "Sep", trials: 65, approved: 47 },
    { month: "Oct", trials: 78, approved: 56 },
    { month: "Nov", trials: 69, approved: 51 },
    { month: "Dec", trials: 74, approved: 53 },
  ];

  // Drug Status Distribution
  const drugStatusData = [
    { name: "Approved", value: 45, color: "#22C55E" },
    { name: "Phase III", value: 25, color: "#3B82F6" },
    { name: "Phase II", value: 15, color: "#8B5CF6" },
    { name: "Phase I", value: 10, color: "#F59E0B" },
    { name: "Preclinical", value: 5, color: "#EF4444" },
  ];

  // Therapeutic Area Distribution
  const therapeuticAreaData = [
    { name: "Oncology", value: 30, color: "#DC2626" },
    { name: "Cardiology", value: 20, color: "#2563EB" },
    { name: "Neurology", value: 18, color: "#7C3AED" },
    { name: "Immunology", value: 15, color: "#059669" },
    { name: "Infectious Disease", value: 12, color: "#D97706" },
    { name: "Others", value: 5, color: "#6B7280" },
  ];

  // Regional Distribution
  const regionalData = [
    { name: "North America", value: 35, color: "#3B82F6" },
    { name: "Europe", value: 28, color: "#10B981" },
    { name: "Asia Pacific", value: 22, color: "#F59E0B" },
    { name: "Latin America", value: 10, color: "#EF4444" },
    { name: "Others", value: 5, color: "#6B7280" },
  ];

  // Monthly Trends
  const monthlyTrendsData = [
    { month: "Jan", newDrugs: 120, completedTrials: 85 },
    { month: "Feb", newDrugs: 135, completedTrials: 92 },
    { month: "Mar", newDrugs: 128, completedTrials: 88 },
    { month: "Apr", newDrugs: 145, completedTrials: 105 },
    { month: "May", newDrugs: 152, completedTrials: 112 },
    { month: "Jun", newDrugs: 168, completedTrials: 125 },
    { month: "Jul", newDrugs: 155, completedTrials: 118 },
    { month: "Aug", newDrugs: 172, completedTrials: 135 },
    { month: "Sep", newDrugs: 165, completedTrials: 128 },
    { month: "Oct", newDrugs: 185, completedTrials: 142 },
    { month: "Nov", newDrugs: 178, completedTrials: 138 },
    { month: "Dec", newDrugs: 192, completedTrials: 155 },
  ];

  // Success Rate by Phase
  const successRateData = [
    { phase: "Phase I", successRate: 85, totalTrials: 450 },
    { phase: "Phase II", successRate: 65, totalTrials: 320 },
    { phase: "Phase III", successRate: 45, totalTrials: 180 },
    { phase: "Market", successRate: 25, totalTrials: 85 },
  ];

  // Company Performance Radar
  const companyPerformanceData = [
    { subject: "Innovation", A: 120, B: 110, fullMark: 150 },
    { subject: "Success Rate", A: 98, B: 130, fullMark: 150 },
    { subject: "Speed", A: 86, B: 130, fullMark: 150 },
    { subject: "Investment", A: 99, B: 100, fullMark: 150 },
    { subject: "Market Share", A: 85, B: 90, fullMark: 150 },
    { subject: "Pipeline", A: 65, B: 85, fullMark: 150 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Drug Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive insights into drug development and trial analytics
          </p>
        </div>

        {/* KPI Dashboard Section */}
        <div className="bg-blue-100 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-6">
            KPI Dashboard
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {kpiData.map((kpi, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">
                        {kpi.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {kpi.value}
                      </p>
                      <p className="text-xs text-gray-500">{kpi.subtitle}</p>
                    </div>
                    <div
                      className={`h-12 w-12 rounded-lg ${kpi.bgColor} flex items-center justify-center`}
                    >
                      <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Top Sponsors */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Top Sponsors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topSponsors.map((sponsor, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="font-medium text-gray-900">
                        {sponsor.name}
                      </span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {sponsor.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trial Distribution Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Trial Distribution
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Trial Distribution Over Time */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Trial Distribution Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    trials: { label: "Total Trials", color: "#3B82F6" },
                    approved: { label: "Approved", color: "#10B981" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trialDistributionData}>
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis axisLine={false} tickLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="trials"
                        fill="#3B82F6"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="approved"
                        fill="#10B981"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Monthly Drug Development Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    newDrugs: { label: "New Drugs", color: "#8B5CF6" },
                    completedTrials: {
                      label: "Completed Trials",
                      color: "#10B981",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrendsData}>
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis axisLine={false} tickLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        dataKey="newDrugs"
                        stackId="1"
                        stroke="#8B5CF6"
                        fill="#8B5CF6"
                        fillOpacity={0.6}
                      />
                      <Area
                        dataKey="completedTrials"
                        stackId="1"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Drug Status Distribution */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Distribution of Drugs by Development Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    approved: { label: "Approved", color: "#22C55E" },
                    phase3: { label: "Phase III", color: "#3B82F6" },
                    phase2: { label: "Phase II", color: "#8B5CF6" },
                    phase1: { label: "Phase I", color: "#F59E0B" },
                    preclinical: { label: "Preclinical", color: "#EF4444" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={drugStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {drugStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex justify-center flex-wrap gap-4 mt-4">
                  {drugStatusData.map((entry, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm text-gray-600">
                        {entry.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Therapeutic Area Distribution */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Distribution by Therapeutic Area
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    oncology: { label: "Oncology", color: "#DC2626" },
                    cardiology: { label: "Cardiology", color: "#2563EB" },
                    neurology: { label: "Neurology", color: "#7C3AED" },
                    immunology: { label: "Immunology", color: "#059669" },
                    infectious: {
                      label: "Infectious Disease",
                      color: "#D97706",
                    },
                    others: { label: "Others", color: "#6B7280" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={therapeuticAreaData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {therapeuticAreaData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex justify-center flex-wrap gap-4 mt-4">
                  {therapeuticAreaData.map((entry, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm text-gray-600">
                        {entry.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Success Rate by Phase */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Success Rate by Development Phase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    successRate: {
                      label: "Success Rate (%)",
                      color: "#10B981",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={successRateData}>
                      <XAxis
                        dataKey="phase"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis axisLine={false} tickLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        dataKey="successRate"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ fill: "#10B981", strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Regional Distribution */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Regional Distribution of Drug Trials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    northAmerica: { label: "North America", color: "#3B82F6" },
                    europe: { label: "Europe", color: "#10B981" },
                    asiaPacific: { label: "Asia Pacific", color: "#F59E0B" },
                    latinAmerica: { label: "Latin America", color: "#EF4444" },
                    others: { label: "Others", color: "#6B7280" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={regionalData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={120}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {regionalData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex justify-center flex-wrap gap-4 mt-4">
                  {regionalData.map((entry, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm text-gray-600">
                        {entry.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Performance Radar Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Top Companies Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  companyA: { label: "Company A", color: "#3B82F6" },
                  companyB: { label: "Company B", color: "#EF4444" },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={companyPerformanceData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 150]} />
                    <Radar
                      name="Company A"
                      dataKey="A"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Company B"
                      dataKey="B"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.3}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="flex justify-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-gray-600">Company A</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-600">Company B</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
