import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { TrendingDown, TrendingUp, Minus, Calendar } from 'lucide-react';
import { WeightLog, WorkoutLog, UserProfile } from '../types';

export interface InteractiveChartProps {
  processedLogs?: WeightLog[];
  workouts?: WorkoutLog[];
  profile?: UserProfile;
}

export type TimeRange = '14' | '30' | '90' | 'all';

export default function InteractiveChart({ processedLogs = [], workouts = [], profile }: InteractiveChartProps) {
  const [range, setRange] = useState<TimeRange>('30');

  // Filter logs by timeframe
  const filteredData = useMemo(() => {
    if (!processedLogs || processedLogs.length === 0) return [];
    
    // Sort chronologically ascending for the chart
    const ascending = [...processedLogs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    if (range === 'all') return ascending;

    const days = parseInt(range, 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return ascending.filter((item) => new Date(item.timestamp) >= cutoff);
  }, [processedLogs, range]);

  // Map workout dates to set marker flags on matching weight log days
  const chartData = useMemo(() => {
    const workoutDates = new Set(workouts.map((w) => w.date));

    return filteredData.map((item) => {
      const dateStr = item.timestamp.split('T')[0];
      const hasWorkout = workoutDates.has(dateStr);

      const d = new Date(item.timestamp);
      const formattedDate = `${d.getDate()}/${d.getMonth() + 1}`;

      return {
        ...item,
        dateFormatted: formattedDate,
        dateFull: dateStr,
        hasWorkout,
        workoutMarker: hasWorkout ? item.ema7 : null
      };
    });
  }, [filteredData, workouts]);

  // Compute trend metrics
  const stats = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0];
    const last = chartData[chartData.length - 1];
    const diffEma = Math.round(((last.ema7 || last.weightKg) - (first.ema7 || first.weightKg)) * 100) / 100;
    const isDown = diffEma < 0;
    const isUp = diffEma > 0;

    return {
      currentEma: last.ema7 || last.weightKg,
      currentWeight: last.weightKg,
      diffEma,
      isDown,
      isUp
    };
  }, [chartData]);

  // Y Axis domain padding
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [60, 90];
    const weights = chartData.map((d) => d.weightKg);
    const emas = chartData.map((d) => d.ema7 || d.weightKg);
    const all = [...weights, ...emas];
    if (profile?.targetWeightKg) all.push(profile.targetWeightKg);

    const min = Math.floor(Math.min(...all) - 1);
    const max = Math.ceil(Math.max(...all) + 1);
    return [min, max];
  }, [chartData, profile]);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft-sm">
      {/* Header & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
            Tendência de Peso Corporal (EMA-7)
          </h2>
          <p className="text-xs text-slate-600">
            Linha contínua azul representa o progresso real sem oscilação de líquidos.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          {[
            { id: '14' as TimeRange, label: '14d' },
            { id: '30' as TimeRange, label: '30d' },
            { id: '90' as TimeRange, label: '90d' },
            { id: 'all' as TimeRange, label: 'Geral' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRange(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                range === tab.id
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary Strip */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100 text-xs">
          <div>
            <span className="text-slate-600 font-medium block">Último Peso:</span>
            <strong className="text-slate-800 text-sm font-bold">{stats.currentWeight} kg</strong>
          </div>
          <div>
            <span className="text-slate-600 font-medium block">Tendência (EMA-7):</span>
            <strong className="text-teal-700 text-sm font-bold">{stats.currentEma} kg</strong>
          </div>
          <div>
            <span className="text-slate-600 font-medium block">Variação do Período:</span>
            <div className={`flex items-center space-x-1 text-sm font-bold ${
              stats.isDown ? 'text-emerald-600' : stats.isUp ? 'text-orange-600' : 'text-slate-600'
            }`}>
              {stats.isDown && <TrendingDown className="w-4 h-4" />}
              {stats.isUp && <TrendingUp className="w-4 h-4" />}
              {!stats.isDown && !stats.isUp && <Minus className="w-4 h-4" />}
              <span>{stats.diffEma > 0 ? `+${stats.diffEma}` : stats.diffEma} kg</span>
            </div>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-200 rounded-xl">
          <Calendar className="w-8 h-8 mb-2 text-slate-300" />
          <p className="text-sm font-medium">Nenhuma medição registrada no período selecionado.</p>
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              
              <XAxis
                dataKey="dateFormatted"
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              
              <YAxis
                domain={yDomain}
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
                unit="kg"
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 backdrop-blur-md">
                        <p className="font-bold text-slate-300 border-b border-slate-800 pb-1">
                          Data: {data.dateFull}
                        </p>
                        <p className="text-slate-300">
                          Peso Medido: <strong className="text-white">{data.weightKg} kg</strong> ({data.tag})
                        </p>
                        <p className="text-teal-400 font-semibold">
                          Tendência (EMA-7): <strong className="text-teal-300">{data.ema7} kg</strong>
                        </p>
                        {data.hasWorkout && (
                          <p className="text-orange-400 font-bold flex items-center gap-1 pt-1">
                            🔥 Treino realizado neste dia
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Target line */}
              {profile?.targetWeightKg && (
                <ReferenceLine
                  y={profile.targetWeightKg}
                  stroke="#10B981"
                  strokeDasharray="4 4"
                  label={{
                    value: `Meta: ${profile.targetWeightKg}kg`,
                    fill: '#10B981',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />
              )}

              {/* Raw Weight Line (Slate 400 Dotted) */}
              <Line
                type="monotone"
                dataKey="weightKg"
                name="Peso Diário"
                stroke="#94A3B8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#94A3B8' }}
                activeDot={{ r: 5 }}
              />

              {/* EMA-7 Curve (Teal 600 Solid 3px) */}
              <Line
                type="monotone"
                dataKey="ema7"
                name="Tendência (EMA-7)"
                stroke="#0D9488"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#0D9488', stroke: '#FFFFFF', strokeWidth: 2 }}
              />

              {/* Workout markers on graph bottom */}
              <Line
                type="monotone"
                dataKey="workoutMarker"
                name="Treino"
                stroke="transparent"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!payload?.hasWorkout || !cx || !cy) {
                    return <g key={`no_wk_${payload?.id || Math.random()}`} />;
                  }
                  return (
                    <circle
                      key={`wk_${payload.id}`}
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill="#F97316"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    />
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-teal-600 inline-block rounded"></span>
            <span className="font-semibold text-slate-700">Linha EMA-7 (Tendência Real)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-slate-400 inline-block"></span>
            <span>Peso Diário</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
            <span>Dia de Treino</span>
          </div>
        </div>
      </div>
    </div>
  );
}
