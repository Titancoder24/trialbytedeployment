"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Types for favorite trials
interface FavoriteTrial {
  id: string;
  trialId: string;
  therapeuticArea: string;
  diseaseType: string;
  primaryDrug: string;
  status: string;
  sponsor: string;
  phase: string;
}

interface FavoriteTrialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  favoriteTrials?: FavoriteTrial[];
  onRemoveTrials?: (trialIds: string[]) => void;
}

export function FavoriteTrialsModal({
  open,
  onOpenChange,
  favoriteTrials = [],
  onRemoveTrials
}: FavoriteTrialsModalProps) {
  const [selectedTrials, setSelectedTrials] = useState<string[]>([]);
  const router = useRouter();

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    const statusColors: Record<string, string> = {
      confirmed: "bg-orange-500 text-white",
      terminated: "bg-red-500 text-white",
      open: "bg-green-500 text-white",
      closed: "bg-gray-600 text-white",
      completed: "bg-emerald-500 text-white",
      active: "bg-green-500 text-white",
      planned: "bg-blue-500 text-white",
      suspended: "bg-amber-500 text-white",
      draft: "bg-slate-400 text-white",
    };
    return statusColors[normalizedStatus] || "bg-gray-400 text-white";
  };

  const handleSelectTrial = (trialId: string) => {
    setSelectedTrials(prev =>
      prev.includes(trialId)
        ? prev.filter(id => id !== trialId)
        : [...prev, trialId]
    );
  };

  const handleRemoveSelected = () => {
    if (onRemoveTrials && selectedTrials.length > 0) {
      onRemoveTrials(selectedTrials);
      setSelectedTrials([]);
    }
  };

  const handleOpenSelected = () => {
    if (selectedTrials.length > 0) {
      // Open the first selected trial
      router.push(`/user/clinical_trial/trials?trialId=${selectedTrials[0]}`);
      onOpenChange(false);
    }
  };

  const handleExportSelectedCSV = () => {
    // Get selected trials data
    const trialsToExport = favoriteTrials.filter(trial => selectedTrials.includes(trial.id));

    // Create CSV content
    const headers = ["Trial ID", "Therapeutic Area", "Disease Type", "Primary Drug", "Status", "Sponsor", "Phase"];
    const csvContent = [
      headers.join(","),
      ...trialsToExport.map(trial => [
        trial.trialId,
        `"${trial.therapeuticArea}"`,
        `"${trial.diseaseType}"`,
        `"${trial.primaryDrug || 'N/A'}"`,
        trial.status,
        `"${trial.sponsor}"`,
        trial.phase
      ].join(","))
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `favorite_trials_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSelectedPDF = () => {
    // Get selected trials data
    const trialsToExport = favoriteTrials.filter(trial => selectedTrials.includes(trial.id));
    const doc = new jsPDF();

    // Define columns
    const columns = [
      { header: "Trial ID", dataKey: "trialId" },
      { header: "Therapeutic Area", dataKey: "therapeuticArea" },
      { header: "Primary Drug", dataKey: "primaryDrug" },
      { header: "Status", dataKey: "status" },
      { header: "Phase", dataKey: "phase" }
    ];

    // Generate table
    autoTable(doc, {
      head: [columns.map(col => col.header)],
      body: trialsToExport.map(row => columns.map(col => row[col.dataKey as keyof typeof row])),
      startY: 20,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [32, 75, 115] }, // Matches #204B73
      didDrawPage: (data) => {
        // Add header
        doc.setFontSize(16);
        doc.text("Favorite Trials Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 10);
      }
    });

    // Save PDF
    doc.save(`favorite_trials_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[80vh] p-0 rounded-lg overflow-hidden flex flex-col [&>button]:hidden"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {/* Header */}
        <DialogHeader
          className="px-6 py-4 border-b relative"
          style={{ backgroundColor: "#C3E9FB" }}
        >
          <div className="flex items-center justify-between">
            <DialogTitle
              className="text-lg font-semibold"
              style={{ fontFamily: "Poppins, sans-serif", color: "#204B73" }}
            >
              Favorite Trials
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 rounded-full p-1 hover:opacity-80"
              style={{ backgroundColor: "#204B73" }}
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </DialogHeader>

        {/* Content - Card Style Rows */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {favoriteTrials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No favorite trials yet. Click the heart icon on any trial to add it to favorites.
            </div>
          ) : (
            favoriteTrials.map((trial) => (
              <div
                key={trial.id}
                className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedTrials.includes(trial.id)}
                    onChange={() => handleSelectTrial(trial.id)}
                    className="w-4 h-4 rounded border-gray-300 flex-shrink-0"
                  />

                  {/* Trial ID */}
                  <span className="text-gray-700 font-medium text-sm w-[90px] flex-shrink-0">
                    {trial.trialId}
                  </span>

                  {/* Therapeutic Area with Icon */}
                  <div className="flex items-center gap-1 w-[90px] flex-shrink-0">
                    <Image
                      src="/pngs/redicon.png"
                      alt=""
                      width={12}
                      height={12}
                      className="flex-shrink-0"
                    />
                    <span className="text-gray-700 text-xs truncate">{trial.therapeuticArea}</span>
                  </div>

                  {/* Disease Type */}
                  <span className="text-gray-600 text-xs w-[70px] flex-shrink-0 truncate">{trial.diseaseType}</span>

                  {/* Primary Drug */}
                  <span className="text-gray-600 text-xs w-[70px] flex-shrink-0 truncate">{trial.primaryDrug || 'N/A'}</span>

                  {/* Status Badge */}
                  <Badge className={`px-3 py-0.5 text-xs rounded-lg flex-shrink-0 ${getStatusColor(trial.status)}`}>
                    {trial.status}
                  </Badge>

                  {/* Sponsor */}
                  <span className="text-gray-600 text-xs w-[120px] flex-shrink-0 truncate">{trial.sponsor}</span>

                  {/* Phase */}
                  <span className="text-gray-600 text-xs flex-shrink-0">{trial.phase}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t">
          <Button
            variant="outline"
            onClick={handleRemoveSelected}
            disabled={selectedTrials.length === 0}
            className="px-6 py-2 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Remove
          </Button>

          <Button
            onClick={handleOpenSelected}
            disabled={selectedTrials.length === 0}
            className="px-6 py-2 rounded-lg text-white hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#204B73", fontFamily: "Poppins, sans-serif" }}
          >
            Open
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={selectedTrials.length === 0}
                className="px-6 py-2 rounded-lg text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                style={{ backgroundColor: "#204B73", fontFamily: "Poppins, sans-serif" }}
              >
                <Image
                  src="/pngs/exporticon.png"
                  alt="Export"
                  width={16}
                  height={16}
                  style={{ filter: "brightness(0) invert(1)" }}
                />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem onClick={handleExportSelectedCSV} className="cursor-pointer">
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportSelectedPDF} className="cursor-pointer">
                Export to PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DialogContent>
    </Dialog>
  );
}
