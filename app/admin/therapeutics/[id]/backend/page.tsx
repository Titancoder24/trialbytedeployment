"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Maximize2, Minimize2, X, Eye, EyeOff, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types based on the API response
interface TherapeuticTrial {
  trial_id: string;
  overview: {
    id: string;
    therapeutic_area: string;
    trial_identifier: string[];
    trial_phase: string;
    status: string;
    primary_drugs: string;
    other_drugs: string;
    title: string;
    disease_type: string;
    patient_segment: string;
    line_of_therapy: string;
    reference_links: string[];
    trial_tags: string;
    sponsor_collaborators: string;
    sponsor_field_activity: string;
    associated_cro: string;
    countries: string;
    region: string;
    trial_record_status: string;
    created_at: string;
    updated_at: string;
  };
  outcomes: Array<{
    id: string;
    trial_id: string;
    purpose_of_trial: string;
    summary: string;
    primary_outcome_measure: string;
    other_outcome_measure: string;
    study_design_keywords: string;
    study_design: string;
    treatment_regimen: string;
    number_of_arms: number;
  }>;
  criteria: Array<{
    id: string;
    trial_id: string;
    inclusion_criteria: string;
    exclusion_criteria: string;
    age_from: string;
    subject_type: string;
    age_to: string;
    sex: string;
    healthy_volunteers: string;
    target_no_volunteers: number;
    actual_enrolled_volunteers: number | null;
    ecog_performance_status: string | null;
    healthy_volunteers: string | null;
    biomarker_requirements: string | null;
  }>;
  timing: Array<{
    id: string;
    trial_id: string;
    start_date_actual: string | null;
    start_date_benchmark: string | null;
    start_date_estimated: string | null;
    inclusion_period_actual: string | null;
    inclusion_period_benchmark: string | null;
    inclusion_period_estimated: string | null;
    enrollment_closed_actual: string | null;
    enrollment_closed_benchmark: string | null;
    enrollment_closed_estimated: string | null;
    primary_outcome_duration_actual: string | null;
    primary_outcome_duration_benchmark: string | null;
    primary_outcome_duration_estimated: string | null;
    trial_end_date_actual: string | null;
    trial_end_date_benchmark: string | null;
    trial_end_date_estimated: string | null;
    result_duration_actual: string | null;
    result_duration_benchmark: string | null;
    result_duration_estimated: string | null;
    result_published_date_actual: string | null;
    result_published_date_benchmark: string | null;
    result_published_date_estimated: string | null;
    overall_duration_complete: string | null;
    overall_duration_publish: string | null;
  }>;
  results: Array<{
    id: string;
    trial_id: string;
    trial_outcome: string;
    reference: string;
    trial_results: string[];
    adverse_event_reported: string;
    adverse_event_type: string | null;
    treatment_for_adverse_events: string | null;
    results_available: string | null;
    endpoints_met: string | null;
    trial_outcome_content: string | null;
    trial_outcome_link: string | null;
    trial_outcome_attachment: string | null;
    site_notes: Array<{
      date: string;
      type: string;
      content: string;
      sourceLink: string;
      sourceType: string;
      attachments: string[];
    }> | null;
  }>;
  sites: Array<{
    id: string;
    trial_id: string;
    total: number;
    notes: string;
    study_sites: string[] | null;
    principal_investigators: string[] | null;
    site_status: string | null;
    site_countries: string[] | null;
    site_regions: string[] | null;
    site_contact_info: string[] | null;
  }>;
  other: Array<{
    id: string;
    trial_id: string;
    data: string;
  }>;
  logs: Array<{
    id: string;
    trial_id: string;
    trial_changes_log: string;
    trial_added_date: string;
    last_modified_date: string | null;
    last_modified_user: string | null;
    full_review_user: string | null;
    next_review_date: string | null;
    attachment: string | null;
  }>;
  notes: Array<{
    id: string;
    trial_id: string;
    date_type: string;
    notes: string;
    link: string;
    attachments: string[] | null;
  }>;
}

