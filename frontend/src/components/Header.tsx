import React from 'react';
import { Bus, MapPin, Globe, Shield, User, Sliders, Ticket as TicketIcon, HelpCircle } from 'lucide-react';
import { Language, AppMode } from '../types';
import { getTranslation } from '../translations';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  mode,
  onModeChange,
  onOpenHelp
}) => {
  const t = getTranslation(language);

  return (
    <header className="sticky top-0 z-40 bg-[#081225]/90 backdrop-blur-md border-b border-[#1E3563] px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onModeChange('user')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 p-0.5 shadow-lg shadow-sky-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#081225] rounded-[10px] flex items-center justify-center">
              <Bus className="w-6 h-6 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-white">Way</span>
              <span className="text-xl font-extrabold text-amber-400 font-sans">ಮಿತ್ರ</span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 hidden sm:block tracking-wide">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Mode Switcher Navigation Pills */}
        <nav className="hidden md:flex items-center p-1 rounded-xl bg-[#0D1B36] border border-[#1E3563]">
          <button
            onClick={() => onModeChange('user')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mode === 'user'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            {t.userMode}
          </button>
          
          <button
            onClick={() => onModeChange('admin')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mode === 'admin'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            {t.adminMode}
          </button>

          <button
            onClick={() => onModeChange('conductor')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mode === 'conductor'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <TicketIcon className="w-3.5 h-3.5" />
            {t.conductorMode}
          </button>
        </nav>

        {/* Controls: Language Selector, City, SOS & User */}
        <div className="flex items-center gap-2.5">
          
          {/* Multilingual Selector: English, Kannada, Hindi */}
          <div className="flex items-center bg-[#0D1B36] border border-[#1E3563] rounded-xl p-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-sky-400 ml-1.5 mr-1 hidden sm:inline" />
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                language === 'en' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="English"
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('kn')}
              className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                language === 'kn' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="ಕನ್ನಡ (Kannada)"
            >
              ಕನ್ನಡ
            </button>
            <button
              onClick={() => onLanguageChange('hi')}
              className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                language === 'hi' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="हिंदी (Hindi)"
            >
              हिंदी
            </button>
          </div>

          {/* Accessibility & SOS Quick Button */}
          <button
            onClick={onOpenHelp}
            className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Accessibility Assistance & SOS"
          >
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">SOS</span>
          </button>

          {/* City Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D1B36] border border-[#1E3563] text-xs font-medium text-slate-200">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>{t.city}</span>
          </div>

          {/* User / Mode Profile Pill */}
          <div className="relative group">
            <button className="w-9 h-9 rounded-xl bg-[#0D1B36] border border-[#1E3563] hover:border-sky-500/50 flex items-center justify-center text-slate-200 transition-colors">
              <User className="w-4 h-4 text-sky-400" />
            </button>
            
            {/* Dropdown Menu on mobile/desktop */}
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#0D1B36] border border-[#1E3563] shadow-xl p-1.5 hidden group-hover:block z-50">
              <div className="px-3 py-1.5 border-b border-[#1E3563] mb-1">
                <p className="text-[11px] text-slate-400 font-medium">Switch Active Role</p>
                <p className="text-xs font-bold text-white capitalize">{mode} Mode</p>
              </div>
              <button
                onClick={() => onModeChange('user')}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 ${mode === 'user' ? 'bg-amber-400/20 text-amber-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <Bus className="w-3.5 h-3.5" />
                {t.userMode}
              </button>
              <button
                onClick={() => onModeChange('admin')}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 ${mode === 'admin' ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <Sliders className="w-3.5 h-3.5" />
                {t.adminMode}
              </button>
              <button
                onClick={() => onModeChange('conductor')}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 ${mode === 'conductor' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <TicketIcon className="w-3.5 h-3.5" />
                {t.conductorMode}
              </button>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
