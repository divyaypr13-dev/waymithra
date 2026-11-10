import React, { useState, useEffect } from 'react';
import {
  Compass, Search, ArrowRight, ArrowDownUp, Bus, Clock, Users,
  Zap, ShieldCheck, MapPin, SlidersHorizontal, Sparkles
} from 'lucide-react';
import { Stop, Route, VehicleLiveState, JourneyPlanResponse, JourneyCard, Language } from '../types';
import { getTranslation } from '../translations';
import { api } from '../services/api';

interface JourneysViewProps {
  stops: Stop[];
  routes: Route[];
  vehicles: VehicleLiveState[];
  language: Language;
  onSelectVehicle: (vehicle: VehicleLiveState) => void;
  onTrackJourney: (vehicle: VehicleLiveState) => void;
  userLocation: { lat: number; lng: number } | null;
  initialOrigin?: string;
  initialDest?: string;
}

export const JourneysView: React.FC<JourneysViewProps> = ({
  stops,
  routes,
  vehicles,
  language,
  onSelectVehicle,
  onTrackJourney,
  userLocation,
  initialOrigin = 'BLR-STOP-02', // MG Road
  initialDest = 'BLR-STOP-04'    // SJBIT College
}) => {
  const t = getTranslation(language);
  const [originStop, setOriginStop] = useState<string>(initialOrigin);
  const [destStop, setDestStop] = useState<string>(initialDest);
  const [selectedPlanType, setSelectedPlanType] = useState<'Fastest' | 'Less Crowded' | 'Alternative'>('Fastest');
  const [planResponse, setPlanResponse] = useState<JourneyPlanResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [preferAccessible, setPreferAccessible] = useState<boolean>(false);

  // Fetch Journey Plan when origin or destination changes
  useEffect(() => {
    const fetchPlan = async () => {
      if (!originStop || !destStop || originStop === destStop) return;
      setLoading(true);
      try {
        const res = await api.planJourney(originStop, destStop);
        setPlanResponse(res);
      } catch (err) {
        console.error('Plan fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [originStop, destStop]);

  const handleSwap = () => {
    const temp = originStop;
    setOriginStop(destStop);
    setDestStop(temp);
  };

  const activePlan = planResponse?.plans.find(p => p.type === selectedPlanType) || planResponse?.plans[0];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 pb-28">
      
      {/* Title */}
      <div className="pb-6 border-b border-[#1E3563] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Compass className="w-7 h-7 text-amber-400" />
            <span>BMTC Journey Planner</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Compare predicted travel times, live crowd levels & wheelchair accessibility.
          </p>
        </div>

        {/* Accessibility Preference Toggle */}
        <button
          onClick={() => setPreferAccessible(!preferAccessible)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            preferAccessible
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'bg-[#0D1B36] border border-[#1E3563] text-slate-300 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{preferAccessible ? 'Accessible Vehicles Only ✓' : 'Prefer Accessible'}</span>
        </button>
      </div>

      {/* Origin & Destination Selector Bar */}
      <div className="my-6 p-4 rounded-2xl bg-[#0D1B36] border border-[#1E3563] shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Origin Stop */}
          <div className="md:col-span-5 flex items-center bg-[#09152B] border border-[#1E3563] rounded-xl px-3 py-2.5">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0 mr-2" />
            <div className="w-full">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t.board} Stop (Origin)
              </label>
              <select
                value={originStop}
                onChange={(e) => setOriginStop(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-white focus:outline-hidden cursor-pointer"
              >
                {stops.map(s => (
                  <option key={s.id} value={s.id} className="bg-[#081225] text-white">
                    {t.stops[s.id as keyof typeof t.stops] || s.name} ({s.landmark || 'Core'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-2 flex justify-center">
            <button
              onClick={handleSwap}
              className="w-10 h-10 rounded-xl bg-[#132347] hover:bg-[#182C5A] border border-[#1E3563] text-amber-400 flex items-center justify-center transition-colors shadow-md"
              title="Swap Origin and Destination"
            >
              <ArrowDownUp className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Stop */}
          <div className="md:col-span-5 flex items-center bg-[#09152B] border border-[#1E3563] rounded-xl px-3 py-2.5">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0 mr-2" />
            <div className="w-full">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t.drop} Stop (Destination)
              </label>
              <select
                value={destStop}
                onChange={(e) => setDestStop(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-white focus:outline-hidden cursor-pointer"
              >
                {stops.map(s => (
                  <option key={s.id} value={s.id} className="bg-[#081225] text-white">
                    {t.stops[s.id as keyof typeof t.stops] || s.name} ({s.landmark || 'Core'})
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* 3 Ranked Options Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#09152B] border border-[#1E3563] mb-6">
        <button
          onClick={() => setSelectedPlanType('Fastest')}
          className={`py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            selectedPlanType === 'Fastest'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>{t.fastest}</span>
        </button>

        <button
          onClick={() => setSelectedPlanType('Less Crowded')}
          className={`py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            selectedPlanType === 'Less Crowded'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t.lessCrowded}</span>
        </button>

        <button
          onClick={() => setSelectedPlanType('Alternative')}
          className={`py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            selectedPlanType === 'Alternative'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>{t.alternative}</span>
        </button>
      </div>

      {/* Active Journey Plan Card */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-[#0D1B36] border border-[#1E3563]">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-300 font-bold">Computing multi-criteria transit routes...</p>
        </div>
      ) : activePlan ? (
        <div className="p-6 rounded-2xl bg-[#0D1B36] border border-[#1E3563] shadow-2xl space-y-6">
          
          {/* Top Plan Summary Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#1E3563] gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  {activePlan.type} Choice
                </span>
                <span className="text-xs text-slate-400">
                  {activePlan.transfer_count === 0 ? 'Direct Route' : '1 Transfer Connection'}
                </span>
              </div>
              <h3 className="text-xl font-black text-white">{activePlan.summary_text}</h3>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Total Travel Duration</span>
              <p className="text-2xl font-black text-white">
                {activePlan.total_travel_time_minutes} <span className="text-sm font-bold text-slate-400">{t.min}</span>
              </p>
            </div>
          </div>

          {/* Differential Note for Crowd Comparison */}
          {activePlan.crowd_differential_note && (
            <div className="p-3.5 rounded-xl bg-sky-950/60 border border-sky-500/40 text-xs text-sky-200 flex items-center gap-2.5">
              <Users className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="font-semibold">{activePlan.crowd_differential_note}</span>
            </div>
          )}

          {/* Journey Legs */}
          <div className="space-y-4">
            {activePlan.legs.map((leg, idx) => {
              const legVehicle = vehicles.find(v => v.id === leg.vehicle_id) || vehicles[0];

              return (
                <div key={idx} className="p-4 rounded-xl bg-[#09152B] border border-[#1E3563] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-sky-950 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold text-xs">
                        {leg.route_number}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{leg.vehicle_name}</h4>
                        <p className="text-xs text-slate-400">Route {leg.route_number} • Departs in {leg.departure_in_minutes} min</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        leg.current_crowd_level === 'Low' ? 'bg-emerald-500/20 text-emerald-300' :
                        leg.current_crowd_level === 'Moderate' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {leg.current_crowd_level} Crowd ({leg.current_crowd_count}/{leg.capacity})
                      </span>
                    </div>
                  </div>

                  {/* Boarding and Alighting Points */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#1E3563]/60 text-xs">
                    <div>
                      <span className="text-slate-400 block">{t.board}:</span>
                      <span className="font-bold text-white">{leg.from_stop_name}</span>
                      <p className="text-[11px] text-slate-400">🚶 {leg.walk_to_stop_minutes} min walk to stop</p>
                    </div>

                    <div>
                      <span className="text-slate-400 block">{t.drop}:</span>
                      <span className="font-bold text-white">{leg.to_stop_name}</span>
                      <p className="text-[11px] text-slate-400">Est. Arrival in {leg.arrival_in_minutes} min</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Big Track Action CTA */}
          <button
            onClick={() => {
              const targetVehicle = vehicles.find(v => v.id === activePlan.legs[0]?.vehicle_id) || vehicles[0];
              onSelectVehicle(targetVehicle);
              onTrackJourney(targetVehicle);
            }}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-95"
          >
            <Bus className="w-4 h-4" />
            <span>Track This Journey Live on Radar ➔</span>
          </button>

        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-[#0D1B36] border border-[#1E3563] text-slate-400 text-xs">
          Select valid origin and destination stops to view computed routes.
        </div>
      )}

    </div>
  );
};
