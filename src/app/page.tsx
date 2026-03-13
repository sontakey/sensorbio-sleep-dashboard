'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardBody, Button, Input, Label, SectionTitle, Select, Spinner } from '@/components/ui';
import { fetchOrgUsers, fetchSleepForDate, type OrgUser, type SleepDay } from '@/lib/sensorbio';
import { lastNDates, normalizeSleepDay, computeSummary, generateInsights } from '@/lib/report';
import { fmt1, minsToHm, scoreTextClass } from '@/lib/format';
import { HeatmapCalendar } from '@/components/heatmap';
import { TrendChart, StagesChart, BiometricsChart } from '@/components/charts';
import { downloadDashboardPdf } from '@/lib/pdf';

const KEY_STORAGE = 'sensorbio_org_api_key';

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [connectedKey, setConnectedKey] = useState<string | null>(null);

  const [users, setUsers] = useState<OrgUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const [days, setDays] = useState<SleepDay[] | null>(null);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const reportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(KEY_STORAGE);
    if (stored) {
      setConnectedKey(stored);
    }
  }, []);

  const summary = useMemo(() => (days ? computeSummary(days) : null), [days]);
  const insights = useMemo(() => (days ? generateInsights(days) : []), [days]);

  async function connect() {
    setError('');
    setStatus('');

    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError('Please paste your Org API key.');
      return;
    }

    setLoadingUsers(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      setStatus('Connecting...');
      const list = await fetchOrgUsers(trimmed, abortRef.current.signal);
      if (!list.length) throw new Error('No users returned for this organization.');

      sessionStorage.setItem(KEY_STORAGE, trimmed);
      setConnectedKey(trimmed);
      setUsers(list);
      setSelectedUserId(list[0]?.id ?? '');
      setStatus('');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to connect.');
      setStatus('');
    } finally {
      setLoadingUsers(false);
    }
  }

  function disconnect() {
    abortRef.current?.abort();
    sessionStorage.removeItem(KEY_STORAGE);
    setApiKey('');
    setConnectedKey(null);
    setUsers([]);
    setSelectedUserId('');
    setDays(null);
    setError('');
    setStatus('');
  }

  async function loadUsersFromStoredKey(key: string) {
    setLoadingUsers(true);
    setError('');
    setStatus('');
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      setStatus('Loading users...');
      const list = await fetchOrgUsers(key, abortRef.current.signal);
      if (!list.length) throw new Error('No users returned for this organization.');
      setUsers(list);
      setSelectedUserId((prev) => prev || list[0]?.id || '');
      setStatus('');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load users.');
      setStatus('');
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (connectedKey && users.length === 0) {
      void loadUsersFromStoredKey(connectedKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedKey]);

  async function generateReport() {
    if (!connectedKey) return;
    if (!selectedUserId) {
      setError('Please pick a user.');
      return;
    }

    setLoadingReport(true);
    setError('');
    setDays(null);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const { dates } = lastNDates(30);
      setStatus(`Fetching day 1 of 30...`);

      const out: SleepDay[] = [];
      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        setStatus(`Fetching day ${i + 1} of 30...`);
        const items = await fetchSleepForDate(connectedKey, selectedUserId, date, abortRef.current.signal);
        out.push(normalizeSleepDay(date, items));
      }

      setDays(out);
      setStatus(`Done. ${formatRange(out[0]?.date, out[out.length - 1]?.date)}.`);
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      setError(e?.message ?? 'Failed to generate report.');
      setStatus('');
    } finally {
      setLoadingReport(false);
    }
  }

  async function handleDownloadPdf() {
    if (!days) return;
    if (!reportRef.current) return;

    setDownloadingPdf(true);
    setError('');

    try {
      // Let the UI settle (fonts, charts) before snapshot
      await new Promise((r) => setTimeout(r, 150));
      await downloadDashboardPdf({
        element: reportRef.current,
        userLabel: selectedUser?.name || selectedUser?.email || selectedUserId,
      });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to generate PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  }

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <main className="min-h-screen px-4 py-6 md:py-10">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[22px] font-extrabold text-white leading-tight">Sensor Bio 30-Day Sleep Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Generate a premium 30-day sleep report for any user in your org.</p>
          </div>
          {connectedKey ? (
            <Button variant="danger" onClick={disconnect}>
              Disconnect
            </Button>
          ) : null}
        </header>

        {!connectedKey ? (
          <Card className="max-w-xl">
            <CardBody>
              <SectionTitle>Connect</SectionTitle>
              <div className="space-y-2">
                <Label>Org API Key (stored in sessionStorage only)</Label>
                <Input
                  placeholder="Paste API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  type="password"
                  autoComplete="off"
                />
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Button onClick={connect} disabled={loadingUsers}>
                  {loadingUsers ? 'Connecting…' : 'Connect'}
                </Button>
                {loadingUsers ? <Spinner label="Validating key" /> : null}
              </div>

              {error ? <div className="mt-4 text-sm text-red-300">{error}</div> : null}
              {status ? <div className="mt-2 text-sm text-slate-400">{status}</div> : null}

              <div className="mt-6 text-xs text-slate-500">
                Tip: your API key never leaves your browser. Requests go directly to <span className="text-slate-300">api.getsensr.io</span>.
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardBody>
                <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
                  <div className="flex-1">
                    <SectionTitle>User</SectionTitle>
                    {loadingUsers ? (
                      <Spinner label="Loading users" />
                    ) : (
                      <div className="space-y-2">
                        <Label>Select a user</Label>
                        <Select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {(u.name || u.email || u.id).toString()}
                              {u.email && u.name ? ` (${u.email})` : ''}
                            </option>
                          ))}
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button onClick={generateReport} disabled={loadingReport || loadingUsers}>
                      {loadingReport ? 'Generating…' : 'Generate 30-day report'}
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={handleDownloadPdf}
                      disabled={!days || downloadingPdf || loadingReport}
                      title={!days ? 'Generate a report first' : 'Download as PDF'}
                    >
                      {downloadingPdf ? (
                        'Generating PDF…'
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <span aria-hidden>⤓</span>
                          <span>Download PDF</span>
                        </span>
                      )}
                    </Button>

                    {loadingReport ? <Spinner label={status || 'Fetching'} /> : null}
                  </div>
                </div>

                {error ? <div className="mt-4 text-sm text-red-300">{error}</div> : null}
                {!loadingReport && status ? <div className="mt-2 text-sm text-slate-400">{status}</div> : null}
              </CardBody>
            </Card>

            {days ? (
              <div ref={reportRef} className="space-y-4">
                <ReportBlock userLabel={selectedUser?.name || selectedUser?.email || selectedUserId} days={days} />
              </div>
            ) : null}
          </div>
        )}

        <footer className="mt-10 text-xs text-slate-600">
          Powered by Sensor Bio | Data stays in your browser
        </footer>
      </div>
    </main>
  );
}

