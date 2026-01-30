/**
 * Formatting utilities for display values
 * Converts snake_case, underscore-separated, and lowercase values to proper Title Case
 */

/**
 * Converts snake_case or underscore-separated strings to Title Case with spaces
 * 
 * @example
 * formatDisplayValue("breast_cancer") // "Breast Cancer"
 * formatDisplayValue("cns_neurology") // "Cns Neurology"
 * formatDisplayValue("phase_1_2") // "Phase 1 2"
 * formatDisplayValue(null) // "N/A"
 * 
 * @param value - The string value to format
 * @returns Formatted string with Title Case and spaces
 */
export function formatDisplayValue(value: string | null | undefined): string {
    if (!value || value.trim() === "" || value === "N/A") {
        return "N/A";
    }

    // Known medical/cancer acronyms that should stay uppercase
    const knownAcronyms = [
        'HER2', 'HER2+', 'HER2-', 'HER2−',
        'HR', 'HR+', 'HR-',
        'ER', 'ER+', 'ER-',
        'PR', 'PR+', 'PR-',
        'TNBC', 'NOS', 'CNS', 'CRO', 'IO', 'PGX'
    ];

    // Replace underscores with spaces, then capitalize each word
    return value
        .replace(/_/g, " ")
        .split(/\s+/)
        .map(word => {
            if (!word) return "";

            // Check if this word matches a known acronym (case-insensitive)
            const upperWord = word.toUpperCase();
            const matchedAcronym = knownAcronyms.find(acr => acr.toUpperCase() === upperWord);
            if (matchedAcronym) {
                return matchedAcronym;
            }

            // Keep acronyms/abbreviations that are all uppercase (2+ chars)
            if (word.length >= 2 && word === word.toUpperCase() && !/\d/.test(word)) {
                return word;
            }
            // Capitalize first letter, lowercase rest
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ")
        .trim();
}

/**
 * Formats a value for display, with a custom fallback
 * 
 * @param value - The value to format
 * @param fallback - Custom fallback string (default: "N/A")
 * @returns Formatted string
 */
export function formatDisplayValueWithFallback(
    value: string | null | undefined,
    fallback: string = "N/A"
): string {
    if (!value || value.trim() === "") {
        return fallback;
    }
    return formatDisplayValue(value);
}
