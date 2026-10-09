import React, { useState } from 'react';
import { Play, Dumbbell, Zap, HeartPulse, Settings2, Check } from 'lucide-react';
import { ExerciseTemplate, WorkoutExercise } from '../types';

export interface WorkoutPlannerProps {
  exerciseList?: ExerciseTemplate[];
  onStartLiveWorkout: (options: { preset: { id: string; title: string }; exercises: WorkoutExercise[] }) => void;
  onOpenExerciseManager: () => void;
  onOpenHiitTab?: () => void;
}

export default function WorkoutPlanner({ exerciseList = [], onStartLiveWorkout, onOpenExerciseManager, onOpenHiitTab }: WorkoutPlannerProps) {
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);

  const presets = [
    {
      id: 'strength',
      title: 'Força & Musculação',
      desc: 'Circuito de séries com controle RPE e descanso ativo.',
      icon: Dumbbell,
      color: 'bg-teal-500'
    },
    {
      id: 'hiit',
      title: 'HIIT Esteira (Guiado)',
      desc: 'Aba dedicada com tiro/caminhada, tempo e aviso sonoro.',
      icon: Zap,
      color: 'bg-orange-500'
    },
    {
      id: 'cardio',
      title: 'Cardio Contínuo',
      desc: 'Esteira, bicicleta ou remo com acompanhamento de tempo.',
      icon: HeartPulse,
      color: 'bg-emerald-500'
    }
  ];

  const toggleSelectExercise = (id: string) => {
    setSelectedExerciseIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleStart = (preset: { id: string; title: string }) => {
    if (preset.id === 'hiit' && onOpenHiitTab) {
      onOpenHiitTab();
      return;
    }

    let chosen = exerciseList.filter((e) => selectedExerciseIds.includes(e.id));
    if (chosen.length === 0) {
      if (preset.id === 'hiit' || preset.id === 'cardio') {
        chosen = exerciseList.filter((e) => e.category === 'cardio');
      } else {
        chosen = exerciseList.filter((e) => e.category === 'strength');
      }
      if (chosen.length === 0) chosen = exerciseList.slice(0, 3);
    }

    onStartLiveWorkout({
      preset,
      exercises: chosen.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        defaultRestSeconds: c.defaultRestSeconds || 60,
        sets: []
      }))
    });
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            Iniciar Novo Treino
          </h2>
          <p className="text-xs text-slate-600">
            Selecione uma modalidade e escolha os exercícios da sua biblioteca.
          </p>
        </div>

        <button
          onClick={onOpenExerciseManager}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-200 transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5 text-teal-600" />
          <span>Gerenciar Exercícios ({exerciseList.length})</span>
        </button>
      </div>

      {/* Preset Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {presets.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleStart(item)}
              className="text-left p-4 rounded-xl border border-slate-200 hover:border-teal-500 bg-slate-50 hover:bg-teal-50/50 transition-all group active:scale-[0.98] flex flex-col justify-between"
            >
              <div>
                <div className={`w-9 h-9 rounded-xl ${item.color} text-white flex items-center justify-center mb-3 shadow-sm`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-4 flex items-center text-xs font-bold text-teal-600 gap-1 group-hover:translate-x-1 transition-transform">
                <Play className="w-3.5 h-3.5 fill-current" /> Iniciar Modo Execução
              </div>
            </button>
          );
        })}
      </div>

      {/* Exercise Selection Library Quick Bar */}
      {exerciseList.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-700 block mb-2">
            Exercícios Selecionados para este Treino (opcional):
          </label>
          <div className="flex flex-wrap gap-2">
            {exerciseList.map((ex) => {
              const isSelected = selectedExerciseIds.includes(ex.id);
              return (
                <button
                  key={ex.id}
                  onClick={() => toggleSelectExercise(ex.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  <span>{ex.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
