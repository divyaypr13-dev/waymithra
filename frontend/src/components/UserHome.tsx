import React, { useState } from 'react';
import {
  Search, Crosshair, MapPin, Bus, Zap, Users, ShieldCheck,
  Clock, ArrowRight, SlidersHorizontal, RefreshCw, Video, EyeOff, Sparkles
} from 'lucide-react';
import { Stop, Route, VehicleLiveState, JourneyPlanResponse, Language } from '../types';
import { getTranslation } from '../translations';
import { MapView } from './MapView';

interface UserHomeProps {
  stops: Stop[];
  routes: Route[];
  vehicles: VehicleLiveState[];
  selectedVehicle: VehicleLiveState;
  onSelectVehicle: (vehicle: VehicleLiveState) => void;
  onOpenLiveCam: (vehicle: VehicleLiveState) => void;
  language: Language;
  onNavigateTab?: (tab: string) => void;
}

export const UserHome: React.FC<UserHomeProps> = ({
  stops,
  routes,
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  onOpenLiveCam,
  language,
  onNavigateTab
}) => {
  const t = getTranslation(language);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'Fastest' | 'Less Crowded' | 'Alternative'>('Fastest');
  const [originStop, setOriginStop] = useState<string>('BLR-STOP-02'); // MG Road
  const [destStop, setDestStop] = useState<string>('BLR-STOP-04'); // SJBIT College

  // Filter nearby buses based on search query
  const filteredVehicles = vehicles.filter(v => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const route = routes.find(r => r.id === v.route_id);
    return (
      v.display_name.toLowerCase().includes(q) ||
      v.vehicle_number.toLowerCase().includes(q) ||
      (route && route.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full pb-28">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0B1730] via-[#09152B] to-[#081225] border-b border-[#1E3563] px-4 sm:px-8 py-8 sm:py-12">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          {/* Hero Left: Title & Search Bar */}
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {t.heroTitle.split(',')[0]},<br />
              <span className="text-amber-400">
                {t.heroTitle.split(',')[1] || 'Reach Your Destination!'}
              </span>
            </h1>

            {/* Search Input Bar */}
            <div className="mt-6 flex items-center bg-[#0D1B36] border border-[#233F76] hover:border-sky-500/60 rounded-2xl p-1.5 shadow-xl transition-all">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-hidden"
              />
              <button
                onClick={() => {
                  setOriginStop('BLR-STOP-01');
                  setSearchQuery('Majestic');
                }}
                className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-colors"
                title="Locate closest bus"
              >
                <Crosshair className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Chips */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setOriginStop('BLR-STOP-02')}
                className="px-3.5 py-1.5 rounded-xl bg-[#132347] hover:bg-[#182C5A] border border-[#1E3563] text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.useMyLocation}</span>
              </button>
              
              <button
                onClick={() => setSearchQuery('')}
                className="px-3.5 py-1.5 rounded-xl bg-[#132347] hover:bg-[#182C5A] border border-[#1E3563] text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Bus className="w-3.5 h-3.5 text-sky-400" />
                <span>{t.nearbyStops}</span>
              </button>
            </div>
          </div>

          {/* Hero Right: 3 Value Proposition Feature Badges */}
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-[#0D1B36]/80 backdrop-blur-md border border-[#1E3563] flex items-center gap-3 shadow-md">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">
                {t.realTimeTracking}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0D1B36]/80 backdrop-blur-md border border-[#1E3563] flex items-center gap-3 shadow-md">
              <div className="w-9 h-9 rounded-xl bg-sky-400/20 text-sky-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">
                {t.crowdPrediction}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0D1B36]/80 backdrop-blur-md border border-[#1E3563] flex items-center gap-3 shadow-md">
              <div className="w-9 h-9 rounded-xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">
                {t.safeAccessible}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Main 3-Column Interactive Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Card 1: Nearby Buses (4 Cols) */}
          <div className="lg:col-span-4 rounded-2xl bg-[#0D1B36] border border-[#1E3563] p-5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E3563] mb-4">
              <div className="flex items-center gap-2">
                <Bus className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  {t.nearbyBuses}
                </h2>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <span>{t.viewAll}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of Bus Cards */}
            <div className="flex flex-col gap-3">
              {filteredVehicles.slice(0, 4).map((vehicle) => {
                const isSelected = selectedVehicle.id === vehicle.id;
                const isDelayed = vehicle.status === 'DELAYED';
                const isArriving = vehicle.eta_next_stop_minutes <= 2;
                const route = routes.find(r => r.id === vehicle.route_id);

                return (
                  <div
                    key={vehicle.id}
                    onClick={() => onSelectVehicle(vehicle)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#182C5A] border-sky-400 shadow-md shadow-sky-500/10 ring-1 ring-sky-400/30'
                        : 'bg-[#09152B] border-[#1E3563] hover:border-slate-600 hover:bg-[#0D1F42]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-lg bg-sky-950/80 border border-sky-500/30 flex items-center justify-center shrink-0">
                        <Bus className="w-6 h-6 text-sky-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{vehicle.display_name}</span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                            isDelayed ? 'text-amber-400' : isArriving ? 'text-sky-400' : 'text-emerald-400'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {isDelayed ? t.delayed : isArriving ? t.arriving : t.onTime}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {route?.name || 'MG Road → Majestic'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-base font-extrabold text-white">
                        {vehicle.eta_next_stop_minutes} {t.min}
                      </p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        vehicle.crowd_level === 'Low' ? 'bg-emerald-500/20 text-emerald-300' :
                        vehicle.crowd_level === 'Moderate' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {vehicle.crowd_level === 'Low' ? t.low : vehicle.crowd_level === 'Moderate' ? t.moderate : t.high}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Journey Options (4 Cols) */}
          <div className="lg:col-span-4 rounded-2xl bg-[#0D1B36] border border-[#1E3563] p-5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E3563] mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  {t.journeyOptions}
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Route 404</span>
            </div>

            {/* Filter Pills */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#081225] border border-[#1E3563] mb-4">
              <button
                onClick={() => setFilterType('Fastest')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  filterType === 'Fastest' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3 h-3" />
                {t.fastest}
              </button>
              <button
                onClick={() => setFilterType('Less Crowded')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  filterType === 'Less Crowded' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3 h-3" />
                {t.lessCrowded}
              </button>
              <button
                onClick={() => setFilterType('Alternative')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  filterType === 'Alternative' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.alternative}
              </button>
            </div>

            {/* Journey Plan Cards */}
            <div className="flex flex-col gap-3">
              {/* Option 1 */}
              <div className="p-3.5 rounded-xl bg-[#09152B] border border-[#1E3563] hover:border-slate-500 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">2 {t.min}</span>
                      <span className="text-[11px] text-slate-400">• Arrives 2:45 PM</span>
                    </div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Bus 404
                    </span>
                    <div className="text-xs text-slate-300 mt-1">
                      <span>{t.board}: MG Road</span> • <span>{t.drop}: SJBIT Stop</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">🚶 3 {t.min} {t.walk}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* Option 2 */}
              <div className="p-3.5 rounded-xl bg-[#09152B] border border-[#1E3563] hover:border-slate-500 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">5 {t.min}</span>
                      <span className="text-[11px] text-slate-400">• Arrives 2:48 PM</span>
                    </div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Bus 210
                    </span>
                    <div className="text-xs text-slate-300 mt-1">
                      <span>{t.board}: MG Road</span> • <span>{t.drop}: Majestic</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">🚶 4 {t.min} {t.walk}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Big Pink/Crimson Gradient CTA */}
            <button
              onClick={() => onOpenLiveCam(selectedVehicle)}
              className="mt-5 w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-xl shadow-rose-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <span>{t.trackThisJourney}</span>
            </button>
          </div>

          {/* Card 3: Live Bus Tracking & Camera Preview (4 Cols) */}
          <div className="lg:col-span-4 rounded-2xl bg-[#0D1B36] border border-[#1E3563] p-5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E3563] mb-4">
              <div className="flex items-center gap-2">
                <Bus className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  {t.liveBusTracking}
                </h2>
              </div>
              <button
                onClick={() => onSelectVehicle(selectedVehicle)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                title="Refresh live telemetry"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Selected Bus Header */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#09152B] border border-[#1E3563] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-950 border border-sky-500/40 flex items-center justify-center">
                  <Bus className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{selectedVehicle.display_name}</span>
                    <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {t.onTime}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">{selectedVehicle.vehicle_number}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400">{t.arrivesIn}</span>
                <p className="text-base font-extrabold text-white">
                  {selectedVehicle.eta_next_stop_minutes} {t.min}
                </p>
              </div>
            </div>

            {/* Interactive Leaflet Map Preview */}
            <div className="h-44 w-full rounded-xl overflow-hidden mb-4 relative">
              <MapView
                stops={stops}
                routes={routes}
                vehicles={vehicles}
                selectedVehicle={selectedVehicle}
                onSelectVehicle={onSelectVehicle}
                language={language}
              />
            </div>

            {/* Crowd Level & Live Camera Preview Thumbnail */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#09152B] border border-[#1E3563]">
              <div>
                <span className="text-xs text-slate-400">{t.crowdLevel}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                    selectedVehicle.crowd_level === 'Low' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    selectedVehicle.crowd_level === 'Moderate' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {selectedVehicle.crowd_level === 'Low' ? t.low : selectedVehicle.crowd_level === 'Moderate' ? t.moderate : t.high}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {selectedVehicle.crowd_count} / {selectedVehicle.capacity}
                  </span>
                </div>
              </div>

              {/* LIVE CAMERA FEED PREVIEW THUMBNAIL */}
              <div
                onClick={() => onOpenLiveCam(selectedVehicle)}
                className="relative w-24 h-16 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-md cursor-pointer group bg-black shrink-0 hover:scale-105 transition-all"
                title={t.viewInteriorCam}
              >
                <img
                  src="/assets/bus_sketch.png"
                  alt="Live Camera Sketch Preview"
                  className="w-full h-full object-cover group-hover:opacity-90"
                />
                <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[8px] font-bold flex items-center gap-1 animate-pulse">
                  <span className="w-1 h-1 rounded-full bg-white"></span>
                  {t.live}
                </div>
                <div className="absolute inset-0 bg-sky-950/20 group-hover:bg-transparent transition-colors"></div>
              </div>
            </div>

            {/* Primary Action Button: Access Interior Camera */}
            <button
              onClick={() => onOpenLiveCam(selectedVehicle)}
              className="mt-3.5 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Video className="w-4 h-4 text-emerald-200" />
              <span>{t.viewInteriorCam}</span>
            </button>

          </div>

        </div>
      </div>

    </div>
  );
};
