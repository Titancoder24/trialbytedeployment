"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { X, Search } from "lucide-react"
import { useDynamicDropdown } from "@/hooks/use-dynamic-dropdown"
import {
  GLOBAL_STATUS_OPTIONS,
  DEVELOPMENT_STATUS_OPTIONS_DETAILED,
  THERAPEUTIC_AREA_OPTIONS,
  DISEASE_TYPE_OPTIONS,
  ORIGINATOR_OPTIONS,
  REGULATORY_DESIGNATIONS_OPTIONS,
  DRUG_RECORD_STATUS_OPTIONS,
  IS_APPROVED_OPTIONS,
  COMPANY_TYPE_OPTIONS,
  MECHANISM_OF_ACTION_OPTIONS,
  BIOLOGICAL_TARGET_OPTIONS,
  DRUG_TECHNOLOGY_OPTIONS,
  DELIVERY_ROUTE_OPTIONS,
  DELIVERY_MEDIUM_OPTIONS,
  THERAPEUTIC_CLASS_OPTIONS,
  COUNTRY_OPTIONS,
  SearchableSelectOption
} from "@/app/admin/drugs/drug-options"

export interface DrugFilterState {
  globalStatuses: string[]
  developmentStatuses: string[]
  therapeuticAreas: string[]
  diseaseTypes: string[]
  originators: string[]
  otherActiveCompanies: string[]
  regulatorDesignations: string[]
  drugRecordStatus: string[]
  isApproved: string[]
  companyTypes: string[]
  mechanismOfAction: string[]
  biologicalTargets: string[]
  drugTechnologies: string[]
  deliveryRoutes: string[]
  deliveryMediums: string[]
  therapeuticClasses: string[]
  countries: string[]
  primaryNames: string[]
}

interface DrugFilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplyFilters: (filters: DrugFilterState) => void
  currentFilters: DrugFilterState
  primaryNameOptions: SearchableSelectOption[]
}

