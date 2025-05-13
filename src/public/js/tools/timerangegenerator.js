export class TimeRangeGenerator {
  /**
   * Generates time options from 00:00 to a maximum time with a specified interval
   * @param {string} startTime - Start time in format "hh:mm"
   * @param {string} endTime - End time in format "hh:mm"
   * @param {number} intervalMinutes - Interval in minutes (e.g., 15, 30, 60)
   * @returns {string[]} Array of time strings in format "hh:mm" representing durations
   */
  static generateTimeOptions(startTime, endTime, intervalMinutes = 15) {
    const timeOptions = [];

    // Parse start and end times
    const [startHour, startMinute] = startTime.split("h").map(Number);
    const [endHour, endMinute] = endTime.split("h").map(Number);

    // Calculate total minutes for start and end times
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    // Calculate maximum duration in minutes
    const maxDurationMinutes = endTotalMinutes - startTotalMinutes;

    // Generate time options from 00:00 to max duration at specified intervals
    for (let minutes = 0; minutes <= maxDurationMinutes; minutes += intervalMinutes) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;

      const hourStr = hour.toString().padStart(2, "0");
      const minuteStr = minute.toString().padStart(2, "0");

      timeOptions.push(`${hourStr}h${minuteStr}`);
    }

    return timeOptions;
  }

  /**
   * Generates time options from a minimum time to a maximum time with a specified interval
   * @param {string} minTime - Minimum time in format "hh:mm"
   * @param {string} maxTime - Maximum time in format "hh:mm"
   * @param {number} intervalMinutes - Interval in minutes (e.g., 15, 30, 60)
   * @returns {string[]} Array of time strings in format "hh:mm"
   */
  static generateTimeRangeOptions(minTime, maxTime, intervalMinutes = 15) {
    const timeOptions = [];

    // Parse min and max times
    const [minHour, minMinute] = minTime.split("h").map(Number);
    const [maxHour, maxMinute] = maxTime.split("h").map(Number);

    // Calculate total minutes
    const minTotalMinutes = minHour * 60 + minMinute;
    const maxTotalMinutes = maxHour * 60 + maxMinute;

    // Generate time options from min to max at specified intervals
    for (let minutes = minTotalMinutes; minutes <= maxTotalMinutes; minutes += intervalMinutes) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;

      const hourStr = hour.toString().padStart(2, "0");
      const minuteStr = minute.toString().padStart(2, "0");

      timeOptions.push(`${hourStr}h${minuteStr}`);
    }

    return timeOptions;
  }
}
