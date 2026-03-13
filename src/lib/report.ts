import { addDays, format, startOfDay, subDays } from 'date-fns';
import type { SleepApiItem, SleepDay } from './sensorbio';

export function lastNDates(n: number, endDate = new Date()) {
  const end = startOfDay(endDate);
  const start = subDays(end, n - 1);
  const dates: string[] = [];
  for (let i = 0; i < n; i++) {
    dates.push(format(addDays(start, i), 'yyyy-MM-dd'));
  }
  return { start, end, dates };
}

export function normalizeSleepDay(date: string, items: SleepApiItem[]): SleepDay {
  if (!items || items.length === 0) return { date, hasData: false };

  // If multiple items exist for a day, take the one with the longest duration.
  const best = [...items].sort((a, b) => {
    const da = durationMins(a);
    const db = durationMins(b);
    return db - da;
  })[0];

  const light = num(best.light_sleep_mins);
  const deep = num(best.deep_sleep_mins);
  const rem = num(best.rem_sleep_mins);
  const awake = num(best.awake_time_mins);
  const total = [light ?? 0, deep ?? 0, rem ?? 0, awake ?? 0].reduce((acc, v) => acc + v, 0);

  const score = num(best.score?.value);
  const restingHr = num(best.biometrics?.resting_bpm ?? best.biometrics?.bpm);
  const hrv = num(best.biometrics?.resting_hrv ?? best.biometrics?.hrv);
  const latency = num(best.fall_asleep_mins);

  // if score missing but we have sleep, mark hasData true
  return {
    date,
    hasData: true,
    score: score ?? undefined,
    totalMins: total > 0 ? total : undefined,
    lightMins: light ?? undefined,
    deepMins: deep ?? undefined,
    remMins: rem ?? undefined,
    awakeMins: awake ?? undefined,
    latencyMins: latency ?? undefined,
    restingHr: restingHr ?? undefined,
    hrv: hrv ?? undefined,
  };
}

function durationMins(item: SleepApiItem) {
  const light = num(item.light_sleep_mins) ?? 0;
  const deep = num(item.deep_sleep_mins) ?? 0;
  const rem = num(item.rem_sleep_mins) ?? 0;
  const awake = num(item.awake_time_mins) ?? 0;
  return light + deep + rem + awake;
}

function num(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  if (Number.isFinite(n)) return n;
  return null;
}

export function computeSummary(days: SleepDay[]) {
  const recorded = days.filter((d) => d.hasData && (d.totalMins ?? 0) > 10);
  const scores = recorded.map((d) => d.score).filter((v): v is number => typeof v === 'number' && v > 0);

  const avgScore = avg(scores);
  const avgTotal = avg(recorded.map((d) => d.totalMins).filter(isNum));
  const avgDeep = avg(recorded.map((d) => d.deepMins).filter(isNum));
  const avgRem = avg(recorded.map((d) => d.remMins).filter(isNum));
  const avgDeepRem = (avgDeep ?? 0) + (avgRem ?? 0);

  const avgRestingHr = avg(recorded.map((d) => d.restingHr).filter(isNum));
  const avgHrv = avg(recorded.map((d) => d.hrv).filter(isNum));

  const best = recorded
    .filter((d) => typeof d.score === 'number')
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  const worst = recorded
    .filter((d) => typeof d.score === 'number')
    .sort((a, b) => (a.score ?? 999) - (b.score ?? 999))[0];

  const missingDates = days.filter((d) => !d.hasData).map((d) => d.date);

  return {
    recordedCount: recorded.length,
    totalDays: days.length,
    avgScore,
    avgTotal,
    avgDeep,
    avgRem,
    avgDeepRem,
    avgRestingHr,
    avgHrv,
    best,
    worst,
    missingDates,
  };
}

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function avg(vals: number[]): number | null {
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function generateInsights(days: SleepDay[]) {
  const s = computeSummary(days);
  const insights: string[] = [];

  const avgScore = s.avgScore ? Math.round(s.avgScore) : null;
  const avgTotal = s.avgTotal ? Math.round(s.avgTotal) : null;
  const avgDeepRem = s.avgDeepRem ? Math.round(s.avgDeepRem) : null;

  insights.push(
    `Overall: ${avgScore ?? '—'}/100 avg score across ${s.recordedCount} recorded nights. Deep + REM averaging ${avgDeepRem ?? '—'} min combined. Avg total sleep ${avgTotal ? minsToSentence(avgTotal) : '—'}.`
  );

  if (s.best?.date && typeof s.best.score === 'number') {
    insights.push(
      `${s.best.date} best night (score ${Math.round(s.best.score)}). ${minsToSentence(s.best.totalMins)} total, ${s.best.deepMins ?? 0}m deep, ${s.best.remMins ?? 0}m REM, resting HR ${fmtMaybe(s.best.restingHr, 'bpm')}, HRV ${fmtMaybe(s.best.hrv, 'ms')}.`
    );
  }

  if (s.worst?.date && typeof s.worst.score === 'number') {
    insights.push(
      `${s.worst.date} worst night (score ${Math.round(s.worst.score)}). ${minsToSentence(s.worst.totalMins)} total. Resting HR ${fmtMaybe(s.worst.restingHr, 'bpm')}. Potential disruption or very late night.`
    );
  }

  if (s.recordedCount >= 8 && s.avgScore) {
    const scores = days.filter((d) => d.hasData && typeof d.score === 'number').map((d) => d.score as number);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const spread = max - min;
    if (spread >= 35) {
      insights.push(`High variability: score range ${min} to ${max} (${spread} point spread). Suggests inconsistent sleep schedule or varying conditions night to night.`);
    }
  }

  if (s.missingDates.length) {
    const short = s.missingDates.map((d) => d.slice(5)).join(', ');
    insights.push(`${s.missingDates.length} missing days: ${short}`);
  }

  return insights;
}

function minsToSentence(mins?: number) {
  if (!mins || mins <= 0) return '—';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m}m`;
}

function fmtMaybe(v?: number, unit?: string) {
  if (v === undefined || v === null || Number.isNaN(v)) return '—';
  return `${v.toFixed(1)}${unit ? ` ${unit}` : ''}`;
}
