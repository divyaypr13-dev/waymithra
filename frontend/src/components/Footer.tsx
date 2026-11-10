import React, { useState } from 'react';
import { Home, Compass, MapPin, Menu, Heart, Sliders, Ticket, Shield, X, Bus } from 'lucide-react';
import { Language, AppMode } from '../types';
import { getTranslation } from '../translations';

interface FooterProps {
  language: Language;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenLiveCam: () => void;
  onOpenHelp?: () => void;
  onOpenNearbyStops?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  language,
  mode,
  onModeChange,
  activeTab,
  onTabChange,
  onOpenLiveCam,
  onOpenHelp,
  onOpenNearbyStops
}) => {
  const t = getTranslation(language);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-0 right-0 z-30 px-4 pointer-events-none">
      
      {/* Quick More Drawer / Menu */}
      {isMoreMenuOpen && (
        <div className="pointer-events-auto max-w-sm mx-auto mb-3 bg-[#0D1B36]/95 backdrop-blur-2xl border border-[#1E3563] rounded-2xl p-3 shadow-2xl space-y-1.5 animate-in slide-in-from-bottom-3">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1E3563]/60 mb-2">
            <span className="text-xs font-bold text-slate-300">Transit Role & Quick Actions</span>
            <button
              onClick={() => setIsMoreMenuOpen(false)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              onModeChange('admin');
              setIsMoreMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-[#132347] flex items-center gap-2.5 transition-colors"
          >
            <Sliders className="w-4 h-4 text-sky-400" />
            <span>Switch to {t.adminMode}</span>
          </button>

          <button
            onClick={() => {
              onModeChange('conductor');
              setIsMoreMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-[#132347] flex items-center gap-2.5 transition-colors"
          >
            <Ticket className="w-4 h-4 text-emerald-400" />
            <span>Switch to {t.conductorMode}</span>
          </button>

          <button
            onClick={() => {
              if (onOpenHelp) onOpenHelp();
              setIsMoreMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors"
          >
            <Shield className="w-4 h-4 text-rose-400" />
            <span>{t.requestAssistance} & SOS</span>
          </button>

          {onOpenNearbyStops && (
            <button
              onClick={() => {
                onOpenNearbyStops();
                setIsMoreMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/10 flex items-center gap-2.5 transition-colors"
            >
              <Bus className="w-4 h-4 text-amber-400" />
              <span>{t.nearbyStops} Radar</span>
            </button>
          )}
        </div>
      )}

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
              onModeChange('user');
              onTabChange('track');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              mode === 'user' && activeTab === 'track'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MapPin className="w-4 h-4 text-sky-400" />
            <span>{t.track}</span>
          </button>

          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              isMoreMenuOpen
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Menu className="w-4 h-4" />
            <span>{t.more}</span>
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
