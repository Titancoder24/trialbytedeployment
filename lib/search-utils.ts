import { TherapeuticTrial } from "@/app/admin/therapeutics/page";

/**
 * Extract unique values from trials data for dropdown options
 */
export const getUniqueFieldValues = (trials: TherapeuticTrial[], field: string): { value: string; label: string }[] => {
  const uniqueValues = new Set<string>();
  
  trials.forEach(trial => {
    let value = '';
    
    switch (field) {
      case 'trial_phase':
        value = trial.overview?.trial_phase || '';
        break;
      case 'status':
        value = trial.overview?.status || '';
        break;
      case 'therapeutic_area':
        value = trial.overview?.therapeutic_area || '';
        break;
      case 'disease_type':
        value = trial.overview?.disease_type || '';
        break;
      case 'patient_segment':
        value = trial.overview?.patient_segment || '';
        break;
      case 'line_of_therapy':
        value = trial.overview?.line_of_therapy || '';
        break;
      case 'trial_record_status':
        value = trial.overview?.trial_record_status || '';
        break;
      case 'sex':
        value = trial.criteria?.[0]?.sex || '';
        break;
      case 'healthy_volunteers':
        value = trial.criteria?.[0]?.healthy_volunteers || '';
        break;
      case 'trial_outcome':
        value = trial.results?.[0]?.trial_outcome || '';
        break;
      case 'adverse_event_reported':
        value = trial.results?.[0]?.adverse_event_reported || '';
        break;
      case 'sponsor_collaborators':
        value = trial.overview?.sponsor_collaborators || '';
        break;
      case 'associated_cro':
        value = trial.overview?.associated_cro || '';
        break;
      case 'countries':
        value = trial.overview?.countries || '';
        break;
      case 'region':
        value = trial.overview?.region || '';
        break;
      case 'primary_drugs':
        value = trial.overview?.primary_drugs || '';
        break;
      case 'other_drugs':
        value = trial.overview?.other_drugs || '';
        break;
      case 'sponsor_field_activity':
        value = trial.overview?.sponsor_field_activity || '';
        break;
      default:
        break;
    }
    
    if (value && value.trim() !== '') {
      uniqueValues.add(value.trim());
    }
  });
  
  // Convert to array and sort
  return Array.from(uniqueValues)
    .sort()
    .map(value => ({ value, label: value }));
};

/**
 * Normalize phase values for better matching
 */
export const normalizePhaseValue = (phase: string): string => {
  if (!phase) return '';
  
  const normalized = phase.toLowerCase().trim();
  
  // Handle common phase variations including underscore format
  const phaseMappings: Record<string, string> = {
    // Standard formats
    'phase i': 'Phase I',
    'phase 1': 'Phase I',
    'phase 1/2': 'Phase I/II',
    'phase ii': 'Phase II',
    'phase 2': 'Phase II',
    'phase 2/3': 'Phase II/III',
    'phase iii': 'Phase III',
    'phase 3': 'Phase III',
    'phase iv': 'Phase IV',
    'phase 4': 'Phase IV',
    'pre-clinical': 'Pre-clinical',
    'not applicable': 'Not Applicable',
    'n/a': 'Not Applicable',
    
    // Underscore formats (from database)
    'phase_i': 'Phase I',
    'phase_1': 'Phase I',
    'phase_i_ii': 'Phase I/II',
    'phase_1_2': 'Phase I/II',
    'phase_ii': 'Phase II',
    'phase_2': 'Phase II',
    'phase_ii_iii': 'Phase II/III',
    'phase_2_3': 'Phase II/III',
    'phase_iii': 'Phase III',
    'phase_3': 'Phase III',
    'phase_iii_iv': 'Phase III/IV',
    'phase_3_4': 'Phase III/IV',
    'phase_iv': 'Phase IV',
    'phase_4': 'Phase IV',
    
    // Already properly formatted
    'phase i': 'Phase I',
    'phase ii': 'Phase II',
    'phase iii': 'Phase III',
    'phase iv': 'Phase IV',
  };
  
  return phaseMappings[normalized] || phase;
};

/**
 * Check if two phase values are equivalent
 */
export const arePhasesEquivalent = (phase1: string, phase2: string): boolean => {
  if (!phase1 || !phase2) return false;
  
  const normalized1 = normalizePhaseValue(phase1).toLowerCase();
  const normalized2 = normalizePhaseValue(phase2).toLowerCase();
  
  return normalized1 === normalized2;
};
