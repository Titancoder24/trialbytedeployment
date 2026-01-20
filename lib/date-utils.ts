import { format } from "date-fns";

/**
 * Format a date string to MM-dd-yyyy format
 * @param dateString - ISO date string or date string
 * @returns Formatted date string in MM-dd-yyyy format or "N/A" if invalid
 */
export const formatDateToMMDDYYYY = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return format(date, "MM-dd-yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
};

/**
 * Format a date string to MM-dd-yyyy HH:mm format (with time)
 * @param dateString - ISO date string or date string
 * @returns Formatted date string in MM-dd-yyyy HH:mm format or "N/A" if invalid
 */
export const formatDateTimeToMMDDYYYY = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return format(date, "MM-dd-yyyy HH:mm");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
};

/**
 * Format a date string to MM-dd-yyyy HH:mm:ss format (with seconds)
 * @param dateString - ISO date string or date string
 * @returns Formatted date string in MM-dd-yyyy HH:mm:ss format or "N/A" if invalid
 */
export const formatDateTimeWithSecondsToMMDDYYYY = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return format(date, "MM-dd-yyyy HH:mm:ss");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
};
