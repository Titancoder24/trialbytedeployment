"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Users, Activity, UserPlus, UserMinus } from "lucide-react";

const registrationData = [
  { month: "Jan", registrations: 13 },
  { month: "Feb", registrations: 14 },
  { month: "Mar", registrations: 15 },
  { month: "Apr", registrations: 22 },
  { month: "May", registrations: 18 },
  { month: "June", registrations: 15 },
  { month: "July", registrations: 15 },
];

const trialData = [
  { name: "Active", value: 65, color: "#204B73" },
  { name: "Inactive", value: 25, color: "#C6EDFD" },
  { name: "Expired", value: 10, color: "#94A3B8" },
];

export default function AdminHome() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EAF8FF] to-white p-6 space-y-6">
      {/* Page Heading */}
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Users",
            value: "3250",
            subtitle: "Since Launch",
            icon: <Users className="h-8 w-8 text-blue-700" />,
          },
          {
            title: "Recent user signups",
            value: "365",
            subtitle: "Last 6 months",
            icon: <UserPlus className="h-8 w-8 text-orange-500" />,
          },
          {
            title: "Recent user exits",
            value: "120",
            subtitle: "Last 6 months",
            icon: <UserMinus className="h-8 w-8 text-orange-500" />,
          },
          {
            title: "Current user activity",
            value: "233",
            subtitle: "Present day",
            icon: <Activity className="h-8 w-8 text-orange-500" />,
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className="bg-white shadow rounded-lg p-4 flex items-center gap-4"
          >
            <div className="p-3 bg-gray-100 rounded-full">{card.icon}</div>
            <div>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="text-sm text-gray-600">{card.title}</div>
              <div className="text-xs text-gray-400">{card.subtitle}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Registration Chart */}
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            New Registration
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={registrationData}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Bar dataKey="registrations" fill="#204B73" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Active Trial List Donut Chart */}
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Active Trial List
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={trialData}
                cx="50%"
                cy="50%"
                innerRadius="50%"
                outerRadius="80%"
                paddingAngle={5}
                dataKey="value"
              >
                {trialData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {trialData.map((entry, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
