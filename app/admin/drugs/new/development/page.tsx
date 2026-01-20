"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDrugForm } from "../context/drug-form-context";
import DrugFormProgress from "../components/drug-form-progress";

export default function DrugsNewDevelopment() {
  const { formData, updateField } = useDrugForm();
  const form = formData.development;

  return (
    <div className="space-y-4">
      <DrugFormProgress currentStep={4} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drugs — Development</h1>
        <Button asChild>
          <Link href="/admin/drugs/new/other-sources">Next</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">
            Development Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Preclinical Status</Label>
              <Select
                value={form.preclinical}
                onValueChange={(value) =>
                  updateField("development", "preclinical", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Development Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  updateField("development", "status", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preclinical">Preclinical</SelectItem>
                  <SelectItem value="phase1">Phase I</SelectItem>
                  <SelectItem value="phase2">Phase II</SelectItem>
                  <SelectItem value="phase3">Phase III</SelectItem>
                  <SelectItem value="nda">NDA Submitted</SelectItem>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sponsor</Label>
              <Input
                placeholder="Enter sponsor name"
                value={form.sponsor}
                onChange={(e) =>
                  updateField("development", "sponsor", e.target.value)
                }
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" asChild>
              <Link href="/admin/drugs/new/drug-activity">Previous</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/drugs/new/other-sources">Next</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
