import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a string to proper Title Case
 * Handles snake_case, spaces, and mixed case strings
 *
 * @example
 * toProperCase("breast_cancer") // "Breast Cancer"
 * toProperCase("HER2+ BREAST CANCER") // "Her2+ Breast Cancer"
 * toProperCase("TNBC") // "Tnbc"
 *
 * @param str - The string to convert
 * @returns String in Title Case format
 */
export function toProperCase(str: string | null | undefined): string {
  if (!str || str.trim() === "") {
    return "";
  }

  return str
    .replace(/_/g, " ") // Replace underscores with spaces
    .split(/\s+/)
    .map(word => {
      if (!word) return "";
      // Capitalize first letter, lowercase rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ")
    .trim();
}

/**
 * Converts a string to proper Title Case with N/A fallback
 *
 * @param str - The string to convert
 * @param fallback - Fallback value if string is empty (default: "N/A")
 * @returns String in Title Case format or fallback
 */
export function toProperCaseWithFallback(str: string | null | undefined, fallback: string = "N/A"): string {
  if (!str || str.trim() === "") {
    return fallback;
  }
  return toProperCase(str);
}
