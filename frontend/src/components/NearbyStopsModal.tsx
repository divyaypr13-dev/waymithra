import React, { useState } from 'react';
import { X, MapPin, Bus, Clock, ArrowRight, Navigation, Sparkles } from 'lucide-react';
import { Stop, VehicleLiveState, Route, Language } from '../types';
import { getTranslation } from '../translations';
import { getDistanceMeters } from './MapView';

interface NearbyStopsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stops: Stop[];
  vehicles: VehicleLiveState[];
  routes: Route[];
  userLocation: { lat: number; lng: number } | null;
  language: Language;
  onSelectStopAsOrigin: (stopId: string) => void;
  onSelectVehicle: (vehicle: VehicleLiveState) => void;
}

export const NearbyStopsModal: React.FC<NearbyStopsModalProps> = ({
  isOpen,
  onClose,
  stops,
  vehicles,
  routes,
  userLocation,
  language,
  onSelectStopAsOrigin,
  onSelectVehicle
}) => {
  const t = getTranslation(language);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'accessible'>('all');

  if (!isOpen) return null;

  // Use user location or default Central Bengaluru reference (MG Road)
  const refLat = userLocation?.lat ?? 12.9756;
  const refLng = userLocation?.lng ?? 77.6097;

  // Sort stops by distance
  const sortedStops = [...stops]
    .map(stop => {
      const distMeters = getDistanceMeters(refLat, refLng, stop.lat, stop.lng);
      return {
        ...stop,
        distMeters,
        walkMinutes: Math.max(1, Math.round(distMeters / 80)) // ~80m per min walk
      };
    })
    .filter(stop => {
      if (selectedCategory === 'accessible') {
        return (stop.facilities || []).some(f =>
          f.toLowerCase().includes('ramp') || f.toLowerCase().includes('tactile') || f.toLowerCase().includes('audio')
        );
      }
      return true;
    })
    .sort((a, b) => a.distMeters - b.distMeters);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0D1B36] border border-[#1E3563] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E3563] bg-[#09142A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>{t.nearbyStops} & Approaching Buses</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-normal">
                  Live BMTC Grid
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {userLocation ? '📍 Sorted by distance from your current GPS position' : '📍 Reference: Central Bengaluru (MG Road Core)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-[#1E3563]/60 bg-[#09152B]">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Stops ({stops.length})
          </button>
          <button
            onClick={() => setSelectedCategory('accessible')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedCategory === 'accessible'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Accessible Hubs Only
          </button>
        </div>

        {/* List of Stops with Approaching Buses */}
        <div className="p-6 overflow-y-auto space-y-4">
          {sortedStops.map((stop) => {
            const stopName = t.stops[stop.id as keyof typeof t.stops] || stop.name;
            
            // Find vehicles heading toward or near this stop
            const approachingBuses = vehicles.filter(v => v.next_stop_id === stop.id || v.current_stop_id === stop.id);

            return (
              <div
                key={stop.id}
                className="p-4 rounded-xl bg-[#09152B] border border-[#1E3563] hover:border-sky-500/50 transition-all flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{stopName}</h4>
                      <p className="text-xs text-slate-400">{stop.landmark || 'BMTC Transit Hub'}</p>
                      
                      {/* Distance & Walking Badge */}
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-300">
                        <span className="font-semibold text-amber-400">
                          {stop.distMeters < 1000 ? `${stop.distMeters} m` : `${(stop.distMeters / 1000).toFixed(1)} km`} away
                        </span>
                        <span>•</span>
                        <span>🚶 {stop.walkMinutes} min walk</span>
                      </div>
                    </div>
                  </div>

                  {/* Set as Origin Button */}
                  <button
                    onClick={() => {
                      onSelectStopAsOrigin(stop.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sky-600/30 hover:bg-sky-600 text-sky-300 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <span>Depart From Here</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Facilities */}
                {stop.facilities && stop.facilities.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#1E3563]/50">
                    {stop.facilities.map((fac, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#0D1B36] border border-[#1E3563] text-slate-300"
                      >
                        ✓ {fac}
                      </span>
                    ))}
                  </div>
                )}

                {/* Approaching Buses Section */}
                <div className="pt-2 border-t border-[#1E3563]/50">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Approaching Live Buses:
                  </span>
                  {approachingBuses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {approachingBuses.map((bus) => (
                        <div
                          key={bus.id}
                          onClick={() => {
                            onSelectVehicle(bus);
                            onClose();
                          }}
                          className="p-2 rounded-lg bg-[#0D1B36] border border-[#1E3563] hover:border-amber-400/50 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Bus className="w-3.5 h-3.5 text-amber-400" />
                            <div>
                              <span className="text-xs font-bold text-white block">{bus.display_name}</span>
                              <span className="text-[10px] text-slate-400">{bus.status === 'DELAYED' ? 'Delayed' : 'On Time'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-400 block">{bus.eta_next_stop_minutes} min</span>
                            <span className="text-[9px] text-slate-400 font-semibold">{bus.crowd_level} crowd</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No buses currently within 1 stop. Scheduled departures active.</p>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
