"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Eye, EyeOff } from "lucide-react";
import { useDrugForm } from "../context/drug-form-context";
import DrugFormProgress from "../components/drug-form-progress";
import { useEffect } from "react";

export default function DrugsNewDevStatus() {
  const { 
    formData, 
    addDevStatusEntry, 
    removeDevStatusEntry, 
    updateDevStatusEntry 
  } = useDrugForm();
  const entries = formData.devStatus.entries;

  const handleAddEntry = () => {
    addDevStatusEntry();
    // Temporary alert to confirm button click
    alert("Entry added! Check the form below.");
  };

  const handleRemoveEntry = (index: number) => {
    removeDevStatusEntry(index);
  };

  const handleUpdateEntry = (index: number, field: string, value: string) => {
    updateDevStatusEntry(index, field, value);
  };

  return (
    <div className="space-y-4">
      <DrugFormProgress currentStep={2} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drugs — Development Status</h1>
        <Button asChild>
          <Link href="/admin/drugs/new/drug-activity">Next</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-primary">Development Status</CardTitle>
            <Button 
              type="button"
              onClick={handleAddEntry} 
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No development status entries yet.</p>
              <p className="text-sm">Click "Add Entry" to create your first entry.</p>
            </div>
          ) : (
            entries.map((entry, index) => (
              <Card key={entry.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Entry #{index + 1}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveEntry(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Disease Type</Label>
                      <Select
                        value={entry.disease_type}
                        onValueChange={(value) => handleUpdateEntry(index, "disease_type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select disease type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oncology">Oncology</SelectItem>
                          <SelectItem value="cardiology">Cardiology</SelectItem>
                          <SelectItem value="neurology">Neurology</SelectItem>
                          <SelectItem value="pain-management">Pain Management</SelectItem>
                          <SelectItem value="autoimmune">Autoimmune</SelectItem>
                          <SelectItem value="infectious-disease">Infectious Disease</SelectItem>
                          <SelectItem value="metabolic">Metabolic</SelectItem>
                          <SelectItem value="respiratory">Respiratory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Therapeutic Class</Label>
                      <Select
                        value={entry.therapeutic_class}
                        onValueChange={(value) => handleUpdateEntry(index, "therapeutic_class", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select therapeutic class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nsaid">NSAID</SelectItem>
                          <SelectItem value="antibiotic">Antibiotic</SelectItem>
                          <SelectItem value="antiviral">Antiviral</SelectItem>
                          <SelectItem value="antineoplastic">Antineoplastic</SelectItem>
                          <SelectItem value="immunosuppressant">Immunosuppressant</SelectItem>
                          <SelectItem value="anticoagulant">Anticoagulant</SelectItem>
                          <SelectItem value="antihypertensive">Antihypertensive</SelectItem>
                          <SelectItem value="antidiabetic">Antidiabetic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Originator</Label>
                      <Input
                        placeholder="Enter originator company"
                        value={entry.originator}
                        onChange={(e) => handleUpdateEntry(index, "originator", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Active Companies</Label>
                      <Input
                        placeholder="Enter active companies"
                        value={entry.active_companies}
                        onChange={(e) => handleUpdateEntry(index, "active_companies", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Countries</Label>
                      <Input
                        placeholder="Enter countries"
                        value={entry.countries}
                        onChange={(e) => handleUpdateEntry(index, "countries", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Current Status</Label>
                      <Select
                        value={entry.current_status}
                        onValueChange={(value) => handleUpdateEntry(index, "current_status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select current status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="preclinical">Preclinical</SelectItem>
                          <SelectItem value="phase1">Phase I</SelectItem>
                          <SelectItem value="phase2">Phase II</SelectItem>
                          <SelectItem value="phase3">Phase III</SelectItem>
                          <SelectItem value="phase4">Phase IV</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="discontinued">Discontinued</SelectItem>
                          <SelectItem value="on-hold">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Reference Information</Label>
                    <Textarea
                      placeholder="Enter reference information"
                      value={entry.reference}
                      onChange={(e) => handleUpdateEntry(index, "reference", e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <div className="flex justify-between">
            <Button variant="ghost" asChild>
              <Link href="/admin/drugs/new/overview">Previous</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/drugs/new/drug-activity">Next</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

