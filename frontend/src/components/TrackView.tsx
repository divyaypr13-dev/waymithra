import React, { useState } from 'react';
import {
  Bus, MapPin, Clock, Users, Video, ShieldCheck, CheckCircle2,
  Bell, BellOff, Navigation, Sparkles, RefreshCw, AlertTriangle
} from 'lucide-react';
import { Stop, Route, VehicleLiveState, Language } from '../types';
import { getTranslation } from '../translations';
import { MapView } from './MapView';

interface TrackViewProps {
  stops: Stop[];
  routes: Route[];
  vehicles: VehicleLiveState[];
  selectedVehicle: VehicleLiveState;
  onSelectVehicle: (vehicle: VehicleLiveState) => void;
  onOpenLiveCam: (vehicle: VehicleLiveState) => void;
  onOpenHelp: () => void;
  language: Language;
  userLocation: { lat: number; lng: number } | null;
}

export const TrackView: React.FC<TrackViewProps> = ({
  stops,
  routes,
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  onOpenLiveCam,
  onOpenHelp,
  language,
  userLocation
}) => {
  const t = getTranslation(language);
  const [hasBoarded, setHasBoarded] = useState<boolean>(false);
  const [alightAlertEnabled, setAlightAlertEnabled] = useState<boolean>(false);
  const [alightTargetStop, setAlightTargetStop] = useState<string>('BLR-STOP-04'); // SJBIT default

  const route = routes.find(r => r.id === selectedVehicle.route_id) || routes[0];
  const stopsMap = new Map<string, Stop>();
  stops.forEach(s => stopsMap.set(s.id, s));

  // Determine current stop index and next stop index on route
  const routeStopIds = route?.stops || [];
  const currentStopIndex = routeStopIds.indexOf(selectedVehicle.current_stop_id);
  const nextStopIndex = routeStopIds.indexOf(selectedVehicle.next_stop_id || '');

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 pb-28">
      
      {/* Top Header & Bus Switcher Carousel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1E3563]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>BMTC Live Bus Tracking Radar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <span>{selectedVehicle.display_name}</span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-sky-950 border border-sky-500/40 text-sky-300 font-mono font-normal">
              {selectedVehicle.vehicle_number}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {route ? `${route.route_number}: ${route.name}` : 'Route In Service'}
          </p>
        </div>

        {/* Bus Selector Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {vehicles.map((v) => {
            const isCurrent = v.id === selectedVehicle.id;
            return (
              <button
                key={v.id}
                onClick={() => onSelectVehicle(v)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  isCurrent
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'bg-[#0D1B36] text-slate-300 hover:text-white border border-[#1E3563] hover:bg-[#132347]'
                }`}
              >
                <Bus className="w-3.5 h-3.5" />
                <span>{v.display_name}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  v.status === 'DELAYED' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}></span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Live Map (7 Cols) + Live BMTC Timeline & Controls (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
        
        {/* Left Column: Interactive Map & Live Telemetry Gauges (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Map Container */}
          <div className="h-[380px] sm:h-[440px] w-full rounded-2xl overflow-hidden border border-[#1E3563] shadow-2xl relative">
            <MapView
              stops={stops}
              routes={routes}
              vehicles={vehicles}
              selectedVehicle={selectedVehicle}
              onSelectVehicle={onSelectVehicle}
              onOpenLiveCam={onOpenLiveCam}
              language={language}
              userLocation={userLocation}
              showFollowToggle={true}
            />
          </div>

          {/* Real-Time Live Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0D1B36] border border-[#1E3563] flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Live Speed</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-white">{selectedVehicle.speed_kmh}</span>
                <span className="text-xs font-bold text-slate-400">km/h</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D1B36] border border-[#1E3563] flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Next Stop ETA</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-amber-400">
                  {selectedVehicle.eta_next_stop_minutes}
                </span>
                <span className="text-xs font-bold text-slate-400">min</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D1B36] border border-[#1E3563] flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Crowd Level</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  selectedVehicle.crowd_level === 'Low' ? 'bg-emerald-500/20 text-emerald-400' :
                  selectedVehicle.crowd_level === 'Moderate' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {selectedVehicle.crowd_level}
                </span>
                <span className="text-xs text-slate-300 font-bold">
                  {selectedVehicle.crowd_count}/{selectedVehicle.capacity}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D1B36] border border-[#1E3563] flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Status</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-extrabold text-emerald-400">
                  {selectedVehicle.status === 'DELAYED' ? 'Delayed' : 'On Time'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenLiveCam(selectedVehicle)}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Video className="w-4 h-4 text-emerald-200" />
              <span>{t.viewInteriorCam}</span>
            </button>

            <button
              onClick={onOpenHelp}
              className="py-3 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-2 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Accessibility & SOS</span>
            </button>
          </div>

        </div>

        {/* Right Column: Stop-by-Stop Route Timeline & Boarding Experience (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#0D1B36] border border-[#1E3563] p-5 shadow-2xl flex flex-col">
          
          {/* Timeline Title */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1E3563] mb-4">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Route Stop Timeline
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {routeStopIds.length} Stops Total
            </span>
          </div>

          {/* Passenger Boarded / Alighting Alarm Toggle Controls */}
          <div className="p-3.5 rounded-xl bg-[#09152B] border border-[#1E3563] mb-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Bus className="w-4 h-4 text-sky-400" />
                <span>Passenger Status:</span>
              </span>
              <button
                onClick={() => setHasBoarded(!hasBoarded)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  hasBoarded
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{hasBoarded ? 'Onboard This Bus ✓' : 'Tap When You Board'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1E3563]/60">
              <span className="text-xs text-slate-300 flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Alighting Alert:</span>
              </span>
              <button
                onClick={() => setAlightAlertEnabled(!alightAlertEnabled)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  alightAlertEnabled
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {alightAlertEnabled ? (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    <span>Alarm Active (1 stop away)</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-3.5 h-3.5" />
                    <span>Notify at Drop Stop</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Vertical Stop-by-Stop Timeline (BMTC App Style) */}
          <div className="space-y-1 relative before:absolute before:top-4 before:bottom-4 before:left-[17px] before:w-0.5 before:bg-[#1E3563] overflow-y-auto max-h-[380px] pr-2">
            {routeStopIds.map((stopId, index) => {
              const stop = stopsMap.get(stopId);
              const isPast = currentStopIndex !== -1 && index < currentStopIndex;
              const isCurrent = stopId === selectedVehicle.current_stop_id;
              const isNext = stopId === selectedVehicle.next_stop_id;
              const stopName = t.stops[stopId as keyof typeof t.stops] || stop?.name || stopId;

              return (
                <div key={stopId} className="relative flex items-start gap-3 py-2.5">
                  {/* Step Dot */}
                  <div className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    isNext
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20'
                      : isCurrent
                      ? 'bg-sky-500 text-white border-sky-400 shadow-md'
                      : isPast
                      ? 'bg-[#09152B] text-emerald-400 border-emerald-500/40'
                      : 'bg-[#09152B] text-slate-500 border-[#1E3563]'
                  }`}>
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isNext ? (
                      <Bus className="w-4 h-4 animate-bounce" />
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>

                  {/* Stop Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold truncate ${
                        isNext ? 'text-amber-400 text-sm' : isCurrent ? 'text-sky-300' : 'text-slate-200'
                      }`}>
                        {stopName}
                      </h4>
                      {isNext && (
                        <span className="text-xs font-black text-amber-400 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
                          {selectedVehicle.eta_next_stop_minutes} min
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-500/10">
                          Current Stop
                        </span>
                      )}
                      {isPast && (
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          Departed ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {stop?.landmark || 'BMTC Transit Hub'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
};
