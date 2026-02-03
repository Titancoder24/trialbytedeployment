"use client";

import { useEffect } from "react";
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
import { Plus, X } from "lucide-react";
import { useDrugForm } from "../context/drug-form-context";
import DrugFormProgress from "../components/drug-form-progress";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { useDynamicDropdown } from "@/hooks/use-dynamic-dropdown";

export default function DrugsNewOverview() {
  const {
    formData,
    updateField,
    addArrayItem,
    removeArrayItem,
    updateArrayItem,
  } = useDrugForm();
  const form = formData.overview;

  // Dynamic dropdown for Originator (uses Sponsor and Collaborators from dropdown management)
  const { options: originatorOptions, loading: originatorLoading, error: originatorError } = useDynamicDropdown({
    categoryName: 'sponsor_collaborators',
  });

  // Debug logging for dynamic dropdown
  useEffect(() => {
    console.log('[Drug Form] Originator dropdown loading:', originatorLoading);
    console.log('[Drug Form] Originator dropdown error:', originatorError);
    console.log('[Drug Form] Originator options count:', originatorOptions.length);
    if (originatorOptions.length > 0) {
      console.log('[Drug Form] Sample originator options:', originatorOptions.slice(0, 5));
    }
  }, [originatorOptions, originatorLoading, originatorError]);

  const addAttachment = () => addArrayItem("overview", "attachments");
  const removeAttachment = (index: number) =>
    removeArrayItem("overview", "attachments", index);
  const updateAttachment = (index: number, value: string) =>
    updateArrayItem("overview", "attachments", index, value);

  const addLink = () => addArrayItem("overview", "links");
  const removeLink = (index: number) =>
    removeArrayItem("overview", "links", index);
  const updateLink = (index: number, value: string) =>
    updateArrayItem("overview", "links", index, value);

  return (
    <div className="space-y-4">
      <DrugFormProgress currentStep={1} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drugs — Overview</h1>
        <Button asChild>
          <Link href="/admin/drugs/new/dev-status">Next</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Drug Name - Lab code</Label>
              <Input
                placeholder="Enter"
                value={form.drug_name}
                onChange={(e) =>
                  updateField("overview", "drug_name", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Generic Name</Label>
              <Input
                placeholder="Enter"
                value={form.generic_name}
                onChange={(e) =>
                  updateField("overview", "generic_name", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Other Name</Label>
              <Input
                placeholder="Enter"
                value={form.other_name}
                onChange={(e) =>
                  updateField("overview", "other_name", e.target.value)
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Primary Name</Label>
              <Select
                value={form.primary_name}
                onValueChange={(value) =>
                  updateField("overview", "primary_name", value)
                }
              >
                <SelectTrigger className="h-10 border-gray-300">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Global Status</Label>
              <Input
                placeholder="Enter"
                value={form.global_status}
                onChange={(e) =>
                  updateField("overview", "global_status", e.target.value)
                }
                className="h-10 border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label>Development Status</Label>
              <Select
                value={form.development_status}
                onValueChange={(value) =>
                  updateField("overview", "development_status", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preclinical">Preclinical</SelectItem>
                  <SelectItem value="phase1">Phase I</SelectItem>
                  <SelectItem value="phase2">Phase II</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Drug Summary</Label>
            <Textarea
              rows={4}
              placeholder="Enter summary"
              value={form.drug_summary}
              onChange={(e) =>
                updateField("overview", "drug_summary", e.target.value)
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Originator</Label>
              <SearchableSelect
                options={originatorOptions}
                value={form.originator}
                onValueChange={(value) =>
                  updateField("overview", "originator", value)
                }
                placeholder="Select originator"
                searchPlaceholder="Search originator..."
                emptyMessage="No originator found."
                className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                loading={originatorLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Other Active Companies</Label>
              <SearchableSelect
                options={originatorOptions}
                value={form.other_active_companies}
                onValueChange={(value) =>
                  updateField("overview", "other_active_companies", value)
                }
                placeholder="Select other active companies"
                searchPlaceholder="Search companies..."
                emptyMessage="No companies found."
                className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                loading={originatorLoading}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Therapeutic Area</Label>
              <Select
                value={form.therapeutic_area}
                onValueChange={(value) =>
                  updateField("overview", "therapeutic_area", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oncology">Oncology</SelectItem>
                  <SelectItem value="cardiology">Cardiology</SelectItem>
                  <SelectItem value="neurology">Neurology</SelectItem>
                  <SelectItem value="pain-management">
                    Pain Management
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Disease Type</Label>
              <Input
                placeholder="Enter"
                value={form.disease_type}
                onChange={(e) =>
                  updateField("overview", "disease_type", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Regulatory Designations</Label>
              <Select
                value={form.regulatory_designations}
                onValueChange={(value) =>
                  updateField("overview", "regulatory_designations", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast-track">Fast Track</SelectItem>
                  <SelectItem value="breakthrough">Breakthrough</SelectItem>
                  <SelectItem value="orphan">Orphan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border p-4 space-y-4">
            <div className="font-medium">Drug Development Status</div>
            <div className="grid gap-4 sm:grid-cols-5">
              <div className="space-y-2">
                <Label>Disease Type</Label>
                <Select
                  value={formData.devStatus.disease_type}
                  onValueChange={(value) =>
                    updateField("devStatus", "disease_type", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="type-a">Type A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Therapeutic Class</Label>
                <Select
                  value={formData.devStatus.therapeutic_class}
                  onValueChange={(value) =>
                    updateField("devStatus", "therapeutic_class", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class-a">Class A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  placeholder="Enter"
                  value={formData.devStatus.company}
                  onChange={(e) =>
                    updateField("devStatus", "company", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Company Type</Label>
                <Select
                  value={formData.devStatus.company_type}
                  onValueChange={(value) =>
                    updateField("devStatus", "company_type", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sponsor">Sponsor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.devStatus.status}
                  onValueChange={(value) =>
                    updateField("devStatus", "status", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Add Attachments</Label>
                {form.attachments.map((v, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Attachment"
                      value={v}
                      onChange={(e) => updateAttachment(i, e.target.value)}
                    />
                    {i === 0 ? (
                      <Button
                        variant="outline"
                        type="button"
                        onClick={addAttachment}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => removeAttachment(i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Add Links</Label>
                {form.links.map((v, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="https://..."
                      value={v}
                      onChange={(e) => updateLink(i, e.target.value)}
                    />
                    {i === 0 ? (
                      <Button variant="outline" type="button" onClick={addLink}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => removeLink(i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Source Links</Label>
              <Input
                placeholder="Enter"
                value={form.source_links}
                onChange={(e) =>
                  updateField("overview", "source_links", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Drug Record Status</Label>
              <Select
                value={form.drug_record_status}
                onValueChange={(value) =>
                  updateField("overview", "drug_record_status", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" asChild>
              <Link href="/admin/drugs">Cancel</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/drugs/new/dev-status">Next</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
