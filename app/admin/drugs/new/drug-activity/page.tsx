"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export default function DrugsNewActivity() {
  const { formData, updateField } = useDrugForm();
  const form = formData.activity;

  return (
    <div className="space-y-4">
      <DrugFormProgress currentStep={3} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drug Activity</h1>
        <Button asChild>
          <Link href="/admin/drugs/new/development">Next</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Drug Activity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Mechanism of action</Label>
            <Select
              value={form.mechanism_of_action}
              onValueChange={(value) =>
                updateField("activity", "mechanism_of_action", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mechanism" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cox-inhibition">COX Inhibition</SelectItem>
                <SelectItem value="receptor-blockade">
                  Receptor Blockade
                </SelectItem>
                <SelectItem value="enzyme-inhibition">
                  Enzyme Inhibition
                </SelectItem>
                <SelectItem value="ion-channel-modulation">
                  Ion Channel Modulation
                </SelectItem>
                <SelectItem value="dna-synthesis-inhibition">
                  DNA Synthesis Inhibition
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Biological target</Label>
            <Input
              placeholder="Enter biological target"
              value={form.biological_target}
              onChange={(e) =>
                updateField("activity", "biological_target", e.target.value)
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Drug Technology</Label>
            <Textarea
              rows={6}
              placeholder="Enter drug technology details"
              value={form.drug_technology}
              onChange={(e) =>
                updateField("activity", "drug_technology", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Delivery Route</Label>
            <Select
              value={form.delivery_route}
              onValueChange={(value) =>
                updateField("activity", "delivery_route", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select delivery route" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oral">Oral</SelectItem>
                <SelectItem value="intravenous">Intravenous</SelectItem>
                <SelectItem value="intramuscular">Intramuscular</SelectItem>
                <SelectItem value="subcutaneous">Subcutaneous</SelectItem>
                <SelectItem value="topical">Topical</SelectItem>
                <SelectItem value="inhalation">Inhalation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Delivery Medium</Label>
            <Select
              value={form.delivery_medium}
              onValueChange={(value) =>
                updateField("activity", "delivery_medium", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select delivery medium" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tablet">Tablet</SelectItem>
                <SelectItem value="capsule">Capsule</SelectItem>
                <SelectItem value="liquid">Liquid</SelectItem>
                <SelectItem value="injection">Injection</SelectItem>
                <SelectItem value="cream">Cream</SelectItem>
                <SelectItem value="aerosol">Aerosol</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" asChild>
          <Link href="/admin/drugs/new/dev-status">Previous</Link>
        </Button>
        <Button asChild>
          <Link href="/admin/drugs/new/development">Next</Link>
        </Button>
      </div>
    </div>
  );
}
