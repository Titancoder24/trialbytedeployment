export interface TherapeuticTrialOverview {
  id: string;
  therapeutic_area: string | null;
  trial_identifier: string[] | null;
  trial_phase: string | null;
  status: string | null;
  primary_drugs: string | null;
  other_drugs: string | null;
  title: string | null;
  disease_type: string | null;
  patient_segment: string | null;
  line_of_therapy: string | null;
  reference_links: string[] | null;
  trial_tags: string | null;
  sponsor_collaborators: string | null;
  sponsor_field_activity: string | null;
  associated_cro: string | null;
  countries: string | null;
  region: string | null;
  trial_record_status: string | null;
}

export type CreateTherapeuticTrialOverviewDto = Omit<TherapeuticTrialOverview, "id">;
export type UpdateTherapeuticTrialOverviewDto = Partial<CreateTherapeuticTrialOverviewDto>;

export interface TherapeuticOutcomeMeasured {
  id: string;
  trial_id: string;
  purpose_of_trial: string | null;
  summary: string | null;
  primary_outcome_measure: string | null;
  other_outcome_measure: string | null;
  study_design_keywords: string | null;
  study_design: string | null;
  treatment_regimen: string | null;
  number_of_arms: number | null;
}

export type CreateTherapeuticOutcomeMeasuredDto = Omit<TherapeuticOutcomeMeasured, "id">;
export type UpdateTherapeuticOutcomeMeasuredDto = Partial<CreateTherapeuticOutcomeMeasuredDto>;

export interface TherapeuticParticipationCriteria {
  id: string;
  trial_id: string;
  inclusion_criteria: string | null;
  exclusion_criteria: string | null;
  age_from: string | null;
  subject_type: string | null;
  age_to: string | null;
  sex: string | null;
  healthy_volunteers: string | null;
  target_no_volunteers: string | null;
  actual_enrolled_volunteers: string | null;
}

export type CreateTherapeuticParticipationCriteriaDto = Omit<TherapeuticParticipationCriteria, "id">;
export type UpdateTherapeuticParticipationCriteriaDto = Partial<CreateTherapeuticParticipationCriteriaDto>;

export interface TherapeuticTiming {
  id: string;
  trial_id: string;
  start_date_actual: string | null; // ISO date
  start_date_benchmark: string | null;
  start_date_estimated: string | null;
  inclusion_period_actual: string | null; // using text for periods when needed
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
}

export type CreateTherapeuticTimingDto = Omit<TherapeuticTiming, "id">;
export type UpdateTherapeuticTimingDto = Partial<CreateTherapeuticTimingDto>;

export interface TherapeuticResults {
  id: string;
  trial_id: string;
  trial_outcome: string | null;
  reference: string | null;
  trial_results: string[] | null;
  adverse_event_reported: string | null;
  adverse_event_type: string | null;
  treatment_for_adverse_events: string | null;
  trial_outcome_reference_date: string | null;
  trial_outcome_content: string | null;
  trial_outcome_link: string | null;
  trial_outcome_attachment: string | null;
}

export type CreateTherapeuticResultsDto = Omit<TherapeuticResults, "id">;
export type UpdateTherapeuticResultsDto = Partial<CreateTherapeuticResultsDto>;

export interface TherapeuticSites {
  id: string;
  trial_id: string;
  total: number | null;
  notes: string | null;
}

export type CreateTherapeuticSitesDto = Omit<TherapeuticSites, "id">;
export type UpdateTherapeuticSitesDto = Partial<CreateTherapeuticSitesDto>;

export interface TherapeuticOtherSources {
  id: string;
  trial_id: string;
  data: string | null;
}

export type CreateTherapeuticOtherSourcesDto = Omit<TherapeuticOtherSources, "id">;
export type UpdateTherapeuticOtherSourcesDto = Partial<CreateTherapeuticOtherSourcesDto>;

export interface TherapeuticLogs {
  id: string;
  trial_id: string;
  trial_changes_log: string | null;
  trial_added_date: string | null;
  last_modified_date: string | null;
  last_modified_user: string | null;
  full_review_user: string | null;
  next_review_date: string | null;
  internal_note: string | null;
  attachment: string | null;
}

export type CreateTherapeuticLogsDto = Omit<TherapeuticLogs, "id">;
export type UpdateTherapeuticLogsDto = Partial<CreateTherapeuticLogsDto>;

export interface TherapeuticNotes {
  id: string;
  trial_id: string;
  notes: any; // JSONB field - can be array or object containing note data
}

export type CreateTherapeuticNotesDto = Omit<TherapeuticNotes, "id">;
export type UpdateTherapeuticNotesDto = Partial<CreateTherapeuticNotesDto>;


