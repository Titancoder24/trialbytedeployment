"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useDrugForm } from "../context/drug-form-context";
import DrugFormProgress from "../components/drug-form-progress";

export default function DrugsNewOtherSources() {
  const { formData, updateField } = useDrugForm();
  const form = formData.otherSources;

  return (
    <div className="space-y-4">
      <DrugFormProgress currentStep={5} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drugs — Other Sources</h1>
        <Button asChild>
          <Link href="/admin/drugs/new/licensing">Next</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">
            Other Sources & Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Additional Information</Label>
            <Textarea
              rows={6}
              placeholder="Enter any additional information about the drug from other sources..."
              value={form.data}
              onChange={(e) =>
                updateField("otherSources", "data", e.target.value)
              }
            />
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" asChild>
              <Link href="/admin/drugs/new/development">Previous</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/drugs/new/licensing">Next</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