// Form Progress Component (Read-only version matching creation phase)
const FormProgress = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { number: 1, title: "Trial Overview", path: "#overview" },
    { number: 2, title: "Outcome Measured", path: "#outcomes" },
    { number: 3, title: "Participation Criteria", path: "#criteria" },
    { number: 4, title: "Timing", path: "#timing" },
    { number: 5, title: "Results", path: "#results" },
    { number: 6, title: "Sites", path: "#sites" },
    { number: 7, title: "Other Sources", path: "#other" },
    { number: 8, title: "Logs", path: "#logs" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg" style={{ backgroundColor: '#61CCFA66' }}>
        <div className="flex">
          {steps.map((step) => {
            const isActive = currentStep === step.number;
            return (
              <div
                key={step.number}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all border-b-2 ${isActive
                  ? "text-white border-b-transparent"
                  : "text-gray-700 border-b-transparent"
                  }`}
                style={{
                  backgroundColor: isActive ? '#204B73' : 'transparent'
                }}
              >
                <div className="flex items-center gap-2">
                  {step.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Read-only SearchableSelect component
const ReadOnlySearchableSelect = ({
  value,
  options,
  placeholder = "No selection"
}: {
  value: string;
  options: SearchableSelectOption[];
  placeholder?: string;
}) => {
  const selectedOption = options.find(option => option.value === value);
  return (
    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 min-h-[40px] flex items-center">
      {selectedOption ? selectedOption.label : placeholder}
    </div>
  );
};

// Read-only Input component
const ReadOnlyInput = ({ value, placeholder = "No data" }: { value: string; placeholder?: string }) => (
  <Input
    value={value || placeholder}
    readOnly
    className="bg-gray-50 text-gray-700 border-gray-300"
  />
);

// Read-only Textarea component
const ReadOnlyTextarea = ({ value, placeholder = "No data", rows = 3 }: { value: string; placeholder?: string; rows?: number }) => (
  <Textarea
    value={value || placeholder}
    readOnly
    className="bg-gray-50 text-gray-700 border-gray-300 resize-none"
    rows={rows}
  />
);

// Read-only Switch component
const ReadOnlySwitch = ({ checked }: { checked: boolean }) => (
  <div className="flex items-center space-x-2">
    <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}>
      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
    </div>
    <span className="text-sm text-gray-700">{checked ? 'Yes' : 'No'}</span>
  </div>
);

export default function TherapeuticBackendView({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [trial, setTrial] = useState<TherapeuticTrial | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeOtherSourceTab, setActiveOtherSourceTab] = useState("pipeline_data");

  // Resolve params
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  // Fetch trial data
  useEffect(() => {
    if (!resolvedParams) return;

    const fetchTrial = async () => {
      try {
        setLoading(true);
        const trialId = resolvedParams.id;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/therapeutic/trial/${trialId}/all-data`);

        if (!response.ok) {
          if (response.status === 404) {
            toast({
              title: "Trial Not Found",
              description: "The requested therapeutic trial could not be found.",
              variant: "destructive",
            });
            router.push("/admin/therapeutics");
            return;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.data) {
          const transformedTrial: TherapeuticTrial = {
            trial_id: data.trial_id,
            overview: {
              id: data.data.overview.id,
              therapeutic_area: data.data.overview.therapeutic_area || "",
              trial_identifier: data.data.overview.trial_identifier || [],
              trial_phase: data.data.overview.trial_phase || "",
              status: data.data.overview.status || "",
              primary_drugs: data.data.overview.primary_drugs || "",
              other_drugs: data.data.overview.other_drugs || "",
              title: data.data.overview.title || "",
              disease_type: data.data.overview.disease_type || "",
              patient_segment: data.data.overview.patient_segment || "",
              line_of_therapy: data.data.overview.line_of_therapy || "",
              reference_links: data.data.overview.reference_links || [],
              trial_tags: data.data.overview.trial_tags || "",
              sponsor_collaborators: data.data.overview.sponsor_collaborators || "",
              sponsor_field_activity: data.data.overview.sponsor_field_activity || "",
              associated_cro: data.data.overview.associated_cro || "",
              countries: data.data.overview.countries || "",
              region: data.data.overview.region || "",
              trial_record_status: data.data.overview.trial_record_status || "",
              created_at: data.data.overview.created_at || "",
              updated_at: data.data.overview.updated_at || "",
            },
            outcomes: data.data.outcomes.map((outcome: any) => ({
              id: outcome.id,
              trial_id: outcome.trial_id,
              purpose_of_trial: outcome.purpose_of_trial || "",
              summary: outcome.summary || "",
              primary_outcome_measure: outcome.primary_outcome_measure || "",
              other_outcome_measure: outcome.other_outcome_measure || "",
              study_design_keywords: outcome.study_design_keywords || "",
              study_design: outcome.study_design || "",
              treatment_regimen: outcome.treatment_regimen || "",
              number_of_arms: outcome.number_of_arms || 0,
            })),
            criteria: data.data.criteria.map((criterion: any) => ({
              id: criterion.id,
              trial_id: criterion.trial_id,
              inclusion_criteria: criterion.inclusion_criteria || "",
              exclusion_criteria: criterion.exclusion_criteria || "",
              age_from: criterion.age_from || "",
              subject_type: criterion.subject_type || "",
              age_to: criterion.age_to || "",
              sex: criterion.sex || "",
              healthy_volunteers: criterion.healthy_volunteers || "",
              target_no_volunteers: criterion.target_no_volunteers || 0,
              actual_enrolled_volunteers: criterion.actual_enrolled_volunteers || null,
            })),
            timing: data.data.timing.map((timing: any) => ({
              id: timing.id,
              trial_id: timing.trial_id,
              start_date_actual: timing.start_date_actual || null,
              start_date_benchmark: timing.start_date_benchmark || null,
              start_date_estimated: timing.start_date_estimated || null,
              inclusion_period_actual: timing.inclusion_period_actual || null,
              inclusion_period_benchmark: timing.inclusion_period_benchmark || null,
              inclusion_period_estimated: timing.inclusion_period_estimated || null,
              enrollment_closed_actual: timing.enrollment_closed_actual || null,
              enrollment_closed_benchmark: timing.enrollment_closed_benchmark || null,
              enrollment_closed_estimated: timing.enrollment_closed_estimated || null,
              primary_outcome_duration_actual: timing.primary_outcome_duration_actual || null,
              primary_outcome_duration_benchmark: timing.primary_outcome_duration_benchmark || null,
              primary_outcome_duration_estimated: timing.primary_outcome_duration_estimated || null,
              trial_end_date_actual: timing.trial_end_date_actual || null,
              trial_end_date_benchmark: timing.trial_end_date_benchmark || null,
              trial_end_date_estimated: timing.trial_end_date_estimated || null,
              result_duration_actual: timing.result_duration_actual || null,
              result_duration_benchmark: timing.result_duration_benchmark || null,
              result_duration_estimated: timing.result_duration_estimated || null,
              result_published_date_actual: timing.result_published_date_actual || null,
              result_published_date_benchmark: timing.result_published_date_benchmark || null,
              result_published_date_estimated: timing.result_published_date_estimated || null,
            })),
            results: data.data.results.map((result: any) => ({
              id: result.id,
              trial_id: result.trial_id,
              trial_outcome: result.trial_outcome || "",
              reference: result.reference || "",
              trial_results: result.trial_results || [],
              adverse_event_reported: result.adverse_event_reported || "",
              adverse_event_type: result.adverse_event_type || "",
              treatment_for_adverse_events: result.treatment_for_adverse_events || "",
            })),
            sites: data.data.sites.map((site: any) => ({
              id: site.id,
              trial_id: site.trial_id,
              total: site.total || 0,
              notes: site.notes || "",
            })),
            other: data.data.other.map((other: any) => ({
              id: other.id,
              trial_id: other.trial_id,
              data: other.data || "",
            })),
            logs: data.data.logs.map((log: any) => ({
              id: log.id,
              trial_id: log.trial_id,
              trial_changes_log: log.trial_changes_log || "",
              trial_added_date: log.trial_added_date || "",
              last_modified_date: log.last_modified_date || "",
              last_modified_user: log.last_modified_user || "",
              full_review_user: log.full_review_user || "",
              next_review_date: log.next_review_date || "",
              attachment: log.attachment || null,
            })),
            notes: data.data.notes.map((note: any) => ({
              id: note.id,
              trial_id: note.trial_id,
              date_type: note.date_type || "",
              notes: note.notes || "",
              link: note.link || "",
              attachments: (() => {
                if (Array.isArray(note.attachments)) {
                  return note.attachments;
                } else if (typeof note.attachments === 'string' && note.attachments.trim()) {
                  try {
                    const parsed = JSON.parse(note.attachments);
                    return Array.isArray(parsed) ? parsed : [note.attachments];
                  } catch {
                    return note.attachments.includes(',')
                      ? note.attachments.split(',').map((item: string) => item.trim()).filter((item: string) => item)
                      : [note.attachments];
                  }
                }
                return [];
              })(),
            })),
          };

          setTrial(transformedTrial);
        } else {
          toast({
            title: "No Data Available",
            description: "Unable to load trial data.",
            variant: "destructive",
          });
          router.push("/admin/therapeutics");
        }
      } catch (error) {
        console.error("Error fetching trial:", error);
        toast({
          title: "Error",
          description: "Failed to load trial data.",
          variant: "destructive",
        });
        router.push("/admin/therapeutics");
      } finally {
        setLoading(false);
      }
    };

    fetchTrial();
  }, [resolvedParams, router]);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (!isMaximized) {
      window.moveTo(0, 0);
      window.resizeTo(screen.width, screen.height);
    } else {
      window.resizeTo(1200, 800);
      window.moveTo(100, 100);
    }
  };

  const closeWindow = () => {
    window.close();
  };

  const copyToClipboard = () => {
    if (trial) {
      navigator.clipboard.writeText(JSON.stringify(trial, null, 2));
      toast({
        title: "Copied to Clipboard",
        description: "Trial data has been copied to clipboard.",
      });
    }
  };

  const downloadJSON = () => {
    if (trial) {
      const dataStr = JSON.stringify(trial, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = `trial_${trial.trial_id}_backend_data.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      toast({
        title: "Download Complete",
        description: "Trial backend data has been downloaded.",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString || dateString === "") return "No date";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Dropdown options (same as creation phase)
  const therapeuticAreaOptions: SearchableSelectOption[] = [
    { value: "autoimmune", label: "Autoimmune" },
    { value: "cardiovascular", label: "Cardiovascular" },
    { value: "endocrinology", label: "Endocrinology" },
    { value: "gastrointestinal", label: "Gastrointestinal" },
    { value: "infectious", label: "Infectious" },
    { value: "oncology", label: "Oncology" },
    { value: "gastroenterology", label: "Gastroenterology" },
    { value: "dermatology", label: "Dermatology" },
    { value: "vaccines", label: "Vaccines" },
    { value: "cns_neurology", label: "CNS/Neurology" },
    { value: "ophthalmology", label: "Ophthalmology" },
    { value: "immunology", label: "Immunology" },
    { value: "rheumatology", label: "Rheumatology" },
    { value: "haematology", label: "Haematology" },
    { value: "nephrology", label: "Nephrology" },
    { value: "urology", label: "Urology" },
  ];

  const trialPhaseOptions: SearchableSelectOption[] = [
    { value: "phase_i", label: "Phase I" },
    { value: "phase_i_ii", label: "Phase I/II" },
    { value: "phase_ii", label: "Phase II" },
    { value: "phase_ii_iii", label: "Phase II/III" },
    { value: "phase_iii", label: "Phase III" },
    { value: "phase_iii_iv", label: "Phase III/IV" },
    { value: "phase_iv", label: "Phase IV" },
  ];

  const statusOptions: SearchableSelectOption[] = [
    { value: "planned", label: "Planned" },
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
    { value: "completed", label: "Completed" },
    { value: "terminated", label: "Terminated" },
    { value: "suspended", label: "Suspended" },
    { value: "not_yet_recruiting", label: "Not yet recruiting" },
    { value: "recruiting", label: "Recruiting" },
    { value: "active", label: "Active" },
  ];

  const diseaseTypeOptions: SearchableSelectOption[] = [
    { value: "acute_lymphocytic_leukemia", label: "Acute Lymphocytic Leukemia" },
    { value: "acute_myelogenous_leukemia", label: "Acute Myelogenous Leukemia" },
    { value: "anal", label: "Anal" },
    { value: "appendiceal", label: "Appendiceal" },
    { value: "basal_skin_cell_carcinoma", label: "Basal Skin Cell Carcinoma" },
    { value: "bladder", label: "Bladder" },
    { value: "breast", label: "Breast" },
    { value: "cervical", label: "Cervical" },
    { value: "cholangiocarcinoma", label: "Cholangiocarcinoma (Bile duct)" },
    { value: "chronic_lymphocytic_leukemia", label: "Chronic Lymphocytic Leukemia" },
    { value: "colorectal", label: "Colorectal" },
    { value: "endometrial", label: "Endometrial" },
    { value: "esophageal", label: "Esophageal" },
    { value: "gastric", label: "Gastric" },
    { value: "head_neck", label: "Head/Neck" },
    { value: "hodgkins_lymphoma", label: "Hodgkin's Lymphoma" },
    { value: "liver", label: "Liver" },
    { value: "lung_non_small_cell", label: "Lung Non-small cell" },
    { value: "lung_small_cell", label: "Lung Small Cell" },
    { value: "melanoma", label: "Melanoma" },
    { value: "multiple_myeloma", label: "Multiple Myeloma" },
    { value: "non_hodgkins_lymphoma", label: "Non-Hodgkin's Lymphoma" },
    { value: "ovarian", label: "Ovarian" },
    { value: "pancreas", label: "Pancreas" },
    { value: "prostate", label: "Prostate" },
    { value: "renal", label: "Renal" },
    { value: "thyroid", label: "Thyroid" },
    { value: "unspecified_cancer", label: "Unspecified Cancer" },
  ];

  const patientSegmentOptions: SearchableSelectOption[] = [
    { value: "children", label: "Children" },
    { value: "adults", label: "Adults" },
    { value: "healthy_volunteers", label: "Healthy Volunteers" },
    { value: "unknown", label: "Unknown" },
    { value: "first_line", label: "First Line" },
    { value: "second_line", label: "Second Line" },
    { value: "adjuvant", label: "Adjuvant" },
    { value: "early_stage", label: "Early Stage" },
    { value: "locally_advanced", label: "Locally Advanced" },
    { value: "metastatic", label: "Metastatic" },
    { value: "geriatric", label: "Geriatric" },
    { value: "pediatric", label: "Pediatric" },
  ];

  const lineOfTherapyOptions: SearchableSelectOption[] = [
    { value: "first_line", label: "1 – First Line" },
    { value: "second_line", label: "2 – Second Line" },
    { value: "at_least_second_line", label: "2+ - At least second line" },
    { value: "at_least_third_line", label: "3+ - At least third line" },
    { value: "neo_adjuvant", label: "Neo-Adjuvant" },
    { value: "adjuvant", label: "Adjuvant" },
    { value: "maintenance_consolidation", label: "Maintenance/Consolidation" },
    { value: "at_least_first_line", label: "1+ - At least first line" },
    { value: "unknown", label: "Unknown" },
  ];

  const countriesOptions: SearchableSelectOption[] = [
    { value: "united_states", label: "United States" },
    { value: "canada", label: "Canada" },
    { value: "united_kingdom", label: "United Kingdom" },
    { value: "germany", label: "Germany" },
    { value: "france", label: "France" },
    { value: "italy", label: "Italy" },
    { value: "spain", label: "Spain" },
    { value: "japan", label: "Japan" },
    { value: "china", label: "China" },
    { value: "india", label: "India" },
    { value: "australia", label: "Australia" },
    { value: "brazil", label: "Brazil" },
    { value: "mexico", label: "Mexico" },
    { value: "south_korea", label: "South Korea" },
    { value: "switzerland", label: "Switzerland" },
    { value: "netherlands", label: "Netherlands" },
    { value: "belgium", label: "Belgium" },
    { value: "sweden", label: "Sweden" },
    { value: "norway", label: "Norway" },
    { value: "denmark", label: "Denmark" },
  ];

  const sponsorOptions: SearchableSelectOption[] = [
    { value: "Pfizer", label: "Pfizer" },
    { value: "Novartis", label: "Novartis" },
    { value: "AstraZeneca", label: "AstraZeneca" },
    { value: "Merck", label: "Merck" },
    { value: "Roche", label: "Roche" },
    { value: "Johnson & Johnson", label: "Johnson & Johnson" },
    { value: "Bristol Myers Squibb", label: "Bristol Myers Squibb" },
    { value: "Gilead", label: "Gilead" },
    { value: "AbbVie", label: "AbbVie" },
    { value: "Amgen", label: "Amgen" },
  ];

  const sponsorFieldOptions: SearchableSelectOption[] = [
    { value: "pharmaceutical_company", label: "Pharmaceutical Company" },
    { value: "university_academy", label: "University/Academy" },
    { value: "investigator", label: "Investigator" },
    { value: "cro", label: "CRO" },
    { value: "hospital", label: "Hospital" },
    { value: "biotechnology", label: "Biotechnology" },
    { value: "academic", label: "Academic" },
    { value: "government", label: "Government" },
    { value: "non_profit", label: "Non-profit" },
  ];

  const croOptions: SearchableSelectOption[] = [
    { value: "IQVIA", label: "IQVIA" },
    { value: "Syneos", label: "Syneos" },
    { value: "PPD", label: "PPD" },
    { value: "Parexel", label: "Parexel" },
    { value: "ICON", label: "ICON" },
    { value: "PRA Health Sciences", label: "PRA Health Sciences" },
    { value: "Covance", label: "Covance" },
    { value: "Medpace", label: "Medpace" },
    { value: "Pharm-Olam", label: "Pharm-Olam" },
    { value: "Worldwide Clinical Trials", label: "Worldwide Clinical Trials" },
  ];

  const regionOptions: SearchableSelectOption[] = [
    { value: "north_america", label: "North America" },
    { value: "europe", label: "Europe" },
    { value: "asia_pacific", label: "Asia Pacific" },
    { value: "latin_america", label: "Latin America" },
    { value: "africa", label: "Africa" },
    { value: "middle_east", label: "Middle East" },
  ];

  const trialRecordStatusOptions: SearchableSelectOption[] = [
    { value: "development_in_progress", label: "Development In Progress (DIP)" },
    { value: "in_production", label: "In Production (IP)" },
    { value: "update_in_progress", label: "Update In Progress (UIP)" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "terminated", label: "Terminated" },
    { value: "suspended", label: "Suspended" },
  ];

  const trialTagsOptions: SearchableSelectOption[] = [
    { value: "biomarker_efficacy", label: "Biomarker-Efficacy" },
    { value: "biomarker_toxicity", label: "Biomarker-Toxicity" },
    { value: "expanded_access", label: "Expanded Access" },
    { value: "expanded_indication", label: "Expanded Indication" },
    { value: "first_in_human", label: "First in Human" },
    { value: "investigator_initiated", label: "Investigator-Initiated" },
    { value: "io_cytotoxic_combination", label: "IO/Cytotoxic Combination" },
    { value: "io_hormonal_combination", label: "IO/Hormonal Combination" },
    { value: "io_io_combination", label: "IO/IO Combination" },
    { value: "io_other_combination", label: "IO/Other Combination" },
    { value: "io_radiotherapy_combination", label: "IO/Radiotherapy Combination" },
    { value: "io_targeted_combination", label: "IO/Targeted Combination" },
    { value: "microdosing", label: "Microdosing" },
    { value: "pgx_biomarker_identification", label: "PGX-Biomarker Identification/Evaluation" },
    { value: "pgx_pathogen", label: "PGX-Pathogen" },
    { value: "pgx_patient_preselection", label: "PGX-Patient Preselection/Stratification" },
    { value: "post_marketing_commitment", label: "Post-Marketing Commitment" },
    { value: "registration", label: "Registration" },
    { value: "randomized", label: "Randomized" },
    { value: "double_blind", label: "Double-blind" },
    { value: "placebo_controlled", label: "Placebo-controlled" },
    { value: "open_label", label: "Open-label" },
    { value: "multicenter", label: "Multicenter" },
  ];

  const genderOptions: SearchableSelectOption[] = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "both", label: "Both" },
    { value: "all", label: "All" },
  ];

  const healthyVolunteersOptions: SearchableSelectOption[] = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "no_information", label: "No Information" },
  ];

  const ageNumberOptions: SearchableSelectOption[] = Array.from({ length: 151 }, (_, i) => ({
    value: i.toString(),
    label: i.toString()
  }));

  const ageUnitOptions: SearchableSelectOption[] = [
    { value: "years", label: "Years" },
    { value: "months", label: "Months" },
    { value: "weeks", label: "Weeks" },
    { value: "days", label: "Days" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading trial backend data...</p>
        </div>
      </div>
    );
  }

  if (!trial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600">Failed to load trial data</p>
          <Button onClick={() => router.push("/admin/therapeutics")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trials
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isMaximized ? 'p-0' : 'p-4'}`}>
      {/* Header with window controls */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/therapeutics")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trials
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Backend View - Trial {trial.trial_id}
            </h1>
            <p className="text-sm text-gray-500">
              Complete trial data for {trial.overview.title || "Untitled Trial"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Backend Data
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRawData(!showRawData)}
            className="text-gray-600 hover:text-gray-900"
          >
            {showRawData ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showRawData ? "Hide Raw" : "Show Raw"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="text-gray-600 hover:text-gray-900"
          >
            Copy JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadJSON}
            className="text-gray-600 hover:text-gray-900"
          >
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMaximize}
            className="text-gray-600 hover:text-gray-900"
          >
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={closeWindow}
            className="text-red-600 hover:text-red-900"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={`${isMaximized ? 'h-screen' : 'h-[calc(100vh-120px)]'} overflow-auto`}>
        {showRawData ? (
          /* Raw JSON Data Display */
          <Card className="m-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Raw Trial Data (JSON)</span>
                <div className="text-sm text-gray-500">
                  Last Updated: {formatDate(trial.overview.updated_at)}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap">
                {JSON.stringify(trial, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ) : (
          /* Structured Data Display using Creation Phase UI Style */
          <div className="space-y-4">
            <FormProgress currentStep={currentStep} />

            {/* Step Navigation Buttons */}
            <div className="flex justify-between items-center px-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Step {currentStep} of 8
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.min(8, currentStep + 1))}
                disabled={currentStep === 8}
              >
                Next
                <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
              </Button>
            </div>

            {/* Step Content */}
            <div className="px-4">
              {currentStep === 1 && (
                /* Step 1: Trial Overview - Exact match to creation phase */
                <Card>
                  <CardContent className="space-y-6">
                    {/* Row 1: therapeutic area / trial identifier / phase */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Therapeutic Area</Label>
                        <ReadOnlySearchableSelect
                          value={trial.overview.therapeutic_area}
                          options={therapeuticAreaOptions}
                          placeholder="No therapeutic area selected"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Trial Identifier</Label>
                        <div className="space-y-2">
                          {trial.overview.trial_identifier.length > 0 ? (
                            trial.overview.trial_identifier.map((identifier, index) => (
                              <ReadOnlyInput key={index} value={identifier} />
                            ))
                          ) : (
                            <ReadOnlyInput value="" placeholder="No trial identifier" />
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Trial Phase</Label>
                        <ReadOnlySearchableSelect
                          value={trial.overview.trial_phase}
                          options={trialPhaseOptions}
                          placeholder="No trial phase selected"
                        />
                      </div>
                    </div>

                    {/* Row 2: status / primary drugs / other drugs */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <ReadOnlySearchableSelect
                          value={trial.overview.status}
                          options={statusOptions}
                          placeholder="No status selected"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Primary Drugs</Label>
                        <ReadOnlyInput value={trial.overview.primary_drugs} />
                      </div>
                      <div className="space-y-2">
                        <Label>Other Drugs</Label>
                        <ReadOnlyInput value={trial.overview.other_drugs} />
                      </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <ReadOnlyTextarea value={trial.overview.title} rows={3} />
                    </div>

                    {/* Row 3: disease type / patient segment / line of therapy */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Disease Type</Label>
                        <ReadOnlySearchableSelect
                          value={trial.overview.disease_type}
                          options={diseaseTypeOptions}
                          placeholder="No disease type selected"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Patient Segment</Label>
                        <ReadOnlySearchableSelect
                          value={trial.overview.patient_segment}
                          options={patientSegmentOptions}
                          placeholder="No patient segment selected"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Line Of Therapy</Label>
                        <ReadOnlySearchableSelect
                          value={trial.overview.line_of_therapy}
                          options={lineOfTherapyOptions}
                          placeholder="No line of therapy selected"
                        />
                      </div>
                    </div>

                    {/* Row 4: reference links / trial tags */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Reference Links</Label>
                        <div className="space-y-2">
                          {trial.overview.reference_links.length > 0 ? (
                            trial.overview.reference_links.map((link, index) => (
                              <ReadOnlyInput key={index} value={link} />
                            ))
                          ) : (
                            <ReadOnlyInput value="" placeholder="No reference links" />
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Trial Tags</Label>
                        <ReadOnlySearchableSelect
                          value={trial.overview.trial_tags}
                          options={trialTagsOptions}
                          placeholder="No trial tags selected"
                        />
                      </div>
                    </div>

                    {/* Row 5: sponsor fields */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Sponsor & Collaborators</Label>
                        <ReadOnlySearchableSelect
                          value={trial.overview.sponsor_collaborators}
                          options={sponsorOptions}
                          placeholder="No sponsor selected"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sponsor Field of Activity</Label>
                        <ReadOnlySearchableSelect
                          value={trial.overview.sponsor_field_activity}
                          options={sponsorFieldOptions}
                          placeholder="No sponsor field selected"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Associated CRO</Label>
                        <ReadOnlySearchableSelect
                          value={trial.overview.associated_cro}
                          options={croOptions}
                          placeholder="No CRO selected"
                        />
                      </div>
                    </div>

                    {/* Row 6: countries / region / record status */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Countries</Label>
                        <ReadOnlySearchableSelect
                          value={trial.overview.countries}
                          options={countriesOptions}
                          placeholder="No country selected"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Region</Label>
                        <ReadOnlySearchableSelect
                          value={trial.overview.region}
                          options={regionOptions}
                          placeholder="No region selected"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Trial Record Status</Label>
                        <ReadOnlySearchableSelect
                          value={trial.overview.trial_record_status}
                          options={trialRecordStatusOptions}
                          placeholder="No record status selected"
                        />
                      </div>
                    </div>

                    {/* Row 7: dates */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Created At</Label>
                        <ReadOnlyInput value={formatDate(trial.overview.created_at)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Updated At</Label>
                        <ReadOnlyInput value={formatDate(trial.overview.updated_at)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 2 && (
                /* Step 2: Outcome Measured - Exact match to creation phase layout */
                <Card>
                  <CardContent className="space-y-6">
                    {/* Purpose of Trial */}
                    <div className="space-y-2">
                      <Label>Purpose of Trial</Label>
                      <ReadOnlyTextarea value={trial.outcomes[0]?.purpose_of_trial || ""} rows={3} />
                    </div>

                    {/* Summary */}
                    <div className="space-y-2">
                      <Label>Summary</Label>
                      <ReadOnlyTextarea value={trial.outcomes[0]?.summary || ""} rows={4} />
                    </div>

                    {/* Primary Outcome Measures */}
                    <div className="space-y-2">
                      <Label>Primary Outcome Measures</Label>
                      <div className="space-y-2">
                        {trial.outcomes[0]?.primary_outcome_measure ? (
                          <div className="flex gap-2">
                            <ReadOnlyTextarea value={trial.outcomes[0]?.primary_outcome_measure || ""} rows={2} />
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <ReadOnlyTextarea value="" placeholder="No primary outcome measures" rows={2} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Other Outcome Measures */}
                    <div className="space-y-2">
                      <Label>Other Outcome Measures</Label>
                      <div className="space-y-2">
                        {trial.outcomes[0]?.other_outcome_measure ? (
                          <div className="flex gap-2">
                            <ReadOnlyTextarea value={trial.outcomes[0]?.other_outcome_measure || ""} rows={2} />
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <ReadOnlyTextarea value="" placeholder="No other outcome measures" rows={2} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Study Design Keywords and Study Design - Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Study Design Keywords</Label>
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 min-h-[40px] flex items-center">
                          {trial.outcomes[0]?.study_design_keywords || "No keywords selected"}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Study Design</Label>
                        <ReadOnlyTextarea value={trial.outcomes[0]?.study_design || ""} rows={8} />
                      </div>
                    </div>

                    {/* Treatment Regimen */}
                    <div className="space-y-2">
                      <Label>Treatment Regimen</Label>
                      <ReadOnlyTextarea value={trial.outcomes[0]?.treatment_regimen || ""} rows={3} />
                    </div>

                    {/* Number of Arms */}
                    <div className="space-y-2">
                      <Label>Number of Arms</Label>
                      <div className="w-32">
                        <ReadOnlyInput value={trial.outcomes[0]?.number_of_arms?.toString() || ""} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 3 && (
                /* Step 3: Participation Criteria - Exact match to creation phase layout */
                <Card>
                  <CardContent className="space-y-6">
                    {/* Top section: Inclusion & Exclusion */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Inclusion Criteria</Label>
                        <ReadOnlyTextarea value={trial.criteria[0]?.inclusion_criteria || ""} rows={5} />
                      </div>
                      <div className="space-y-2">
                        <Label>Exclusion Criteria</Label>
                        <ReadOnlyTextarea value={trial.criteria[0]?.exclusion_criteria || ""} rows={5} />
                      </div>
                    </div>

                    {/* Bottom section: Form fields */}

                    {/* Row 1: Age From + Subject Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Age From</Label>
                        <div className="flex gap-2">
                          <ReadOnlySearchableSelect
                            value={trial.criteria[0]?.age_from || ""}
                            options={ageNumberOptions}
                            placeholder="0"
                          />
                          <ReadOnlySearchableSelect
                            value="years"
                            options={ageUnitOptions}
                            placeholder="Years"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Subject Type</Label>
                        <ReadOnlyInput value={trial.criteria[0]?.subject_type || ""} />
                      </div>
                    </div>

                    {/* Row 2: Age To + Sex + Healthy Volunteers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Age To</Label>
                        <div className="flex gap-2">
                          <ReadOnlySearchableSelect
                            value={trial.criteria[0]?.age_to || ""}
                            options={ageNumberOptions}
                            placeholder="150"
                          />
                          <ReadOnlySearchableSelect
                            value="years"
                            options={ageUnitOptions}
                            placeholder="Years"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Sex</Label>
                          <ReadOnlySearchableSelect
                            value={trial.criteria[0]?.sex || ""}
                            options={genderOptions}
                            placeholder="No sex selected"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Healthy Volunteers</Label>
                          <ReadOnlySearchableSelect
                            value={trial.criteria[0]?.healthy_volunteers || ""}
                            options={healthyVolunteersOptions}
                            placeholder="No selection"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Target Volunteers + Actual Enrolled */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                      <div className="space-y-2">
                        <Label>Target No Of Volunteers</Label>
                        <ReadOnlyInput value={trial.criteria[0]?.target_no_volunteers?.toString() || ""} />
                      </div>
                      <div className="space-y-2">
                        <Label>Actual Enrolled Volunteers</Label>
                        <ReadOnlyInput value={trial.criteria[0]?.actual_enrolled_volunteers?.toString() || ""} />
                      </div>
                    </div>

                    {/* Row 4: ECOG Performance Status + Prior Treatments */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>ECOG Performance Status</Label>
                        <ReadOnlyInput value={trial.criteria[0]?.ecog_performance_status || ""} placeholder="No status selected" />
                      </div>
                      <div className="space-y-2">
                        <Label>Prior Treatments</Label>
                        <ReadOnlyTextarea value={trial.criteria[0]?.healthy_volunteers || ""} rows={3} placeholder="No treatments specified" />
                      </div>
                    </div>

                    {/* Row 5: Biomarker Requirements */}
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label>Biomarker Requirements</Label>
                        <ReadOnlyTextarea value={trial.criteria[0]?.biomarker_requirements || ""} rows={3} placeholder="No biomarker requirements specified" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 4 && (
                /* Step 4: Timing - Exact match to creation phase layout */
                <Card>
                  <CardContent className="space-y-8">
                    {/* Top Table */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Timing</h3>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className="text-left p-2"></th>
                              <th className="text-left p-2 text-sm font-medium">Start Date</th>
                              <th className="text-left p-2 text-sm font-medium">Inclusion Period</th>
                              <th className="text-left p-2 text-sm font-medium">Enrollment Closed Date</th>
                              <th className="text-left p-2 text-sm font-medium">Primary Outcome Duration</th>
                              <th className="text-left p-2 text-sm font-medium">Trial End Date</th>
                              <th className="text-left p-2 text-sm font-medium">Result Duration</th>
                              <th className="text-left p-2 text-sm font-medium">Result Published Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="p-2 font-medium">Actual</td>
                              <td className="p-2">
                                <ReadOnlyInput value={formatDate(trial.timing[0]?.start_date_actual)} />
                              </td>
                              <td className="p-2">
                                <ReadOnlyInput value={trial.timing[0]?.inclusion_period_actual || ""} placeholder="No data" />
                              </td>
                              <td className="p-2">
                                <ReadOnlyInput value={formatDate(trial.timing[0]?.enrollment_closed_actual)} placeholder="No data" />
                              </td>
                              <td className="p-2">
                                <ReadOnlyInput value={trial.timing[0]?.primary_outcome_duration_actual || ""} placeholder="No data" />
                              </td>
                              <td className="p-2">
                                <ReadOnlyInput value={formatDate(trial.timing[0]?.trial_end_date_actual)} />
                              </td>
                              <td className="p-2">
                                <ReadOnlyInput value={trial.timing[0]?.result_duration_actual || ""} placeholder="No data" />
                              </td>
                              <td className="p-2">
                                <ReadOnlyInput value={formatDate(trial.timing[0]?.result_published_date_actual)} placeholder="No data" />
                              </td>
                            </tr>
                            <tr>
                              <td className="p-2 font-medium">Benchmark</td>
                              <td className="p-2">
                                <ReadOnlyInput value={formatDate(trial.timing[0]?.start_date_benchmark)} placeholder="No data" />
                              </td>
                              <td className="p-2">
                                <ReadOnlyInput value={trial.timing[0]?.inclusion_period_benchmark || ""} placeholder="No data" />
                              </td>
                              <td className="p-2">
                                <ReadOnlyInput value={formatDate(trial.timing[0]?.enrollment_closed_benchmark)} placeholder="No data" />
                              </td>
                              <td className="p-2">
                                <ReadOnlyInput value={trial.timing[0]?.primary_outcome_duration_benchmark || ""} placeholder="No data" />
                              </td>
                              <td className="p-2">
                                <ReadOnlyInput value={formatDate(trial.timing[0]?.trial_end_date_benchmark)} placeholder="No data" />
                              </td>
                              <td className="p-2">
                                <ReadOnlyInput value={trial.timing[0]?.result_duration_benchmark || ""} placeholder="No data" />
                              </td>
                              <td className="p-2">
                                <ReadOnlyInput value={formatDate(trial.timing[0]?.result_published_date_benchmark)} placeholder="No data" />
                              </td>
                            </tr>
                            <tr>
                              <td className="p-2 font-medium">Estimated</td>
                              <td className="p-2">
                                <ReadOnlyInput value={formatDate(trial.timing[0]?.start_date_estimated)} placeholder="No data" />
                              </td>
                              <td className="p-2">
                                <ReadOnlyInput value={trial.timing[0]?.inclusion_period_estimated || ""} placeholder="No data" />
                              </td>
                              <td className="p-2">
                                <ReadOnlyInput value={formatDate(trial.timing[0]?.enrollment_closed_estimated)} placeholder="No data" />
                              </td>
                              <td className="p-2">
                                <ReadOnlyInput value={trial.timing[0]?.primary_outcome_duration_estimated || ""} placeholder="No data" />
                              </td>
                              <td className="p-2">
                                <ReadOnlyInput value={formatDate(trial.timing[0]?.trial_end_date_estimated)} placeholder="No data" />
                              </td>
                              <td className="p-2">
                                <ReadOnlyInput value={trial.timing[0]?.result_duration_estimated || ""} placeholder="No data" />
                              </td>
                              <td className="p-2">
                                <ReadOnlyInput value={formatDate(trial.timing[0]?.result_published_date_estimated)} placeholder="No data" />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Overall Duration Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="flex items-center gap-2">
                        <Label className="whitespace-nowrap">
                          Overall duration to Complete
                        </Label>
                        <div className="w-24">
                          <ReadOnlyInput value={trial.timing[0]?.overall_duration_complete || ""} placeholder="Months" />
                        </div>
                        <span className="text-sm text-gray-500">(months)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="whitespace-nowrap">
                          Overall duration to publish result
                        </Label>
                        <div className="w-24">
                          <ReadOnlyInput value={trial.timing[0]?.overall_duration_publish || ""} placeholder="Months" />
                        </div>
                        <span className="text-sm text-gray-500">(months)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 5 && (
                /* Step 5: Results - Exact match to creation phase layout */
                <Card>
                  <CardContent className="space-y-6">
                    {/* Toggles */}
                    <div className="flex flex-wrap items-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <Label>Results Available</Label>
                        <ReadOnlySwitch checked={trial.results[0]?.results_available === "Yes"} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label>Endpoints met</Label>
                        <ReadOnlySwitch checked={trial.results[0]?.endpoints_met === "Yes"} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label>Adverse Events Reported</Label>
                        <ReadOnlySwitch checked={trial.results[0]?.adverse_event_reported === "Yes"} />
                      </div>
                    </div>

                    {/* Trial Outcome + Reference */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Trial Outcome */}
                      <div className="space-y-2">
                        <Label>Trial Outcome</Label>
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 min-h-[40px] flex items-center">
                          {trial.results[0]?.trial_outcome || "No outcome selected"}
                        </div>
                      </div>

                      {/* Trial Outcome Reference */}
                      <div className="space-y-2 border rounded-md p-2">
                        <Label>Trial Outcome Reference</Label>
                        <ReadOnlyInput value={formatDate(trial.results[0]?.reference) || ""} placeholder="No date selected" />

                        {/* Trial Outcome Results Content */}
                        <div className="space-y-2">
                          <Label>Trial Outcome Results Content</Label>
                          <ReadOnlyTextarea value={trial.results[0]?.trial_outcome_content || ""} rows={3} placeholder="No data" />
                        </div>

                        <div className="flex gap-2 mt-2">
                          <div className="flex items-center gap-2 flex-1">
                            <Label className="whitespace-nowrap">Link</Label>
                            <ReadOnlyInput value={trial.results[0]?.trial_outcome_link || ""} placeholder="No data" />
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            <Label className="whitespace-nowrap">Attachments</Label>
                            <ReadOnlyInput value={trial.results[0]?.trial_outcome_attachment === "Yes" ? "Yes" : "No"} placeholder="No attachments" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Site Notes */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">Site Notes</h4>
                      </div>

                      <div className="space-y-4">
                        {trial.results[0]?.site_notes && trial.results[0].site_notes.length > 0 ? (
                          trial.results[0].site_notes.map((note: any, index: number) => (
                            <Card key={index} className="border border-gray-200 bg-white">
                              <CardContent className="p-6 space-y-4">
                                {/* Site Note Header */}
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-gray-900">Note #{index + 1}</h4>
                                </div>

                                {/* Site Note Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Date */}
                                  <div className="space-y-2">
                                    <Label>Date</Label>
                                    <ReadOnlyInput value={formatDate(note.date) || ""} placeholder="No date selected" />
                                  </div>

                                  {/* Note Type */}
                                  <div className="space-y-2">
                                    <Label>Result type</Label>
                                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 min-h-[40px] flex items-center">
                                      {note.type || "No type selected"}
                                    </div>
                                  </div>
                                </div>

                                {/* Content */}
                                <div className="space-y-2">
                                  <Label>Content</Label>
                                  <ReadOnlyTextarea value={note.content || ""} placeholder="No content" rows={3} />
                                </div>

                                {/* View Source */}
                                <div className="space-y-2">
                                  <Label>Source</Label>
                                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 min-h-[40px] flex items-center">
                                    {note.sourceLink || "No source selected"}
                                  </div>
                                </div>

                                {/* Attachments */}
                                <div className="space-y-2">
                                  <Label>Attachments</Label>
                                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 min-h-[40px] flex items-center">
                                    {note.attachments && note.attachments.length > 0 ? note.attachments.join(", ") : "No attachments"}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No site notes available
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Adverse Event */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Adverse Event Reported */}
                      <div className="space-y-2">
                        <Label>Adverse Event Reported</Label>
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 min-h-[40px] flex items-center">
                          {trial.results[0]?.adverse_event_reported || "No option selected"}
                        </div>
                      </div>

                      {/* Adverse Event Type */}
                      <div className="space-y-2">
                        <Label>Adverse Event Type</Label>
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 min-h-[40px] flex items-center">
                          {trial.results[0]?.adverse_event_type || "No type selected"}
                        </div>
                      </div>
                    </div>

                    {/* Treatment For Adverse Events */}
                    <div className="space-y-2">
                      <Label>Treatment For Adverse Events</Label>
                      <ReadOnlyTextarea value={trial.results[0]?.treatment_for_adverse_events || ""} rows={3} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 6 && (
                /* Step 6: Sites - Exact match to creation phase layout */
                <Card>
                  <CardContent className="space-y-6">
                    {/* Total No of Sites */}
                    <div className="space-y-2 mt-4">
                      <Label>Total No of Sites</Label>
                      <div className="w-32">
                        <ReadOnlyInput value={trial.sites[0]?.total?.toString() || ""} />
                      </div>
                    </div>

                    {/* Study Sites */}
                    <div className="space-y-2">
                      <Label>Study Sites</Label>
                      <div className="space-y-2">
                        {trial.sites[0]?.study_sites && trial.sites[0].study_sites.length > 0 ? (
                          trial.sites[0].study_sites.map((site: string, index: number) => (
                            <ReadOnlyInput key={index} value={site} />
                          ))
                        ) : (
                          <ReadOnlyInput value="" placeholder="No sites specified" />
                        )}
                      </div>
                    </div>

                    {/* Principal Investigators */}
                    <div className="space-y-2">
                      <Label>Principal Investigators</Label>
                      <div className="space-y-2">
                        {trial.sites[0]?.principal_investigators && trial.sites[0].principal_investigators.length > 0 ? (
                          trial.sites[0].principal_investigators.map((investigator: string, index: number) => (
                            <ReadOnlyInput key={index} value={investigator} />
                          ))
                        ) : (
                          <ReadOnlyInput value="" placeholder="No investigators specified" />
                        )}
                      </div>
                    </div>

                    {/* Site Status */}
                    <div className="space-y-2">
                      <Label>Site Status</Label>
                      <ReadOnlyInput value={trial.sites[0]?.site_status || ""} placeholder="No status specified" />
                    </div>

                    {/* Site Countries */}
                    <div className="space-y-2">
                      <Label>Site Countries</Label>
                      <div className="space-y-2">
                        {trial.sites[0]?.site_countries && trial.sites[0].site_countries.length > 0 ? (
                          trial.sites[0].site_countries.map((country: string, index: number) => (
                            <ReadOnlyInput key={index} value={country} />
                          ))
                        ) : (
                          <ReadOnlyInput value="" placeholder="No countries specified" />
                        )}
                      </div>
                    </div>

                    {/* Site Regions */}
                    <div className="space-y-2">
                      <Label>Site Regions</Label>
                      <div className="space-y-2">
                        {trial.sites[0]?.site_regions && trial.sites[0].site_regions.length > 0 ? (
                          trial.sites[0].site_regions.map((region: string, index: number) => (
                            <ReadOnlyInput key={index} value={region} />
                          ))
                        ) : (
                          <ReadOnlyInput value="" placeholder="No regions specified" />
                        )}
                      </div>
                    </div>

                    {/* Site Contact Info */}
                    <div className="space-y-2">
                      <Label>Site Contact Info</Label>
                      <div className="space-y-2">
                        {trial.sites[0]?.site_contact_info && trial.sites[0].site_contact_info.length > 0 ? (
                          trial.sites[0].site_contact_info.map((contact: string, index: number) => (
                            <ReadOnlyInput key={index} value={contact} />
                          ))
                        ) : (
                          <ReadOnlyInput value="" placeholder="No contact info specified" />
                        )}
                      </div>
                    </div>

                    {/* Simple Notes Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Notes</Label>
                      </div>

                      <div className="space-y-3">
                        {trial.sites[0]?.notes ? (
                          <div className="relative">
                            <ReadOnlyTextarea value={trial.sites[0]?.notes || ""} rows={3} />
                          </div>
                        ) : (
                          <div className="relative">
                            <ReadOnlyTextarea value="" placeholder="No notes available" rows={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 7 && (
                /* Step 7: Other Sources - Exact match to creation phase layout */
                <Card>
                  <CardContent className="space-y-6">
                    {/* Tab Navigation */}
                    <div className="flex gap-2 border-b pb-2">
                      <Button
                        type="button"
                        variant={activeOtherSourceTab === "pipeline_data" ? "default" : "outline"}
                        className={`text-sm px-4 py-2 ${activeOtherSourceTab === "pipeline_data"
                          ? "bg-[#204B73] text-white hover:bg-[#204B73]/90"
                          : "text-gray-600 hover:text-gray-800"
                          }`}
                        onClick={() => setActiveOtherSourceTab("pipeline_data")}
                      >
                        Pipeline Data
                      </Button>
                      <Button
                        type="button"
                        variant={activeOtherSourceTab === "press_releases" ? "default" : "outline"}
                        className={`text-sm px-4 py-2 ${activeOtherSourceTab === "press_releases"
                          ? "bg-[#204B73] text-white hover:bg-[#204B73]/90"
                          : "text-gray-600 hover:text-gray-800"
                          }`}
                        onClick={() => setActiveOtherSourceTab("press_releases")}
                      >
                        Press Release
                      </Button>
                      <Button
                        type="button"
                        variant={activeOtherSourceTab === "publications" ? "default" : "outline"}
                        className={`text-sm px-4 py-2 ${activeOtherSourceTab === "publications"
                          ? "bg-[#204B73] text-white hover:bg-[#204B73]/90"
                          : "text-gray-600 hover:text-gray-800"
                          }`}
                        onClick={() => setActiveOtherSourceTab("publications")}
                      >
                        Publication
                      </Button>
                      <Button
                        type="button"
                        variant={activeOtherSourceTab === "trial_registries" ? "default" : "outline"}
                        className={`text-sm px-4 py-2 ${activeOtherSourceTab === "trial_registries"
                          ? "bg-[#204B73] text-white hover:bg-[#204B73]/90"
                          : "text-gray-600 hover:text-gray-800"
                          }`}
                        onClick={() => setActiveOtherSourceTab("trial_registries")}
                      >
                        Trial Registry
                      </Button>
                      <Button
                        type="button"
                        variant={activeOtherSourceTab === "associated_studies" ? "default" : "outline"}
                        className={`text-sm px-4 py-2 ${activeOtherSourceTab === "associated_studies"
                          ? "bg-[#204B73] text-white hover:bg-[#204B73]/90"
                          : "text-gray-600 hover:text-gray-800"
                          }`}
                        onClick={() => setActiveOtherSourceTab("associated_studies")}
                      >
                        Associated Study
                      </Button>
                    </div>

                    {/* Active Tab Content */}
                    <div className="space-y-2">
                      <Label className="text-base font-medium">
                        {activeOtherSourceTab === "pipeline_data" && "Pipeline Data"}
                        {activeOtherSourceTab === "press_releases" && "Press Release"}
                        {activeOtherSourceTab === "publications" && "Publication"}
                        {activeOtherSourceTab === "trial_registries" && "Trial Registry"}
                        {activeOtherSourceTab === "associated_studies" && "Associated Study"}
                      </Label>

                      <div className="space-y-4">
                        {/* Pipeline Data */}
                        {activeOtherSourceTab === "pipeline_data" && (
                          <div className="space-y-2 p-4 border rounded-lg bg-white">
                            <div className="space-y-3">
                              <div className="w-full">
                                <Label className="text-sm">Pipeline Data</Label>
                                <ReadOnlyTextarea value={trial.other[0]?.data || ""} placeholder="No pipeline data available" rows={6} />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Press Releases */}
                        {activeOtherSourceTab === "press_releases" && (
                          <div className="space-y-2 p-4 border rounded-lg bg-white">
                            <div className="space-y-3">
                              <div className="w-full">
                                <Label className="text-sm">Press Release Data</Label>
                                <ReadOnlyTextarea value={trial.other[0]?.data || ""} placeholder="No press release data available" rows={6} />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Publications */}
                        {activeOtherSourceTab === "publications" && (
                          <div className="space-y-2 p-4 border rounded-lg bg-white">
                            <div className="space-y-3">
                              <div className="w-full">
                                <Label className="text-sm">Publication Data</Label>
                                <ReadOnlyTextarea value={trial.other[0]?.data || ""} placeholder="No publication data available" rows={6} />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Trial Registries */}
                        {activeOtherSourceTab === "trial_registries" && (
                          <div className="space-y-2 p-4 border rounded-lg bg-white">
                            <div className="space-y-3">
                              <div className="w-full">
                                <Label className="text-sm">Trial Registry Data</Label>
                                <ReadOnlyTextarea value={trial.other[0]?.data || ""} placeholder="No trial registry data available" rows={6} />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Associated Studies */}
                        {activeOtherSourceTab === "associated_studies" && (
                          <div className="space-y-2 p-4 border rounded-lg bg-white">
                            <div className="space-y-3">
                              <div className="w-full">
                                <Label className="text-sm">Associated Studies Data</Label>
                                <ReadOnlyTextarea value={trial.other[0]?.data || ""} placeholder="No associated studies data available" rows={6} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 8 && (
                /* Step 8: Logs - Exact match to creation phase layout */
                <Card>
                  <CardContent className="space-y-6">
                    {/* Trial Creation & Modification Info */}
                    <Card className="border rounded-xl shadow-sm">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Creation Information */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-green-700">Trial Creation</h3>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Created Date:</span>
                                <span className="text-gray-600">
                                  {formatDate(trial.logs[0]?.trial_added_date)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Created User:</span>
                                <span className="text-gray-600">admin</span>
                              </div>
                            </div>
                          </div>

                          {/* Modification Information */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-blue-700">Last Modification</h3>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Last Modified Date:</span>
                                <span className="text-gray-600">
                                  {formatDate(trial.logs[0]?.last_modified_date)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Last Modified User:</span>
                                <span className="text-gray-600">{trial.logs[0]?.last_modified_user || "admin"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Total Modifications:</span>
                                <span className="text-gray-600">1</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Trial Changes Log */}
                    <Card className="border rounded-xl shadow-sm">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Trial Changes Log</h3>
                        <div className="space-y-2">
                          <ReadOnlyTextarea value={trial.logs[0]?.trial_changes_log || ""} rows={4} />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Review and Notes Section */}
                    <Card className="border rounded-xl shadow-sm">
                      <CardContent className="p-6 space-y-6">
                        {/* Full Review Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border border-gray-300 rounded bg-gray-50"></div>
                            <Label>Full Review</Label>
                          </div>
                          <div className="space-y-2">
                            <Label>Full Review User</Label>
                            <ReadOnlyInput value={trial.logs[0]?.full_review_user || ""} />
                          </div>
                          <div className="space-y-2">
                            <Label>Next Review Date</Label>
                            <ReadOnlyInput value={formatDate(trial.logs[0]?.next_review_date)} />
                          </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Notes & Documentation</h3>
                          <div className="space-y-4">
                            {trial.notes.length > 0 ? (
                              trial.notes.map((note, index) => (
                                <Card key={note.id} className="border border-gray-200 bg-white">
                                  <CardContent className="p-6 space-y-4">
                                    {/* Note Header */}
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-medium text-gray-900">Note #{index + 1}</h4>
                                    </div>

                                    {/* Note Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Date */}
                                      <div className="space-y-2">
                                        <Label>Date</Label>
                                        <ReadOnlyInput value={formatDate(note.date_type)} />
                                      </div>

                                      {/* Note Type */}
                                      <div className="space-y-2">
                                        <Label>Note Type</Label>
                                        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 min-h-[40px] flex items-center">
                                          General
                                        </div>
                                      </div>
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-2">
                                      <Label>Content</Label>
                                      <ReadOnlyTextarea value={note.notes || ""} rows={3} />
                                    </div>

                                    {/* Link */}
                                    <div className="space-y-2">
                                      <Label>Source Link</Label>
                                      <ReadOnlyInput value={note.link || ""} />
                                    </div>

                                    {/* Attachments */}
                                    <div className="space-y-2">
                                      <Label>Attachments</Label>
                                      <div className="space-y-2">
                                        {note.attachments && note.attachments.length > 0 ? (
                                          note.attachments.map((attachment, attachIndex) => (
                                            <ReadOnlyInput key={attachIndex} value={attachment} />
                                          ))
                                        ) : (
                                          <ReadOnlyInput value="" placeholder="No attachments" />
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                No notes available
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}