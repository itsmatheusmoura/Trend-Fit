import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, RefreshCw, Scale, Edit3, Check, X } from 'lucide-react';
import { UserProfile } from '../types';

export interface HeaderProps {
  profile?: UserProfile;
  updateProfile?: (newProfile: Partial<UserProfile>) => Promise<void>;
  onQuickSync?: (() => Promise<void>) | null;
  syncing?: boolean;
}

export default function Header({ profile, updateProfile, onQuickSync, syncing }: HeaderProps) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isEditingTarget, setIsEditingTarget] = useState<boolean>(false);
  const [targetInput, setTargetInput] = useState<string>(profile?.targetWeightKg ? String(profile.targetWeightKg) : '75.0');

  useEffect(() => {
    if (profile?.targetWeightKg) {
      setTargetInput(String(profile.targetWeightKg));
    }
  }, [profile]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(targetInput);
    if (!isNaN(val) && val > 0 && updateProfile) {
      await updateProfile({ targetWeightKg: val });
    }
    setIsEditingTarget(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-soft-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
            <Activity className="w-5.5 h-5.5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight tracking-tight">
              Trend<span className="text-teal-600">Fit</span>
            </h1>
            <p className="text-[11px] text-slate-600 font-medium hidden sm:block">
              Média Móvel & Condicionamento
            </p>
          </div>
        </div>

        {/* Center / Target Weight Interactive Badge */}
        <div className="relative">
          {isEditingTarget ? (
            <form onSubmit={handleSaveTarget} className="flex items-center space-x-1 bg-teal-50 border border-teal-300 px-2 py-1 rounded-full shadow-sm">
              <Scale className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-xs font-semibold text-teal-800">Meta:</span>
              <input
                type="number"
                step="0.1"
                autoFocus
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                className="w-14 text-xs font-bold text-teal-900 bg-white border border-teal-300 rounded px-1 text-center focus:outline-none"
              />
              <span className="text-xs text-teal-700 font-bold">kg</span>
              <button type="submit" className="p-1 text-teal-700 hover:text-teal-900" title="Salvar Meta">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => setIsEditingTarget(false)} className="p-1 text-slate-400 hover:text-slate-600" title="Cancelar">
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsEditingTarget(true)}
              title="Clique para editar sua Meta de Peso"
              className="flex items-center space-x-1.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 px-3 py-1 rounded-full text-xs text-slate-600 font-medium transition-all group cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5 text-teal-600" />
              <span>Meta: <strong className="text-slate-800 group-hover:text-teal-700">{profile?.targetWeightKg || 75.0} kg</strong></span>
              <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-teal-600 opacity-60 group-hover:opacity-100 ml-0.5" />
            </button>
          )}
        </div>

        {/* Status Badges & Actions */}
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden xs:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {onQuickSync && (
            <button
              onClick={onQuickSync}
              disabled={syncing}
              title="Sincronizar Backup"
              className="p-2 rounded-xl text-slate-600 hover:text-teal-600 hover:bg-teal-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
