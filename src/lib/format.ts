export function minsToHm(totalMins?: number) {
  if (!totalMins || totalMins <= 0) return '—';
  const h = Math.floor(totalMins / 60);
  const m = Math.round(totalMins % 60);
  return `${h}h ${m}m`;
}

export function fmt1(n?: number) {
  if (n === undefined || n === null || Number.isNaN(n)) return '—';
  return n.toFixed(1);
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function scoreColor(score?: number) {
  if (!score || score <= 0) return '#1e293b';
  if (score >= 90) return '#22c55e';
  if (score >= 75) return '#60a5fa';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

export function scoreTextClass(score?: number) {
  if (!score || score <= 0) return 'text-slate-500';
  if (score >= 90) return 'text-green-500';
  if (score >= 75) return 'text-blue-400';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}
