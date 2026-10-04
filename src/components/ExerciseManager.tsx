import React, { useState } from 'react';
import { Dumbbell, Plus, Trash2, Edit2, Check, X, Search, Clock } from 'lucide-react';
import { ExerciseCategory, ExerciseTemplate } from '../types';

export interface ExerciseManagerProps {
  exercises?: ExerciseTemplate[];
  onSave: (ex: Partial<ExerciseTemplate>) => Promise<ExerciseTemplate>;
  onDelete: (id: string) => Promise<void>;
  onClose?: () => void;
}

export default function ExerciseManager({ exercises = [], onSave, onDelete, onClose }: ExerciseManagerProps) {
  const [editingEx, setEditingEx] = useState<ExerciseTemplate | null>(null);
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<ExerciseCategory>('strength');
  const [defaultRestSeconds, setDefaultRestSeconds] = useState<number>(60);
  const [notes, setNotes] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const startEdit = (ex: ExerciseTemplate) => {
    setEditingEx(ex);
    setName(ex.name);
    setCategory(ex.category || 'strength');
    setDefaultRestSeconds(ex.defaultRestSeconds || 60);
    setNotes(ex.notes || '');
  };

  const resetForm = () => {
    setEditingEx(null);
    setName('');
    setCategory('strength');
    setDefaultRestSeconds(60);
    setNotes('');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('O nome do exercício é obrigatório.');
      return;
    }

    try {
      await onSave({
        id: editingEx ? editingEx.id : undefined,
        name,
        category,
        defaultRestSeconds,
        notes
      });
      resetForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar exercício.';
      setErrorMsg(msg);
    }
  };

  const filtered = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ex.notes && ex.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-teal-600" />
            Gerenciamento de Exercícios ({exercises.length})
          </h2>
          <p className="text-xs text-slate-600">
            Cadastre, edite ou remova exercícios da sua biblioteca local.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Form for Add/Edit */}
      <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
          <span>{editingEx ? 'Editar Exercício' : 'Cadastrar Novo Exercício'}</span>
          {editingEx && (
            <button
              type="button"
              onClick={resetForm}
              className="text-[11px] font-bold text-teal-600 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Novo
            </button>
          )}
        </h3>

        {errorMsg && (
          <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-lg font-medium">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">Nome do Exercício:</label>
            <input
              type="text"
              placeholder="Ex: Leg Press 45, Rosca Direta, Corrida..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Categoria:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
              className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-teal-500"
            >
              <option value="strength">Musculação / Força</option>
              <option value="cardio">Cardio / HIIT</option>
              <option value="bodyweight">Peso Corporal / Calistenia</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Descanso Padrão (segundos):</label>
            <select
              value={defaultRestSeconds}
              onChange={(e) => setDefaultRestSeconds(parseInt(e.target.value, 10))}
              className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-teal-500"
            >
              {[30, 45, 60, 90, 120, 180].map((s) => (
                <option key={s} value={s}>{s} segundos</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">Observação / Instruções (opcional):</label>
            <input
              type="text"
              placeholder="Ex: Regule banco no nível 3, segurar 2s embaixo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{editingEx ? 'Atualizar Exercício' : 'Salvar Exercício'}</span>
          </button>
          {editingEx && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Filter / Search bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Buscar exercício cadastrado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs font-medium pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
        />
      </div>

      {/* List of Registered Exercises */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">Nenhum exercício encontrado.</p>
        ) : (
          filtered.map((ex) => (
            <div
              key={ex.id}
              className="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/80 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <strong className="text-xs font-bold text-slate-900">{ex.name}</strong>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    ex.category === 'cardio'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : ex.category === 'bodyweight'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-teal-50 text-teal-700 border-teal-200'
                  }`}>
                    {ex.category === 'cardio' ? 'Cardio' : ex.category === 'bodyweight' ? 'Peso Corp.' : 'Força'}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                    <Clock className="w-3 h-3 text-slate-400" /> {ex.defaultRestSeconds || 60}s
                  </span>
                </div>
                {ex.notes && (
                  <p className="text-[11px] text-slate-600 mt-0.5 italic">"{ex.notes}"</p>
                )}
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => startEdit(ex)}
                  className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-white rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(ex.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
