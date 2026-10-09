import React, { useState } from 'react';
import { Flame, Plus, Trash2, Calendar, ChevronLeft, ChevronRight, Scale, Check, AlertTriangle } from 'lucide-react';
import { DailyNutritionLog, FoodItem, MealItem, MealType, UserProfile } from '../types';
import FoodSearchModal from './FoodSearchModal';
import { getLocalDateString } from '../utils/dateUtils';

export interface NutritionTrackerProps {
  currentLog: DailyNutritionLog;
  profile?: UserProfile;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onAddMealItem: (date: string, mealType: MealType, item: Omit<MealItem, 'id'>) => Promise<void>;
  onRemoveMealItem: (date: string, mealType: MealType, itemId: string) => Promise<void>;
  onSearchFoods: (query: string) => Promise<FoodItem[]>;
  onUpdateProfile?: (newProfile: Partial<UserProfile>) => Promise<void>;
}

export default function NutritionTracker({
  currentLog,
  profile,
  selectedDate,
  onSelectDate,
  onAddMealItem,
  onRemoveMealItem,
  onSearchFoods,
  onUpdateProfile
}: NutritionTrackerProps) {
  const [activeMealSearch, setActiveMealSearch] = useState<MealType | null>(null);
  const [isEditingTargetCals, setIsEditingTargetCals] = useState<boolean>(false);
  const [targetCalsInput, setTargetCalsInput] = useState<string>(
    profile?.targetCalories ? String(profile.targetCalories) : '2000'
  );

  const targetCalories = profile?.targetCalories || 2000;
  const totalConsumed = currentLog.totalCalories || 0;
  const calDifference = targetCalories - totalConsumed;
  const isExceeded = calDifference < 0;
  const progressPercent = Math.min(100, Math.round((totalConsumed / targetCalories) * 100));

  // Handle Date Navigation
  const handleDateShift = (days: number) => {
    const parts = selectedDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2] + days);
    onSelectDate(getLocalDateString(d));
  };

  const handleSaveTargetCals = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(targetCalsInput, 10);
    if (!isNaN(val) && val > 0 && onUpdateProfile) {
      await onUpdateProfile({ targetCalories: val });
    }
    setIsEditingTargetCals(false);
  };

  const mealTypes: MealType[] = ['Café da Manhã', 'Almoço', 'Lanche', 'Jantar', 'Outros'];

  return (
    <div className="space-y-5">
      {/* Top Banner & Progress Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-soft-md space-y-4">
        {/* Date Selector & Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Registro de Alimentação & Calorias
              </h2>
              <p className="text-xs text-slate-600">
                Acompanhe a ingestão diária e controle seu saldo calórico
              </p>
            </div>
          </div>

          {/* Date Switcher */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => handleDateShift(-1)}
              className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-colors"
              title="Dia anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-2">
              {selectedDate === getLocalDateString()
                ? 'Hoje'
                : selectedDate.split('-').reverse().join('/')}
            </span>
            <button
              onClick={() => handleDateShift(1)}
              className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-colors"
              title="Próximo dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calorie Progress Card */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isExceeded
            ? 'bg-rose-50 border-rose-200 text-rose-950'
            : 'bg-slate-900 text-white border-slate-800 shadow-lg'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider ${isExceeded ? 'text-rose-700' : 'text-slate-400'}`}>
                Consumo Diário
              </span>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                  {totalConsumed}
                </span>
                <span className={`text-sm font-bold ${isExceeded ? 'text-rose-700' : 'text-slate-400'}`}>
                  / {targetCalories} kcal
                </span>
              </div>
            </div>

            {/* Target Calorie Editor Trigger */}
            {isEditingTargetCals ? (
              <form onSubmit={handleSaveTargetCals} className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-slate-300">
                <input
                  type="number"
                  value={targetCalsInput}
                  onChange={(e) => setTargetCalsInput(e.target.value)}
                  className="w-20 text-xs font-bold text-slate-900 text-center focus:outline-none"
                />
                <button type="submit" className="p-1 text-teal-600 hover:text-teal-800">
                  <Check className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsEditingTargetCals(true)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  isExceeded
                    ? 'bg-white text-rose-800 border-rose-300 hover:bg-rose-100'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Meta: {targetCalories} kcal (Editar)
              </button>
            )}
          </div>

          {/* Progress Bar Container */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-800/40 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isExceeded
                    ? 'bg-gradient-to-r from-orange-500 to-rose-600'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {/* Balance Status Message */}
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={isExceeded ? 'text-rose-700 font-bold' : 'text-slate-400'}>
                Progresso: {progressPercent}%
              </span>
              <span className={`flex items-center gap-1 font-bold ${
                isExceeded ? 'text-rose-700' : 'text-emerald-400'
              }`}>
                {isExceeded ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" /> Ultrapassou {Math.abs(calDifference)} kcal
                  </>
                ) : (
                  `Faltam ${calDifference} kcal para a meta`
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Meals Grid / Accordions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mealTypes.map((mealType) => {
          const group = currentLog.meals.find((m) => m.mealType === mealType);
          const items = group?.items || [];
          const mealCalories = items.reduce((acc, i) => acc + (i.calories || 0), 0);

          return (
            <div key={mealType} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    {mealType}
                  </h3>
                  <span className="text-xs font-extrabold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                    {mealCalories} kcal
                  </span>
                </div>

                {/* Items List */}
                <div className="mt-3 space-y-2">
                  {items.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-1">Nenhum alimento registrado nesta refeição.</p>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="py-1.5 px-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-slate-800 block font-bold">{item.foodName}</strong>
                          <span className="text-[11px] text-slate-500">{item.grams}g</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{item.calories} kcal</span>
                          <button
                            onClick={() => onRemoveMealItem(selectedDate, mealType, item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Remover alimento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Food Button */}
              <button
                onClick={() => setActiveMealSearch(mealType)}
                className="w-full py-2 bg-slate-50 hover:bg-teal-50 border border-dashed border-slate-300 hover:border-teal-400 text-slate-700 hover:text-teal-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Alimento
              </button>
            </div>
          );
        })}
      </div>

      {/* Food Search Modal */}
      {activeMealSearch && (
        <FoodSearchModal
          mealType={activeMealSearch}
          onSearchFoods={onSearchFoods}
          onAddFoodItem={(item) => onAddMealItem(selectedDate, activeMealSearch, item)}
          onClose={() => setActiveMealSearch(null)}
        />
      )}
    </div>
  );
}
