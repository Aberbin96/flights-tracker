/**
 * Formats a date string into a 24-hour time string in the America/Caracas timezone.
 * @param dateStr ISO date string
 * @returns Formatted time string (HH:mm)
 */
export const formatCaracasTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "--:--";
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Caracas",
    });
  } catch (error) {
    console.warn("[formatCaracasTime] Failed to format date:", dateStr, error);
    return "--:--";
  }
};

/**
 * Calculates actual time based on scheduled time and delay, in America/Caracas timezone.
 * @param scheduled ISO date string
 * @param delayMinutes delay in minutes
 * @returns Formatted time string (HH:mm)
 */
export const calculateActualCaracasTime = (
  scheduled: string | null | undefined,
  delayMinutes: number = 0
): string => {
  if (!scheduled) return "--:--";
  try {
    const date = new Date(scheduled);
    if (delayMinutes > 0) {
      date.setMinutes(date.getMinutes() + delayMinutes);
    }
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Caracas",
    });
  } catch (error) {
    console.warn("[calculateActualCaracasTime] Failed to calculate time:", scheduled, delayMinutes, error);
    return "--:--";
  }
};
