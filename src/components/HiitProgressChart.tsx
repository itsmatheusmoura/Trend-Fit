import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { Zap, Flame, Calendar, Award, TrendingUp, CheckCircle, AlertTriangle, Frown, ThumbsUp } from 'lucide-react';
import { WorkoutLog, HiitCompliance, HiitFeeling } from '../types';

export interface HiitProgressChartProps {
  workouts?: WorkoutLog[];
}

export type HiitTimeRange = '14' | '30' | '90' | 'all';

export default function HiitProgressChart({ workouts = [] }: HiitProgressChartProps) {
  const [range, setRange] = useState<HiitTimeRange>('30');

  // Filter only HIIT / Esteira workouts
  const hiitWorkouts = useMemo(() => {
    return workouts.filter(
      (w) =>
        w.type?.toLowerCase().includes('esteira') ||
        w.type?.toLowerCase().includes('hiit') ||
        (w.exercises && w.exercises.some((e) => e.name.toLowerCase().includes('esteira')))
    );
  }, [workouts]);

  // Filter chronologically ascending within time range
  const chartData = useMemo(() => {
    if (!hiitWorkouts || hiitWorkouts.length === 0) return [];

    const ascending = [...hiitWorkouts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (range === 'all') return ascending.map(formatItem);

    const days = parseInt(range, 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return ascending
      .filter((w) => new Date(w.date) >= cutoff)
      .map(formatItem);
  }, [hiitWorkouts, range]);

  function formatItem(w: WorkoutLog) {
    const parts = w.date.split('-');
    const dateFormatted = parts.length === 3 ? `${parts[2]}/${parts[1]}` : w.date;
    const durationMin = Math.round((w.totalDurationSeconds || 900) / 60);
    const runSpeed = typeof w.runSpeed === 'number' ? w.runSpeed : parseFloat(String(w.runSpeed || '10.0')) || 10.0;
    const walkSpeed = typeof w.walkSpeed === 'number' ? w.walkSpeed : parseFloat(String(w.walkSpeed || '5.5')) || 5.5;

    return {
      ...w,
      dateFormatted,
      durationMin,
      runSpeed,
      walkSpeed,
      rpe: w.overallRpe || 8,
      compliance: w.compliance || 'full',
      feeling: w.feeling || 'good'
    };
  }

  // Summary Metrics
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return { totalSessions: 0, totalMinutes: 0, maxSpeed: 0, fullCompliancePct: 0, avgRpe: 0 };
    }
    const totalSessions = chartData.length;
    const totalMinutes = chartData.reduce((acc, d) => acc + d.durationMin, 0);
    const maxSpeed = Math.max(...chartData.map((d) => d.runSpeed));
    const fullComplianceCount = chartData.filter((d) => d.compliance === 'full').length;
    const fullCompliancePct = Math.round((fullComplianceCount / totalSessions) * 100);
    const avgRpe = (chartData.reduce((acc, d) => acc + d.rpe, 0) / totalSessions).toFixed(1);

    return { totalSessions, totalMinutes, maxSpeed, fullCompliancePct, avgRpe };
  }, [chartData]);

  // Color helper for compliance bar fill
  const getBarColor = (compliance?: HiitCompliance, feeling?: HiitFeeling) => {
    if (compliance === 'full' || feeling === 'excellent') return '#10B981'; // Emerald Green
    if (compliance === 'partial' || feeling === 'good' || feeling === 'regular') return '#F59E0B'; // Amber Yellow
    return '#F43F5E'; // Rose Red
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ReturnType<typeof formatItem>;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-soft-xl text-xs space-y-1.5 border border-slate-800">
          <div className="font-extrabold flex items-center justify-between gap-3 text-slate-200 pb-1 border-b border-slate-800">
            <span>Data: {data.dateFormatted}</span>
            <span className="text-orange-400 font-extrabold">{data.durationMin} min de Esteira</span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[11px]">
            <div>
              <span className="text-slate-400 block">Velocidade Tiro:</span>
              <strong className="text-teal-400 font-extrabold text-xs">{data.runSpeed} km/h</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Velocidade Cam.:</span>
              <strong className="text-slate-200 font-extrabold text-xs">{data.walkSpeed} km/h</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Esforço RPE:</span>
              <strong className="text-orange-400 font-extrabold text-xs">{data.rpe}/10</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Plano HIIT:</span>
              <strong className={`font-extrabold text-xs ${
                data.compliance === 'full' ? 'text-emerald-400' : data.compliance === 'partial' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {data.compliance === 'full' ? '100% Seguido' : data.compliance === 'partial' ? 'Parcial' : 'Dificuldade'}
              </strong>
            </div>
          </div>

          {data.notes && (
            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800">
              "{data.notes}"
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-soft-md space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500 fill-current" />
            Evolução & Progresso HIIT Esteira
          </h3>
          <p className="text-xs text-slate-600">
            Acompanhe o ganho de velocidade, volume em minutos e fidelidade ao plano.
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {[
            { id: '14', label: '14D' },
            { id: '30', label: '30D' },
            { id: '90', label: '90D' },
            { id: 'all', label: 'Geral' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setRange(t.id as HiitTimeRange)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                range === t.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-600 block">Sessões Realizadas:</span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="text-xl font-extrabold text-slate-900">{stats.totalSessions}</span>
            <span className="text-xs font-bold text-slate-600">treinos ({stats.totalMinutes} min)</span>
          </div>
        </div>

        <div className="bg-teal-50/60 p-3.5 rounded-2xl border border-teal-100">
          <span className="text-[11px] font-semibold text-teal-800 block">Velocidade Máxima:</span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="text-xl font-extrabold text-teal-700">{stats.maxSpeed || '--'}</span>
            <span className="text-xs font-bold text-teal-800">km/h</span>
          </div>
        </div>

        <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
          <span className="text-[11px] font-semibold text-emerald-800 block">Fidelidade ao Plano:</span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="text-xl font-extrabold text-emerald-700">{stats.fullCompliancePct}%</span>
            <span className="text-xs font-bold text-emerald-800">100% cumprido</span>
          </div>
        </div>

        <div className="bg-orange-50/60 p-3.5 rounded-2xl border border-orange-100">
          <span className="text-[11px] font-semibold text-orange-800 block">Esforço Médio (RPE):</span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="text-xl font-extrabold text-orange-600">{stats.avgRpe || '--'}</span>
            <span className="text-xs font-bold text-orange-800">/ 10</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      {chartData.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-600 space-y-2 border border-dashed border-slate-200">
          <Zap className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Nenhum treino de esteira registrado no período selecionado.</p>
          <p className="text-xs text-slate-500">Inicie um treino na aba HIIT Esteira para acompanhar sua evolução gráfica!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Chart Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-600 px-1 gap-2">
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block"></span>
                <span>Duração (Minutos)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-teal-600 inline-block"></span>
                <span className="text-teal-700 font-extrabold">Velocidade Tiro (km/h)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-orange-500 inline-block"></span>
                <span className="text-orange-600">Esforço RPE</span>
              </span>
            </div>

            <div className="flex items-center space-x-2 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 100% Seguido
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Parcial
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Com Dificuldade
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="dateFormatted"
                  tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 'auto']}
                  unit="m"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#0D9488', fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[4, 'auto']}
                  unit=" km/h"
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Bars for Workout Duration (minutes), colored by compliance */}
                <Bar yAxisId="left" dataKey="durationMin" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.compliance, entry.feeling)} />
                  ))}
                </Bar>

                {/* Line for Treadmill Sprint Speed (km/h) */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="runSpeed"
                  stroke="#0D9488"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#0D9488', stroke: '#FFFFFF', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#0D9488', stroke: '#FFFFFF', strokeWidth: 2 }}
                />

                {/* Line for RPE Effort */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="rpe"
                  stroke="#F97316"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#F97316' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