function ReportBlock({ userLabel, days }: { userLabel: string; days: SleepDay[] }) {
  const summary = computeSummary(days);

  const start = days[0]?.date;
  const end = days[days.length - 1]?.date;

  return (
    <>
      <div className="mb-2">
        <h2 className="text-white text-lg font-bold">{userLabel} — 30-Day Sleep Report</h2>
        <p className="text-[13px] text-slate-500">
          {formatRange(start, end)} · Sensor Bio · {summary.recordedCount} of {summary.totalDays} days recorded
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <SummaryCard label="Avg Sleep Score" value={summary.avgScore ? Math.round(summary.avgScore).toString() : '—'} accent="amber" sub={`${summary.recordedCount} nights recorded`} />
        <SummaryCard label="Avg Total Sleep" value={minsToHm(summary.avgTotal ?? undefined)} accent="blue" sub="Goal: 7h+" />
        <SummaryCard
          label="Avg Deep + REM"
          value={summary.avgDeepRem ? `${Math.round(summary.avgDeepRem)} min` : '—'}
          accent="purple"
          sub={`Deep ${summary.avgDeep ? Math.round(summary.avgDeep) : '—'}m · REM ${summary.avgRem ? Math.round(summary.avgRem) : '—'}m`}
        />
        <SummaryCard
          label="Avg Resting HR"
          value={summary.avgRestingHr ? `${fmt1(summary.avgRestingHr)} bpm` : '—'}
          accent="amber"
          sub={`Avg HRV: ${summary.avgHrv ? fmt1(summary.avgHrv) : '—'} ms`}
        />
        <SummaryCard
          label="Best / Worst"
          value={
            <span className="text-base font-extrabold">
              <span className="text-green-500">{summary.best?.score ? Math.round(summary.best.score) : '—'}</span>
              <span className="text-slate-500"> / </span>
              <span className="text-red-500">{summary.worst?.score ? Math.round(summary.worst.score) : '—'}</span>
            </span>
          }
          sub={`${summary.best?.date ?? '—'} / ${summary.worst?.date ?? '—'}`}
        />
      </div>

      <Card className="mt-4">
        <CardBody>
          <SectionTitle>Sleep Score Heatmap — {formatRange(start, end)}</SectionTitle>
          <HeatmapCalendar days={days} />
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody>
          <SectionTitle>Sleep Score and Duration — Daily Trend</SectionTitle>
          <TrendChart days={days} />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardBody>
            <SectionTitle>Sleep Stage Breakdown (recorded nights)</SectionTitle>
            <StagesChart days={days} />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <SectionTitle>Resting HR and HRV Trend</SectionTitle>
            <BiometricsChart days={days} />
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardBody>
          <SectionTitle>Night-by-Night Detail</SectionTitle>
          <div className="overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase tracking-wider">
                  <th className="text-left py-2 px-2 border-b border-[#1e293b]">Date</th>
                  <th className="text-center py-2 px-2 border-b border-[#1e293b]">Score</th>
                  <th className="text-center py-2 px-2 border-b border-[#1e293b]">Total</th>
                  <th className="text-center py-2 px-2 border-b border-[#1e293b]">Deep</th>
                  <th className="text-center py-2 px-2 border-b border-[#1e293b]">REM</th>
                  <th className="text-center py-2 px-2 border-b border-[#1e293b]">Awake</th>
                  <th className="text-center py-2 px-2 border-b border-[#1e293b]">Latency</th>
                  <th className="text-center py-2 px-2 border-b border-[#1e293b]">HRV</th>
                  <th className="text-center py-2 px-2 border-b border-[#1e293b]">Resting HR</th>
                </tr>
              </thead>
              <tbody>
                {days
                  .slice()
                  .reverse()
                  .map((d) => (
                    <tr key={d.date} className="text-slate-400">
                      <td className="py-2 px-2 border-b border-[#0f172a] text-slate-200">{d.date}</td>
                      {d.hasData ? (
                        <>
                          <td className="py-2 px-2 border-b border-[#0f172a] text-center font-semibold">
                            <span className={scoreTextClass(d.score)}>{d.score ? Math.round(d.score) : '—'}</span>
                          </td>
                          <td className="py-2 px-2 border-b border-[#0f172a] text-center">{minsToHm(d.totalMins)}</td>
                          <td className="py-2 px-2 border-b border-[#0f172a] text-center">{d.deepMins ?? '—'}m</td>
                          <td className="py-2 px-2 border-b border-[#0f172a] text-center">{d.remMins ?? '—'}m</td>
                          <td className="py-2 px-2 border-b border-[#0f172a] text-center">{d.awakeMins ?? '—'}m</td>
                          <td className="py-2 px-2 border-b border-[#0f172a] text-center">{d.latencyMins ?? '—'}m</td>
                          <td className="py-2 px-2 border-b border-[#0f172a] text-center">{d.hrv ? fmt1(d.hrv) : '—'}</td>
                          <td className="py-2 px-2 border-b border-[#0f172a] text-center">{d.restingHr ? fmt1(d.restingHr) : '—'}</td>
                        </>
                      ) : (
                        <td className="py-2 px-2 border-b border-[#0f172a] text-center text-slate-600" colSpan={8}>
                          No data
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <div className="mt-4">
        <SectionTitle>Key Insights</SectionTitle>
        <Insights days={days} />
      </div>
    </>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub: string;
  accent?: 'green' | 'amber' | 'red' | 'blue' | 'purple';
}) {
  const color =
    accent === 'green'
      ? 'text-green-500'
      : accent === 'amber'
        ? 'text-amber-500'
        : accent === 'red'
          ? 'text-red-500'
          : accent === 'blue'
            ? 'text-blue-400'
            : accent === 'purple'
              ? 'text-purple-400'
              : 'text-slate-200';

  return (
    <Card>
      <CardBody>
        <Label>{label}</Label>
        <div className={`text-2xl font-extrabold mt-1 ${color}`}>{value}</div>
        <div className="text-[11px] text-slate-400 mt-1">{sub}</div>
      </CardBody>
    </Card>
  );
}

function Insights({ days }: { days: SleepDay[] }) {
  const items = generateInsights(days);
  return (
    <div className="space-y-2">
      {items.map((t, idx) => (
        <div
          key={idx}
          className="bg-[#0f172a] border-l-[3px] border-amber-500 rounded-r-lg px-4 py-3 text-sm text-slate-300"
        >
          <span className="font-bold text-amber-400">{prefix(t)}</span>
          <span>{stripPrefix(t)}</span>
        </div>
      ))}
    </div>
  );
}

function prefix(s: string) {
  const first = s.split(':')[0];
  if (s.startsWith('Overall:')) return 'Overall:';
  if (s.includes(' best night')) return 'Best:';
  if (s.includes(' worst night')) return 'Worst:';
  if (s.startsWith('High variability')) return 'Variability:';
  if (s.includes('missing days')) return 'Missing:';
  return `${first}:`;
}

function stripPrefix(s: string) {
  if (s.startsWith('Overall:')) return ` ${s.replace('Overall:', '').trim()}`;
  return ` ${s}`;
}

function formatRange(start?: string, end?: string) {
  if (!start || !end) return '';
  const s = `${start}`;
  const e = `${end}`;
  const s2 = `${s.slice(5, 7)}/${s.slice(8, 10)}/${s.slice(0, 4)}`;
  const e2 = `${e.slice(5, 7)}/${e.slice(8, 10)}/${e.slice(0, 4)}`;
  return `${s2} – ${e2}`;
}
