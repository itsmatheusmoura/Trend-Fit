import React, { useState, useEffect } from 'react';
import { Plus, Minus, Check, Calendar, Tag, FileText, CheckCircle2 } from 'lucide-react';
import { WeightContextTag, WeightLog } from '../types';

export interface WeightQuickEntryProps {
  lastWeight?: number;
  onSave: (log: { weightKg: number; timestamp: string; tag: WeightContextTag; notes?: string }) => Promise<WeightLog>;
}

export default function WeightQuickEntry({ lastWeight, onSave }: WeightQuickEntryProps) {
  const [weight, setWeight] = useState<string>(lastWeight ? String(lastWeight) : '75.0');
  const [tag, setTag] = useState<WeightContextTag>('Jejum');
  const [timestamp, setTimestamp] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [lastSavedVal, setLastSavedVal] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (lastWeight && !weight) {
      setWeight(String(lastWeight));
    }
  }, [lastWeight, weight]);

  const handleAdjust = (delta: number) => {
    const current = parseFloat(weight) || 75.0;
    const val = Math.max(20, Math.min(300, current + delta));
    setWeight(val.toFixed(1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const val = parseFloat(weight);

    if (isNaN(val) || val <= 0) {
      setErrorMsg('Por favor, informe um peso válido.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        weightKg: val,
        timestamp: new Date(timestamp).toISOString(),
        tag,
        notes
      });
      setLastSavedVal(val);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
      setNotes('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao registrar peso.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
          Registro Rápido de Peso
        </h2>
      </div>

      {/* Prominent Success Alert Banner */}
      {savedSuccess && lastSavedVal !== null && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
            <span>Peso de <strong>{lastSavedVal} kg</strong> registrado com sucesso! Média móvel atualizada.</span>
          </span>
          <button onClick={() => setSavedSuccess(false)} className="text-emerald-700 hover:text-emerald-950 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Weight controls */}
        <div className="flex items-center justify-center space-x-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <button
            type="button"
            onClick={() => handleAdjust(-0.1)}
            className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-lg hover:bg-slate-100 active:scale-95 transition-all shadow-sm flex items-center justify-center"
          >
            <Minus className="w-5 h-5" />
          </button>

          <div className="relative flex items-baseline">
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-32 text-center text-3xl font-extrabold text-slate-900 bg-transparent focus:outline-none focus:border-teal-500 border-b-2 border-slate-200 pb-1"
            />
            <span className="text-slate-600 font-bold text-lg ml-1">kg</span>
          </div>

          <button
            type="button"
            onClick={() => handleAdjust(0.1)}
            className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-lg hover:bg-slate-100 active:scale-95 transition-all shadow-sm flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Context Tags */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-slate-600" /> Contexto:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Jejum', 'Pós-treino', 'Normal'] as WeightContextTag[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTag(t)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                  tag === t
                    ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Retroactive Date/Time & Optional Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-600" /> Data e Hora:
            </label>
            <input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-600" /> Observação (opcional):
            </label>
            <input
              type="text"
              placeholder="Ex: Sono regular, Pós-refeição..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3.5 px-4 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-[0.99] ${
            savedSuccess
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
          }`}
        >
          {savedSuccess ? (
            <>
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>Registrado com Sucesso!</span>
            </>
          ) : (
            <span>Registrar Peso</span>
          )}
        </button>
      </form>
    </div>
  );
}
