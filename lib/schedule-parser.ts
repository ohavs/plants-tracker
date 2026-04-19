// lib/schedule-parser.ts
// Utility to parse natural language (Hebrew) time frequencies into actionable notification delays

export interface ParsedSchedule {
  frequencyDays: number | null;
  isValid: boolean;
  nextDate: Date | null;
}

/**
 * Parses Hebrew text like "פעם בשבוע", "כל 3 ימים", "פעמיים בחודש" 
 * and returns the interval in days.
 */
export function parseHebrewFrequency(text: string): ParsedSchedule {
  const normalizedText = text.trim().toLowerCase();
  let frequencyDays: number | null = null;

  // Direct matches
  if (normalizedText.includes('כל יום') || normalizedText === 'יומי') {
    frequencyDays = 1;
  } else if (normalizedText.includes('פעם ביומיים') || normalizedText.includes('כל יומיים')) {
    frequencyDays = 2;
  } else if (normalizedText.includes('פעמיים בשבוע')) {
    frequencyDays = 3.5;
  } else if (normalizedText.includes('פעם בשבוע') || normalizedText.includes('שבועי')) {
    frequencyDays = 7;
  } else if (normalizedText.includes('פעם בשבועיים') || normalizedText.includes('כל שבועיים')) {
    frequencyDays = 14;
  } else if (normalizedText.includes('פעם בחודש') || normalizedText.includes('חודשי')) {
    frequencyDays = 30;
  } else if (normalizedText.includes('פעמיים בחודש')) {
    frequencyDays = 15;
  } else {
    // Regex parsing for "כל X ימים" or "כל X שבועות"
    const daysMatch = normalizedText.match(/כל\s+(\d+)\s+ימים/);
    if (daysMatch && daysMatch[1]) {
      frequencyDays = parseInt(daysMatch[1], 10);
    } else {
      const weeksMatch = normalizedText.match(/כל\s+(\d+)\s+שבועות/);
      if (weeksMatch && weeksMatch[1]) {
        frequencyDays = parseInt(weeksMatch[1], 10) * 7;
      }
    }
  }

  // Calculate the next Date if a valid frequency was found
  let nextDate = null;
  if (frequencyDays !== null && frequencyDays > 0) {
    const now = new Date();
    // Default to notifying at 9:00 AM on the calculated day
    now.setDate(now.getDate() + frequencyDays);
    now.setHours(9, 0, 0, 0);
    nextDate = now;
  }

  return {
    frequencyDays,
    isValid: frequencyDays !== null,
    nextDate
  };
}

/**
 * A future utility to integrate with Service Worker Push Manager.
 * For now, this is the infrastructure placeholder that gets called when 
 * parameters are updated or the user taps "השקתי".
 */
export async function schedulePlantNotification(plantId: string, plantName: string, frequencyText: string) {
  const schedule = parseHebrewFrequency(frequencyText);
  if (!schedule.isValid || !schedule.nextDate) {
    console.warn(`Could not parse notification schedule for ${plantName} from text: "${frequencyText}"`);
    return false;
  }

  console.log(`[PWA Notification System] Scheduled watering for ${plantName} in ${schedule.frequencyDays} days. (Target: ${schedule.nextDate.toLocaleString()})`);
  
  // Future implementation:
  // 1. Save target date to IndexedDB or localStorage
  // 2. Request Notification.requestPermission()
  // 3. Register a delayed event either via service worker 'sync' 
  //    or backend push infrastructure (Firebase Cloud Messaging).
  
  return true;
}
