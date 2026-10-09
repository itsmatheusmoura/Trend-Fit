import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Plus, CheckCircle, Flame, Dumbbell, Clock, Trash2, X } from 'lucide-react';
import { UseTimerReturn } from '../hooks/useTimer';
import { WorkoutExercise, ExerciseTemplate, SetEffort, WorkoutLog } from '../types';

export interface WorkoutExecutionProps {
  timer: UseTimerReturn;
  initialExercises?: WorkoutExercise[];
  availableExercises?: ExerciseTemplate[];
  onFinishWorkout: (workout: Partial<WorkoutLog>) => void;
  onCancel: () => void;
}

export default function WorkoutExecution({ timer, initialExercises = [], availableExercises = [], onFinishWorkout, onCancel }: WorkoutExecutionProps) {
  const [exercises, setExercises] = useState<WorkoutExercise[]>(() => {
    if (initialExercises && initialExercises.length > 0) {
      return initialExercises;
    }
    if (availableExercises && availableExercises.length > 0) {
      return availableExercises.slice(0, 2).map((e) => ({ ...e, sets: [] }));
    }
    return [
      { id: 'ex_1', name: 'Agachamento Livre', category: 'strength', sets: [] },
      { id: 'ex_3', name: 'Supino Reto', category: 'strength', sets: [] }
    ];
  });

  const [activeExIdx, setActiveExIdx] = useState<number>(0);
  const [newExerciseName, setNewExerciseName] = useState<string>('');
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>('');
  const [overallRpe, setOverallRpe] = useState<number>(8);
  const [workoutNotes, setWorkoutNotes] = useState<string>('');

  const currentExercise = exercises[activeExIdx] || exercises[0];

  const handleAddSet = (effortType: SetEffort) => {
    if (!currentExercise) return;
    const newSet = {
      set: (currentExercise.sets?.length || 0) + 1,
      effort: effortType,
      restSeconds: timer.targetSeconds,
      timestamp: new Date().toISOString()
    };

    setExercises((prev) =>
      prev.map((ex, idx) => {
        if (idx === activeExIdx) {
          return { ...ex, sets: [...(ex.sets || []), newSet] };
        }
        return ex;
      })
    );

    // Auto-trigger rest timer on set completion!
    timer.startTimer();
  };

  const handleRemoveSet = (setIdxToRemove: number) => {
    setExercises((prev) =>
      prev.map((ex, idx) => {
        if (idx === activeExIdx) {
          const updatedSets = (ex.sets || [])
            .filter((_, sIdx) => sIdx !== setIdxToRemove)
            .map((s, i) => ({ ...s, set: i + 1 }));
          return { ...ex, sets: updatedSets };
        }
        return ex;
      })
    );
  };

  const handleRemoveExercise = (idxToRemove: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idxToRemove));
    if (activeExIdx >= idxToRemove && activeExIdx > 0) {
      setActiveExIdx((prev) => Math.max(0, prev - 1));
    }
  };

  const handleAddCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExerciseName.trim()) return;
    const newEx: WorkoutExercise = {
      id: `ex_live_${Date.now()}`,
      name: newExerciseName.trim(),
      category: 'strength',
      sets: []
    };
    setExercises((prev) => [...prev, newEx]);
    setActiveExIdx(exercises.length);
    setNewExerciseName('');
  };

  const handleAddFromLibrary = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    const found = availableExercises.find((ex) => ex.id === id);
    if (found && !exercises.some((e) => e.name === found.name)) {
      setExercises((prev) => [...prev, { ...found, sets: [] }]);
      setActiveExIdx(exercises.length);
    }
    setSelectedLibraryId('');
  };

  const handleFinish = () => {
    onFinishWorkout({
      type: 'Conditioning & Strength',
      exercises,
      overallRpe,
      notes: workoutNotes
    });
  };

  return (
    <div className="space-y-4">
      {/* Rest Timer Banner */}
      <div className={`p-6 rounded-3xl text-center border shadow-soft-lg transition-all ${
        timer.remainingSeconds === 0
          ? 'bg-orange-500 text-white border-orange-600 animate-pulse'
          : timer.isRunning
          ? 'bg-slate-900 text-white border-slate-800'
          : 'bg-white text-slate-900 border-slate-200'
      }`}>
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2 opacity-80">
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Cronômetro de Descanso</span>
          <span>{timer.isRunning ? 'Em Andamento' : 'Pausado'}</span>
        </div>

        <div className="text-6xl sm:text-7xl font-extrabold font-mono tracking-tighter my-2">
          {timer.formattedTime}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          {[30, 45, 60, 90, 120].map((secs) => (
            <button
              key={secs}
              onClick={() => timer.startTimer(secs)}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border transition-all ${
                timer.targetSeconds === secs && timer.isRunning
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                  : 'bg-slate-100/80 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              {secs}s
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 mt-4">
          {timer.isRunning ? (
            <button
              onClick={timer.pauseTimer}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Pause className="w-4 h-4" /> Pausar
            </button>
          ) : (
            <button
              onClick={timer.resumeTimer}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Play className="w-4 h-4" /> Iniciar
            </button>
          )}

          <button
            onClick={timer.resetTimer}
            className="p-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
            title="Reiniciar"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Exercise Selector */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-teal-600" />
            Exercício Atual: <span className="text-teal-700 font-extrabold">{currentExercise?.name || 'Nenhum'}</span>
          </h3>
          {exercises.length > 0 && currentExercise && (
            <button
              type="button"
              onClick={() => handleRemoveExercise(activeExIdx)}
              className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 transition-colors"
              title="Excluir este exercício do treino atual"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remover Exercício</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {exercises.map((ex, idx) => (
            <div
              key={ex.id || idx}
              className={`inline-flex items-center rounded-xl border transition-all ${
                activeExIdx === idx
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveExIdx(idx)}
                className="px-3 py-1.5 text-xs font-bold focus:outline-none"
              >
                {ex.name} ({ex.sets?.length || 0})
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveExercise(idx);
                }}
                className={`pr-2 py-1.5 text-xs transition-opacity ${
                  activeExIdx === idx ? 'text-teal-100 hover:text-white' : 'text-slate-400 hover:text-rose-600'
                }`}
                title="Remover exercício"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* 1-Touch RPE Set Logging Buttons */}
        {currentExercise && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Registrar Série — Percepção de Esforço (RPE):
            </p>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAddSet('light')}
                className="py-3 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-extrabold flex flex-col items-center gap-1 active:scale-95 transition-all"
              >
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span>Leve</span>
              </button>

              <button
                onClick={() => handleAddSet('optimal')}
                className="py-3 px-2 bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 rounded-xl text-xs font-extrabold flex flex-col items-center gap-1 active:scale-95 transition-all"
              >
                <span className="w-3 h-3 rounded-full bg-teal-600"></span>
                <span>Ideal / Moderado</span>
              </button>

              <button
                onClick={() => handleAddSet('limit')}
                className="py-3 px-2 bg-orange-50 hover:bg-orange-100 border border-orange-300 text-orange-800 rounded-xl text-xs font-extrabold flex flex-col items-center gap-1 active:scale-95 transition-all"
              >
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                <span>Limite / Falha</span>
              </button>
            </div>
          </div>
        )}

        {/* Sets Completed List */}
        {currentExercise?.sets && currentExercise.sets.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-600">Séries Registradas ({currentExercise.sets.length}):</h4>
              <span className="text-[10px] text-slate-500 font-medium">Clique no ✕ para apagar uma série</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentExercise.sets.map((s, setIdx) => (
                <div
                  key={setIdx}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all ${
                    s.effort === 'light'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : s.effort === 'limit'
                      ? 'bg-orange-50 text-orange-800 border-orange-300'
                      : 'bg-teal-50 text-teal-800 border-teal-300'
                  }`}
                >
                  <span>Série {s.set}: {s.effort === 'light' ? 'Leve' : s.effort === 'limit' ? 'Falha' : 'Ideal'} ({s.restSeconds || 60}s)</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSet(setIdx)}
                    className="p-0.5 rounded-full hover:bg-slate-200/60 text-slate-500 hover:text-rose-600 transition-colors"
                    title="Excluir série"
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Exercise Controls */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
          {availableExercises.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Adicionar da sua biblioteca de exercícios:
              </label>
              <select
                value={selectedLibraryId}
                onChange={handleAddFromLibrary}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800"
              >
                <option value="">+ Selecionar da biblioteca...</option>
                {availableExercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>
          )}

          <form onSubmit={handleAddCustomExercise} className="flex gap-2">
            <input
              type="text"
              placeholder="+ Adicionar exercício personalizado..."
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              className="flex-1 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Finish Workout Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Flame className="w-4 h-4 text-orange-500" /> Esforço Geral do Treino (RPE 1-10):
          </label>
          <span className="text-sm font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200">
            {overallRpe} / 10
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="10"
          value={overallRpe}
          onChange={(e) => setOverallRpe(parseInt(e.target.value, 10))}
          className="w-full accent-orange-500 cursor-pointer"
        />

        <input
          type="text"
          placeholder="Observações do treino..."
          value={workoutNotes}
          onChange={(e) => setWorkoutNotes(e.target.value)}
          className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
        />

        <div className="flex gap-2 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            Cancelar
          </button>
          <button
            onClick={handleFinish}
            className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" /> Finalizar Treino
          </button>
        </div>
      </div>
    </div>
  );
}
