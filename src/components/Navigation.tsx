import React from 'react';
import { Dumbbell, TrendingUp, Database } from 'lucide-react';

export type NavigationTab = 'today' | 'trend' | 'data';

export interface NavigationProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
}

export default function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const tabs: { id: NavigationTab; label: string; icon: React.ElementType }[] = [
    { id: 'today', label: 'Hoje / Treino', icon: Dumbbell },
    { id: 'trend', label: 'Tendência / Peso', icon: TrendingUp },
    { id: 'data', label: 'Dados / Sync', icon: Database }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-1.5 shadow-lg md:relative md:border-t-0 md:bg-transparent md:shadow-none md:p-0 md:mb-4">
      <div className="max-w-md mx-auto md:max-w-none flex items-center justify-around md:justify-start md:space-x-2">
        {tabs.map((t) => {
          const IconComponent = t.icon;
          const isActive = activeTab === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex flex-col md:flex-row items-center justify-center min-h-[48px] px-4 py-1.5 rounded-2xl transition-all ${
                isActive
                  ? 'text-teal-600 bg-teal-50 md:bg-teal-600 md:text-white shadow-soft-sm font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-semibold'
              }`}
            >
              <IconComponent className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[11px] md:text-xs mt-0.5 md:mt-0 md:ml-2 tracking-tight">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
