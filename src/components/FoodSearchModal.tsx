import React, { useState } from 'react';
import { Search, X, Plus, Flame, Check, Scale } from 'lucide-react';
import { FoodItem, MealType } from '../types';

export interface FoodSearchModalProps {
  mealType: MealType;
  onSearchFoods: (query: string) => Promise<FoodItem[]>;
  onAddFoodItem: (item: { foodName: string; grams: number; calories: number; proteinGrams?: number }) => void;
  onClose: () => void;
}

export default function FoodSearchModal({ mealType, onSearchFoods, onAddFoodItem, onClose }: FoodSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [grams, setGrams] = useState<number>(100);

  // Quick Manual Custom Entry states
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customCalories, setCustomCalories] = useState<string>('200');

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await onSearchFoods(query);
    setSearchResults(results);
    setIsSearching(false);
  };

  const calculatedCalories = selectedFood
    ? Math.round((selectedFood.caloriesPer100g * grams) / 100)
    : 0;

  const handleConfirmAddSelected = () => {
    if (!selectedFood) return;
    onAddFoodItem({
      foodName: selectedFood.name,
      grams,
      calories: calculatedCalories,
      proteinGrams: selectedFood.proteinPer100g ? Math.round((selectedFood.proteinPer100g * grams) / 100) : undefined
    });
    onClose();
  };

  const handleConfirmCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const cals = parseInt(customCalories, 10);
    if (!customName.trim() || isNaN(cals) || cals <= 0) return;
    onAddFoodItem({
      foodName: customName.trim(),
      grams: 100,
      calories: cals
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-xl border border-slate-200 space-y-4 animate-fade-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Flame className="w-5 h-5 text-orange-500" />
              Adicionar Alimento — {mealType}
            </h3>
            <p className="text-xs text-slate-600">Busca local offline TACO + Open Food Facts</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setIsCustomMode(false)}
            className={`flex-1 py-1.5 rounded-lg transition-all ${!isCustomMode ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600'}`}
          >
            Buscar na Tabela / Base
          </button>
          <button
            onClick={() => setIsCustomMode(true)}
            className={`flex-1 py-1.5 rounded-lg transition-all ${isCustomMode ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600'}`}
          >
            + Entrada Rápida de Calorias
          </button>
        </div>

        {!isCustomMode ? (
          <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                autoFocus
                placeholder="Ex: Frango, Arroz, Ovo, Banana, Tapioca..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full text-xs font-medium pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            {/* Results list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[140px]">
              {isSearching ? (
                <p className="text-xs text-slate-500 text-center py-4">Buscando alimento...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  {searchTerm ? 'Nenhum alimento encontrado. Tente outra palavra ou use a Entrada Rápida.' : 'Digite o nome do alimento acima para buscar.'}
                </p>
              ) : (
                searchResults.map((food) => {
                  const isSelected = selectedFood?.id === food.id;
                  return (
                    <button
                      key={food.id}
                      onClick={() => setSelectedFood(food)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-teal-50 border-teal-500 shadow-sm'
                          : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block">{food.name}</strong>
                        <span className="text-[11px] text-slate-500">
                          {food.caloriesPer100g} kcal por 100g {food.category ? `• ${food.category}` : ''}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-teal-700 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                        {food.caloriesPer100g} kcal
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Portion / Grams Adjuster */}
            {selectedFood && (
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 animate-fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">{selectedFood.name}</span>
                  <span className="text-orange-400 font-extrabold text-sm">{calculatedCalories} kcal</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-slate-400 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5" /> Quantidade (gramas):
                  </label>
                  <div className="flex items-center gap-2">
                    {[50, 100, 150, 200].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGrams(g)}
                        className={`px-2 py-1 text-[11px] font-bold rounded-lg ${
                          grams === g ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {g}g
                      </button>
                    ))}
                    <input
                      type="number"
                      value={grams}
                      onChange={(e) => setGrams(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-16 text-center text-xs font-bold bg-slate-800 border border-slate-700 text-white rounded-lg p-1"
                    />
                  </div>
                </div>

                <button
                  onClick={handleConfirmAddSelected}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Confirmar (+{calculatedCalories} kcal)
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Custom Quick Calories Form */
          <form onSubmit={handleConfirmCustom} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Descrição / Nome do Alimento:</label>
              <input
                type="text"
                autoFocus
                placeholder="Ex: Lanche da tarde, Pastel de feira, Shake..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Quantidade de Calorias (kcal):</label>
              <input
                type="number"
                placeholder="Ex: 350"
                value={customCalories}
                onChange={(e) => setCustomCalories(e.target.value)}
                className="w-full text-base font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none text-center"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Adicionar Refeição Rápida
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
