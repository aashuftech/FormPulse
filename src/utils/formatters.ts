/**
 * Formats duration in seconds into MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Formats numeric metrics cleanly (e.g. 12450 -> 12.4k or 12,450)
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Formats date to concise athletic timestamp (e.g., "OCT 05, 2026")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date
    .toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
    .toUpperCase();
}

/**
 * Formats weight value with unit
 */
export function formatWeight(kg: number, system: 'metric' | 'imperial' = 'metric'): string {
  if (system === 'imperial') {
    const lbs = Math.round(kg * 2.20462);
    return `${lbs} LBS`;
  }
  return `${kg} KG`;
}
