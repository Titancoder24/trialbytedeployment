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

export default function DrugsNewLicensing() {
  const { formData, updateField } = useDrugForm();
  const form = formData.licencesMarketing;

  return (
    <div className="space-y-4">
      <DrugFormProgress currentStep={6} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drugs — Licensing & Marketing</h1>
        <Button asChild>
          <Link href="/admin/drugs/new/logs">Next</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Licensing & Marketing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Agreement Type</Label>
              <Select
                value={form.agreement}
                onValueChange={(value) =>
                  updateField("licencesMarketing", "agreement", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select agreement type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proprietary">Proprietary</SelectItem>
                  <SelectItem value="licensed">Licensed</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="joint-venture">Joint Venture</SelectItem>
                  <SelectItem value="distribution">Distribution</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Marketing Approvals</Label>
              <Input
                placeholder="e.g., FDA, EMA, PMDA"
                value={form.marketing_approvals}
                onChange={(e) =>
                  updateField(
                    "licencesMarketing",
                    "marketing_approvals",
                    e.target.value
                  )
                }
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" asChild>
              <Link href="/admin/drugs/new/other-sources">Previous</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/drugs/new/logs">Next</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
