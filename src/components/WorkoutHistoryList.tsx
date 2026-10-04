import React from 'react';
import { Dumbbell, Trash2, Calendar, Flame, Clock } from 'lucide-react';
import { WorkoutLog } from '../types';

export interface WorkoutHistoryListProps {
  workouts?: WorkoutLog[];
  onDelete: (id: string) => Promise<void>;
}

export default function WorkoutHistoryList({ workouts = [], onDelete }: WorkoutHistoryListProps) {
  if (!workouts || workouts.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-slate-600">
        <Dumbbell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p className="text-sm font-medium">Nenhum treino concluído ainda.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange-500" />
          Histórico de Treinos ({workouts.length})
        </h3>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {workouts.map((wk) => {
          const dateParts = wk.date ? wk.date.split('-') : [];
          const dateFormatted = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : wk.date;
          const durationMin = Math.round((wk.totalDurationSeconds || 2400) / 60);

          return (
            <div
              key={wk.id}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col justify-between space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-extrabold text-slate-900">{wk.type || 'Treino'}</span>
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {durationMin} min
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Data: <strong className="text-slate-700">{dateFormatted}</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Flame className="w-3 h-3" /> RPE {wk.overallRpe || 8}/10
                  </span>

                  <button
                    onClick={() => onDelete(wk.id)}
                    title="Excluir treino"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Exercises Summary Pill */}
              {wk.exercises && wk.exercises.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {wk.exercises.map((ex, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700"
                    >
                      {ex.name} ({ex.sets?.length || ex.rounds?.length || 0} séries)
                    </span>
                  ))}
                </div>
              )}

              {wk.notes && (
                <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                  "{wk.notes}"
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
