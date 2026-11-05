import React from 'react';
import { Home, Compass, MapPin, Menu, Heart } from 'lucide-react';
import { Language, AppMode } from '../types';
import { getTranslation } from '../translations';

interface FooterProps {
  language: Language;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenLiveCam: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  language,
  mode,
  onModeChange,
  activeTab,
  onTabChange,
  onOpenLiveCam
}) => {
  const t = getTranslation(language);

  return (
    <div className="fixed bottom-4 left-0 right-0 z-30 px-4 pointer-events-none">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Floating Navigation Island */}
        <div className="pointer-events-auto flex items-center p-1.5 rounded-2xl bg-[#09152B]/95 backdrop-blur-xl border border-[#1E3563] shadow-2xl">
          <button
            onClick={() => {
              onModeChange('user');
              onTabChange('home');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              mode === 'user' && activeTab === 'home'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>{t.home}</span>
          </button>

          <button
            onClick={() => {
              onModeChange('user');
              onTabChange('journeys');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              mode === 'user' && activeTab === 'journeys'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{t.journeys}</span>
          </button>

          <button
            onClick={() => {
              onOpenLiveCam();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800/60`}
          >
            <MapPin className="w-4 h-4 text-sky-400" />
            <span>{t.track}</span>
          </button>

          <button
            onClick={() => {
              onModeChange(mode === 'admin' ? 'user' : 'admin');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              mode === 'admin'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Menu className="w-4 h-4" />
            <span>{mode === 'admin' ? t.adminMode : t.more}</span>
          </button>
        </div>

        {/* Namma Bengaluru Artwork Pill */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-pink-950/80 to-[#0D1B36]/90 backdrop-blur-xl border border-rose-500/40 shadow-2xl">
          <Heart className="w-4 h-4 text-rose-400 fill-rose-500 animate-pulse" />
          <span className="text-xs font-extrabold text-white tracking-wide">
            {t.nammaBengaluru}
          </span>
          <span className="text-base">🏛️</span>
        </div>

      </div>
    </div>
  );
};
