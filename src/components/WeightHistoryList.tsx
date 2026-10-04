import React from 'react';
import { Trash2, Scale, Clock } from 'lucide-react';
import { WeightLog } from '../types';

export interface WeightHistoryListProps {
  logs?: WeightLog[];
  onDelete: (id: string) => Promise<void>;
}

export default function WeightHistoryList({ logs = [], onDelete }: WeightHistoryListProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-slate-600">
        <Scale className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p className="text-sm font-medium">Nenhum registro de peso cadastrado.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-600" />
          Histórico de Pesagens ({logs.length})
        </h3>
      </div>

      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
        {logs.map((log) => {
          const d = new Date(log.timestamp);
          const dateFormatted = d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          const timeFormatted = d.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div key={log.id} className="py-3 flex items-center justify-between hover:bg-slate-50 rounded-xl px-2 transition-colors">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-extrabold text-slate-900">{log.weightKg} kg</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    log.tag === 'Jejum'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : log.tag === 'Pós-treino'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {log.tag || 'Normal'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                  <span>{dateFormatted} às {timeFormatted}</span>
                  {log.notes && <span className="italic">"{log.notes}"</span>}
                </div>
              </div>

              <button
                onClick={() => onDelete(log.id)}
                title="Excluir medição"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
