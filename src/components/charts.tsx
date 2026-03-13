'use client';

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import type { SleepDay } from '@/lib/sensorbio';
import { scoreColor } from '@/lib/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler);

function cssVar(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function TrendChart({ days }: { days: SleepDay[] }) {
  const valid = days.filter((d) => d.hasData && (d.totalMins ?? 0) > 10);
  const labels = valid.map((d) => d.date.slice(5));

  const grid = cssVar('--grid', '#1e293b');
  const ticks = cssVar('--muted', '#64748b');
  const legend = cssVar('--text-secondary', '#94a3b8');

  const data = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Score',
        data: valid.map((d) => d.score ?? null),
        backgroundColor: valid.map((d) => scoreColor(d.score)),
        borderRadius: 4,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Total (h)',
        data: valid.map((d) => (d.totalMins ? Number((d.totalMins / 60).toFixed(1)) : null)),
        borderColor: '#a78bfa',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 3,
        yAxisID: 'y1',
        order: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { labels: { color: legend } },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: grid },
        ticks: { color: ticks },
      },
      y1: {
        position: 'right' as const,
        beginAtZero: true,
        grid: { display: false },
        ticks: {
          color: '#a78bfa',
          callback: (v: any) => `${v}h`,
        },
      },
      x: {
        ticks: { color: ticks, maxRotation: 0, autoSkip: true },
        grid: { display: false },
      },
    },
  };

  return <Bar data={data as any} options={options as any} height={85} />;
}

export function StagesChart({ days }: { days: SleepDay[] }) {
  const valid = days.filter((d) => d.hasData && (d.totalMins ?? 0) > 10);
  const labels = valid.map((d) => d.date.slice(5));

  const grid = cssVar('--grid', '#1e293b');
  const ticks = cssVar('--muted', '#64748b');
  const legend = cssVar('--text-secondary', '#94a3b8');

  const data = {
    labels,
    datasets: [
      { label: 'Light', data: valid.map((d) => d.lightMins ?? 0), backgroundColor: '#334155', borderRadius: 2 },
      { label: 'Deep', data: valid.map((d) => d.deepMins ?? 0), backgroundColor: '#1e40af', borderRadius: 2 },
      { label: 'REM', data: valid.map((d) => d.remMins ?? 0), backgroundColor: '#7c3aed', borderRadius: 2 },
      { label: 'Awake', data: valid.map((d) => d.awakeMins ?? 0), backgroundColor: '#dc2626', borderRadius: 2 },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { labels: { color: legend } },
      tooltip: { enabled: true },
    },
    scales: {
      x: { stacked: true, ticks: { color: ticks, maxRotation: 0, autoSkip: true }, grid: { display: false } },
      y: {
        stacked: true,
        grid: { color: grid },
        ticks: { color: ticks, callback: (v: any) => `${v}m` },
      },
    },
  };

  return <Bar data={data as any} options={options as any} height={160} />;
}

export function BiometricsChart({ days }: { days: SleepDay[] }) {
  const valid = days.filter((d) => d.hasData && typeof d.restingHr === 'number' && typeof d.hrv === 'number');
  const labels = valid.map((d) => d.date.slice(5));

  const grid = cssVar('--grid', '#1e293b');
  const ticks = cssVar('--muted', '#64748b');
  const legend = cssVar('--text-secondary', '#94a3b8');

  const data = {
    labels,
    datasets: [
      {
        label: 'Resting HR',
        data: valid.map((d) => d.restingHr),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,.1)',
        tension: 0.3,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'HRV',
        data: valid.map((d) => d.hrv),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,.1)',
        tension: 0.3,
        fill: true,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { labels: { color: legend } },
      tooltip: { enabled: true },
    },
    scales: {
      x: { ticks: { color: ticks, maxRotation: 0, autoSkip: true }, grid: { display: false } },
      y: { grid: { color: grid }, ticks: { color: '#ef4444', callback: (v: any) => `${v} bpm` } },
      y1: {
        position: 'right' as const,
        grid: { display: false },
        ticks: { color: '#22c55e', callback: (v: any) => `${v} ms` },
      },
    },
  };

  return <Line data={data as any} options={options as any} height={160} />;
}
