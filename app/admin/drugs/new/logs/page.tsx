"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useDrugForm } from "../context/drug-form-context";
import { useRouter } from "next/navigation";
import DrugFormProgress from "../components/drug-form-progress";

export default function DrugsNewLogs() {
  const router = useRouter();
  const { formData, updateField, resetForm } = useDrugForm();
  const [loading, setLoading] = useState(false);
  const form = formData.logs;

  const finish = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");

      if (!userId) {
        toast({
          title: "Error",
          description: "User ID not found. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      console.log("Creating drug...");

      // Prepare the payload in the exact format specified
      const drugPayload = {
        user_id: userId,
        overview: {
          drug_name: formData.overview.drug_name || "",
          generic_name: formData.overview.generic_name || "",
          therapeutic_area: formData.overview.therapeutic_area || "",
          disease_type: formData.overview.disease_type || "",
          is_approved: formData.overview.drug_record_status === "active",
        },
        devStatus: {
          disease_type: formData.devStatus.disease_type || "",
          therapeutic_class: formData.devStatus.therapeutic_class || "",
          company: formData.devStatus.company || "",
          status: formData.devStatus.status || "",
        },
        activity: {
          mechanism_of_action: formData.activity.mechanism_of_action || "",
          biological_target: formData.activity.biological_target || "",
          delivery_route: formData.activity.delivery_route || "",
        },
        development: {
          preclinical: formData.development.preclinical || "",
          status: formData.development.status || "",
          sponsor: formData.development.sponsor || "",
        },
        otherSources: {
          data: formData.otherSources.data || "Additional information",
        },
        licencesMarketing: {
          agreement: formData.licencesMarketing.agreement || "",
          marketing_approvals:
            formData.licencesMarketing.marketing_approvals || "",
        },
        logs: {
          drug_changes_log:
            formData.logs.drug_changes_log || "Initial creation",
          notes: formData.logs.notes || "Standard drug information",
        },
      };

      console.log("Sending drug payload:", drugPayload);

      // Send to the API endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/drugs/create-drug`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(drugPayload),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Drug created successfully:", result);

      toast({
        title: "Success!",
        description: "Drug created successfully",
      });

      // Reset form and redirect
      resetForm();
      router.push("/admin/drugs");
    } catch (error) {
      console.error("Error creating drug:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create drug. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <DrugFormProgress currentStep={7} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drugs — Logs & Finish</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Logs & Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Drug Changes Log</Label>
            <Textarea
              rows={4}
              placeholder="Enter any changes or updates to the drug..."
              value={form.drug_changes_log}
              onChange={(e) =>
                updateField("logs", "drug_changes_log", e.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              rows={4}
              placeholder="Enter any additional notes or documentation..."
              value={form.notes}
              onChange={(e) => updateField("logs", "notes", e.target.value)}
            />
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" asChild>
              <Link href="/admin/drugs/new/licensing">Previous</Link>
            </Button>
            <Button
              onClick={finish}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Creating..." : "Finish & Create Drug"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
