import { scoreTextClass } from '@/lib/format';
import type { SleepDay } from '@/lib/sensorbio';

function bg(score?: number, hasData?: boolean) {
  if (!hasData) return '#1e293b';
  if (!score || score <= 0) return '#1e293b';
  if (score >= 90) return '#14532d';
  if (score >= 75) return '#1e3a8a';
  if (score >= 50) return '#78350f';
  return '#7f1d1d';
}

function fg(score?: number) {
  if (!score || score <= 0) return '#475569';
  if (score >= 90) return '#86efac';
  if (score >= 75) return '#93c5fd';
  if (score >= 50) return '#fbbf24';
  return '#fca5a5';
}

export function HeatmapCalendar({ days }: { days: SleepDay[] }) {
  const startDayIndex = new Date(days[0]?.date ?? Date.now()).getDay(); // 0 Sun
  const blanks = Array.from({ length: startDayIndex }, (_, i) => i);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-[9px] text-slate-600 font-semibold">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {blanks.map((i) => (
          <div key={`b-${i}`} className="min-h-[54px] rounded-md" />
        ))}

        {days.map((d) => (
          <div
            key={d.date}
            className="rounded-md min-h-[54px] flex flex-col items-center justify-center gap-1"
            style={{ background: bg(d.score, d.hasData) }}
            title={d.hasData ? `${d.date}: ${d.score ?? '—'}` : `${d.date}: No data`}
          >
            {d.hasData && typeof d.score === 'number' && d.score > 0 ? (
              <>
                <div className="text-[18px] leading-none font-extrabold" style={{ color: fg(d.score) }}>
                  {Math.round(d.score)}
                </div>
                <div
                  className="text-[9px] leading-none font-semibold"
                  style={{
                    color:
                      d.score >= 90
                        ? '#4ade80'
                        : d.score >= 75
                          ? '#60a5fa'
                          : d.score >= 50
                            ? '#f59e0b'
                            : '#ef4444',
                  }}
                >
                  {d.date.slice(8)}
                </div>
              </>
            ) : (
              <div className="text-[9px] text-slate-600">{d.date.slice(8)}</div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-3 items-center flex-wrap">
        <span className="text-[11px] text-slate-500">Score:</span>
        <LegendItem color="#14532d" label="90–100" />
        <LegendItem color="#1e3a8a" label="75–89" />
        <LegendItem color="#78350f" label="50–74" />
        <LegendItem color="#7f1d1d" label="<50" />
        <LegendItem color="#1e293b" label="No data" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-slate-400">
      <span className="inline-block w-3 h-3 rounded-[3px]" style={{ background: color }} />
      {label}
    </span>
  );
}