export function DrugFilterModal({ open, onOpenChange, onApplyFilters, currentFilters, primaryNameOptions }: DrugFilterModalProps) {
  const [filters, setFilters] = useState<DrugFilterState>(currentFilters)
  const [activeCategory, setActiveCategory] = useState<keyof DrugFilterState>("globalStatuses")
  const [searchFilter, setSearchFilter] = useState("")

  // Dynamic dropdown for Originator (uses Sponsor and Collaborators from dropdown management)
  const { options: dynamicOriginatorOptions, loading: originatorLoading } = useDynamicDropdown({
    categoryName: 'sponsor_collaborators',
    fallbackOptions: ORIGINATOR_OPTIONS,
  });

  // Update local state when props change (re-opening modal)
  useEffect(() => {
    if (open) {
      setFilters(currentFilters)
      setSearchFilter("")
    }
  }, [open, currentFilters])

  // Use dynamic options if available, otherwise use static
  const originatorOptions = dynamicOriginatorOptions.length > 0 ? dynamicOriginatorOptions : ORIGINATOR_OPTIONS;

  const filterCategories: Record<keyof DrugFilterState, SearchableSelectOption[]> = useMemo(() => ({
    globalStatuses: GLOBAL_STATUS_OPTIONS,
    developmentStatuses: DEVELOPMENT_STATUS_OPTIONS_DETAILED,
    therapeuticAreas: THERAPEUTIC_AREA_OPTIONS,
    diseaseTypes: DISEASE_TYPE_OPTIONS,
    originators: originatorOptions,
    otherActiveCompanies: originatorOptions,
    regulatorDesignations: REGULATORY_DESIGNATIONS_OPTIONS,
    drugRecordStatus: DRUG_RECORD_STATUS_OPTIONS,
    isApproved: IS_APPROVED_OPTIONS,
    companyTypes: COMPANY_TYPE_OPTIONS,
    mechanismOfAction: MECHANISM_OF_ACTION_OPTIONS,
    biologicalTargets: BIOLOGICAL_TARGET_OPTIONS,
    drugTechnologies: DRUG_TECHNOLOGY_OPTIONS,
    deliveryRoutes: DELIVERY_ROUTE_OPTIONS,
    deliveryMediums: DELIVERY_MEDIUM_OPTIONS,
    therapeuticClasses: THERAPEUTIC_CLASS_OPTIONS,
    countries: COUNTRY_OPTIONS,
    primaryNames: primaryNameOptions
  }), [originatorOptions, primaryNameOptions]);

  const categoryLabels: Record<keyof DrugFilterState, string> = {
    globalStatuses: "Global Status",
    developmentStatuses: "Development Status",
    therapeuticAreas: "Therapeutic Area",
    diseaseTypes: "Disease Type",
    originators: "Originator",
    otherActiveCompanies: "Other Active Companies",
    regulatorDesignations: "Regulator Designations",
    drugRecordStatus: "Drug Record Status",
    isApproved: "Approval Status",
    companyTypes: "Company Type",
    mechanismOfAction: "Mechanism of Action",
    biologicalTargets: "Biological Target",
    drugTechnologies: "Drug Technology",
    deliveryRoutes: "Delivery Route",
    deliveryMediums: "Delivery Medium",
    therapeuticClasses: "Therapeutic Class",
    countries: "Country",
    primaryNames: "Primary Name"
  }

  const handleSelectAll = (category: keyof DrugFilterState) => {
    setFilters((prev) => ({
      ...prev,
      [category]: filterCategories[category].map(o => o.value),
    }))
  }

  const handleDeselectAll = (category: keyof DrugFilterState) => {
    setFilters((prev) => ({
      ...prev,
      [category]: [],
    }))
  }

  const handleItemToggle = (category: keyof DrugFilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((i) => i !== value)
        : [...prev[category], value],
    }))
  }

  const handleApply = () => {
    onApplyFilters(filters)
    onOpenChange(false)
  }

  const handleSaveQuery = () => {
    const activeFilterCount = Object.values(filters).reduce((count, arr) => count + arr.length, 0);
    const queryName = `Drug Filter Query (${activeFilterCount} filters) - ${new Date().toLocaleDateString()}`;

    const savedQueries = JSON.parse(localStorage.getItem('drugFilterQueries') || '[]');
    const newQuery = {
      id: Date.now().toString(),
      name: queryName,
      filters: filters,
      createdAt: new Date().toISOString()
    };

    savedQueries.push(newQuery);
    localStorage.setItem('drugFilterQueries', JSON.stringify(savedQueries));

    alert(`Query saved as: ${queryName}`);
  }

  // Filter options based on search
  const getFilteredOptions = () => {
    const options = filterCategories[activeCategory] || []
    if (!searchFilter.trim()) return options
    return options.filter(option =>
      option.label.toLowerCase().includes(searchFilter.toLowerCase())
    )
  }

  const currentOptions = getFilteredOptions()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b bg-blue-50 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Drug Filters</DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left sidebar with filter categories */}
          <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto shrink-0">
            <div className="space-y-2">
              {Object.keys(categoryLabels).map((key) => {
                const category = key as keyof DrugFilterState
                const selectedCount = filters[category]?.length || 0
                return (
                  <button
                    key={category}
                    onClick={() => {
                      setActiveCategory(category)
                      setSearchFilter("")
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between ${activeCategory === category ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                      }`}
                  >
                    <span>{categoryLabels[category]}</span>
                    {selectedCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full">
                        {selectedCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right content area */}
          <div className="flex-1 p-6 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="font-medium">{categoryLabels[activeCategory]}</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    filters[activeCategory].length === filterCategories[activeCategory].length
                      ? handleDeselectAll(activeCategory)
                      : handleSelectAll(activeCategory)
                  }
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {filters[activeCategory].length === filterCategories[activeCategory].length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>
            </div>

            <div className="relative mb-4 shrink-0">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${categoryLabels[activeCategory]}...`}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
              {currentOptions.length > 0 ? (
                currentOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${activeCategory}-${option.value}`}
                      checked={filters[activeCategory].includes(option.value)}
                      onCheckedChange={() => handleItemToggle(activeCategory, option.value)}
                    />
                    <label
                      htmlFor={`${activeCategory}-${option.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  No options found
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 shrink-0">
          <Button variant="outline" onClick={handleSaveQuery} className="bg-blue-600 text-white hover:bg-blue-700">
            <span className="mr-2">💾</span>
            Save this Query
          </Button>
          <Button onClick={handleApply} className="bg-blue-600 hover:bg-blue-700">
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
