"use client";

import { useState, useEffect } from "react";
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

// Types for trials
interface ExportTrial {
    id: string;
    trialId: string;
    therapeuticArea: string;
    diseaseType: string;
    primaryDrug: string;
    status: string;
    sponsor: string;
    phase: string;
}

interface ExportTrialsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trials?: ExportTrial[];
}

export function ExportTrialsModal({
    open,
    onOpenChange,
    trials = []
}: ExportTrialsModalProps) {
    const [selectedTrials, setSelectedTrials] = useState<string[]>([]);

    // Reset selection when modal opens
    useEffect(() => {
        if (open) {
            setSelectedTrials([]);
        }
    }, [open]);

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

    const handleSelectAll = () => {
        if (selectedTrials.length === trials.length) {
            setSelectedTrials([]);
        } else {
            setSelectedTrials(trials.map(trial => trial.id));
        }
    };

    const handleExportCSV = () => {
        // Get selected trials data
        const trialsToExport = trials.filter(trial => selectedTrials.includes(trial.id));

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
        link.setAttribute("download", `selected_trials_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        // Get selected trials data
        const trialsToExport = trials.filter(trial => selectedTrials.includes(trial.id));

        // Import jsPDF dynamically and create PDF
        import('jspdf').then(({ default: jsPDF }) => {
            const doc = new jsPDF();
            // ... (rest of PDF logic is same, using doc)
            // Reusing existing logic but wrapping in handleExportPDF

            // Set title
            doc.setFontSize(18);
            doc.setTextColor(32, 75, 115); // #204B73
            doc.text("Clinical Trials Export", 14, 22);

            // Set date
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

            // Table headers
            const headers = ["Trial ID", "Therapeutic Area", "Disease Type", "Primary Drug", "Status", "Sponsor", "Phase"];
            const columnWidths = [25, 30, 30, 25, 20, 35, 20];

            let yPos = 40;
            const leftMargin = 14;

            // Draw header row
            doc.setFillColor(32, 75, 115); // #204B73
            doc.rect(leftMargin, yPos - 5, 182, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');

            let xPos = leftMargin + 2;
            headers.forEach((header, index) => {
                doc.text(header, xPos, yPos);
                xPos += columnWidths[index];
            });

            yPos += 8;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);

            // Draw data rows
            trialsToExport.forEach((trial, rowIndex) => {
                // Check if we need a new page
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }

                // Alternate row colors
                if (rowIndex % 2 === 0) {
                    doc.setFillColor(245, 245, 245);
                    doc.rect(leftMargin, yPos - 5, 182, 8, 'F');
                }

                xPos = leftMargin + 2;
                const rowData = [
                    trial.trialId || 'N/A',
                    trial.therapeuticArea || 'N/A',
                    trial.diseaseType || 'N/A',
                    trial.primaryDrug || 'N/A',
                    trial.status || 'N/A',
                    trial.sponsor || 'N/A',
                    trial.phase || 'N/A'
                ];

                rowData.forEach((cell, index) => {
                    // Truncate text if too long
                    const maxWidth = columnWidths[index] - 4;
                    let text = cell;
                    while (doc.getTextWidth(text) > maxWidth && text.length > 3) {
                        text = text.substring(0, text.length - 4) + '...';
                    }
                    doc.text(text, xPos, yPos);
                    xPos += columnWidths[index];
                });

                yPos += 8;
            });

            // Add footer
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
                doc.text('TrialByte', leftMargin, doc.internal.pageSize.height - 10);
            }

            // Download PDF
            doc.save(`clinical_trials_export_${new Date().toISOString().split('T')[0]}.pdf`);
        });

        onOpenChange(false);
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
                            Export Trials
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

                {/* Select All */}
                <div className="px-4 py-2 border-b bg-gray-50">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectedTrials.length === trials.length && trials.length > 0}
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-600">Select All ({trials.length} trials)</span>
                    </label>
                </div>

                {/* Content - Card Style Rows */}
                <div className="flex-1 overflow-auto p-4 space-y-3">
                    {trials.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No trials available to export.
                        </div>
                    ) : (
                        trials.map((trial) => (
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

                {/* Footer Button */}
                <div className="flex justify-end items-center gap-3 px-6 py-4 border-t">
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
                            <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
                                Export to CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                                Export to PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </DialogContent>
        </Dialog>
    );
}
