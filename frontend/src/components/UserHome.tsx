import React, { useState, useEffect } from 'react';
import {
  Search, Crosshair, MapPin, Bus, Zap, Users, ShieldCheck,
  Clock, ArrowRight, SlidersHorizontal, RefreshCw, Video, Sparkles, Navigation, Check, Compass
} from 'lucide-react';
import { Stop, Route, VehicleLiveState, JourneyPlanResponse, Language } from '../types';
import { getTranslation } from '../translations';
import { MapView, getDistanceMeters } from './MapView';
import { NearbyStopsModal } from './NearbyStopsModal';
import { api } from '../services/api';

interface UserHomeProps {
  stops: Stop[];
  routes: Route[];
  vehicles: VehicleLiveState[];
  selectedVehicle: VehicleLiveState;
  onSelectVehicle: (vehicle: VehicleLiveState) => void;
  onOpenLiveCam: (vehicle: VehicleLiveState) => void;
  language: Language;
  onNavigateTab?: (tab: string) => void;
  userLocation: { lat: number; lng: number } | null;
  onUserLocationChange?: (loc: { lat: number; lng: number }) => void;
  onOpenHelp?: () => void;
  onRefreshVehicles?: () => Promise<void>;
}

export const UserHome: React.FC<UserHomeProps> = ({
  stops,
  routes,
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  onOpenLiveCam,
  language,
  onNavigateTab,
  userLocation,
  onUserLocationChange,
  onOpenHelp,
  onRefreshVehicles
}) => {
  const t = getTranslation(language);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterType, setFilterType] = useState<'Fastest' | 'Less Crowded' | 'Alternative'>('Fastest');
  const [originStop, setOriginStop] = useState<string>('BLR-STOP-02'); // MG Road
  const [destStop, setDestStop] = useState<string>('BLR-STOP-04');   // SJBIT College
  
  const [planResponse, setPlanResponse] = useState<JourneyPlanResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const [locationToast, setLocationToast] = useState<string | null>(null);

  // Fetch Journey Plan when origin or destination changes
  useEffect(() => {
    const fetchPlan = async () => {
      if (!originStop || !destStop || originStop === destStop) return;
      try {
        const res = await api.planJourney(originStop, destStop);
        setPlanResponse(res);
      } catch (err) {
        console.error('Failed to plan journey', err);
      }
    };
    fetchPlan();
  }, [originStop, destStop]);

  // Handle GPS location request
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationToast('Geolocation not supported by your browser');
      return;
    }

    setLocationToast('Detecting your GPS position...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const loc = { lat: latitude, lng: longitude };
        if (onUserLocationChange) onUserLocationChange(loc);

        // Find closest stop
        if (stops.length > 0) {
          let closest = stops[0];
          let minDist = Infinity;
          stops.forEach(s => {
            const d = getDistanceMeters(latitude, longitude, s.lat, s.lng);
            if (d < minDist) {
              minDist = d;
              closest = s;
            }
          });

          setOriginStop(closest.id);
          const stopName = t.stops[closest.id as keyof typeof t.stops] || closest.name;
          setLocationToast(`📍 Origin set to nearest stop: ${stopName} (${minDist < 1000 ? `${minDist}m` : `${(minDist/1000).toFixed(1)}km`})`);
        }
      },
      (err) => {
        setLocationToast('Location access denied. Using demo origin (MG Road).');
        setOriginStop('BLR-STOP-02');
      },
      { enableHighAccuracy: true }
    );
  };

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

  // Autocomplete suggestions for stops and places
  const matchingStops = stops.filter(s => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.short_name.toLowerCase().includes(q) || (s.landmark && s.landmark.toLowerCase().includes(q));
  });

  const handleSelectSuggestion = (stop: Stop) => {
    setDestStop(stop.id);
    setSearchQuery(t.stops[stop.id as keyof typeof t.stops] || stop.name);
    setShowSuggestions(false);
  };

  const activePlan = planResponse?.plans.find(p => p.type === filterType) || planResponse?.plans[0];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefreshVehicles) {
      await onRefreshVehicles();
    }
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="w-full pb-28">
      
      {/* Toast message */}
      {locationToast && (
        <div className="fixed top-20 right-4 z-50 bg-[#0D1B36] border border-sky-400 text-sky-200 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in">
          <Navigation className="w-4 h-4 text-sky-400 animate-pulse" />
          <span>{locationToast}</span>
          <button onClick={() => setLocationToast(null)} className="ml-2 font-bold text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0B1730] via-[#09152B] to-[#081225] border-b border-[#1E3563] px-4 sm:px-8 py-8 sm:py-12">
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

            {/* Search Input Bar with Autocomplete Dropdown */}
            <div className="relative mt-6">
              <div className="flex items-center bg-[#0D1B36] border border-[#233F76] hover:border-sky-500/60 focus-within:border-sky-400 rounded-2xl p-1.5 shadow-xl transition-all">
                <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-hidden"
                />
                <button
                  onClick={handleUseMyLocation}
                  className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-colors"
                  title="Locate closest bus stop using your GPS"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && matchingStops.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-[#0D1B36] border border-[#1E3563] rounded-2xl shadow-2xl p-2 z-50 max-h-60 overflow-y-auto">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">
                    Matching BMTC Stops & Landmarks
                  </div>
                  {matchingStops.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSuggestion(s)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-xs text-white flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div>
                          <span className="font-bold">{t.stops[s.id as keyof typeof t.stops] || s.name}</span>
                          <span className="text-[11px] text-slate-400 block">{s.landmark || 'Core'}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-sky-400">Set Destination →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Action Chips */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleUseMyLocation}
                className="px-3.5 py-1.5 rounded-xl bg-[#132347] hover:bg-[#182C5A] border border-[#1E3563] text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.useMyLocation}</span>
              </button>
              
              <button
                onClick={() => setIsNearbyModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#132347] hover:bg-[#182C5A] border border-[#1E3563] text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Bus className="w-3.5 h-3.5 text-sky-400" />
                <span>{t.nearbyStops}</span>
              </button>
            </div>
          </div>

          {/* Hero Right: 3 Interactive Feature Badges */}
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab && onNavigateTab('track')}
              className="p-3.5 rounded-2xl bg-[#0D1B36]/80 hover:bg-[#132347] backdrop-blur-md border border-[#1E3563] hover:border-amber-400/50 flex items-center gap-3 shadow-md transition-all text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white tracking-wide block">
                  {t.realTimeTracking}
                </span>
                <span className="text-[10px] text-amber-300">Live GPS Radar →</span>
              </div>
            </button>

            <button
              onClick={() => onOpenLiveCam(selectedVehicle)}
              className="p-3.5 rounded-2xl bg-[#0D1B36]/80 hover:bg-[#132347] backdrop-blur-md border border-[#1E3563] hover:border-sky-400/50 flex items-center gap-3 shadow-md transition-all text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-400/20 text-sky-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white tracking-wide block">
                  {t.crowdPrediction}
                </span>
                <span className="text-[10px] text-sky-300">Privacy Cam Feed →</span>
              </div>
            </button>

            <button
              onClick={onOpenHelp}
              className="p-3.5 rounded-2xl bg-[#0D1B36]/80 hover:bg-[#132347] backdrop-blur-md border border-[#1E3563] hover:border-emerald-400/50 flex items-center gap-3 shadow-md transition-all text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white tracking-wide block">
                  {t.safeAccessible}
                </span>
                <span className="text-[10px] text-emerald-300">Request Assistance →</span>
              </div>
            </button>
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
              <button
                onClick={() => onNavigateTab && onNavigateTab('journeys')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300"
              >
                Plan Any Route →
              </button>
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
                <Compass className="w-3 h-3" />
                {t.alternative}
              </button>
            </div>

            {/* Dynamic Journey Plan Result Cards */}
            <div className="flex flex-col gap-3">
              {activePlan ? (
                activePlan.legs.map((leg, idx) => {
                  const targetVehicle = vehicles.find(v => v.id === leg.vehicle_id) || vehicles[0];

                  return (
                    <div
                      key={idx}
                      onClick={() => onSelectVehicle(targetVehicle)}
                      className="p-3.5 rounded-xl bg-[#09152B] border border-[#1E3563] hover:border-slate-500 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
                          <Bus className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white">{leg.departure_in_minutes} {t.min}</span>
                            <span className="text-[11px] text-slate-400">• Arrives in {leg.arrival_in_minutes} min</span>
                          </div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            {leg.vehicle_name} (Route {leg.route_number})
                          </span>
                          <div className="text-xs text-slate-300 mt-1">
                            <span>{t.board}: {leg.from_stop_name}</span> • <span>{t.drop}: {leg.to_stop_name}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">🚶 {leg.walk_to_stop_minutes} {t.min} {t.walk}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">Loading live journey options...</div>
              )}

              {/* Differential Note for Crowd Comparison */}
              {activePlan?.crowd_differential_note && (
                <div className="p-2.5 rounded-lg bg-sky-950/70 border border-sky-500/30 text-[11px] text-sky-200">
                  💡 {activePlan.crowd_differential_note}
                </div>
              )}
            </div>

            {/* Big Pink/Crimson Gradient CTA: Track This Journey */}
            <button
              onClick={() => {
                if (onNavigateTab) onNavigateTab('track');
              }}
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
                onClick={handleRefresh}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                title="Refresh live telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
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
                userLocation={userLocation}
                onUserLocationChange={onUserLocationChange}
                showFollowToggle={false}
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

      {/* Nearby Stops Modal */}
      <NearbyStopsModal
        isOpen={isNearbyModalOpen}
        onClose={() => setIsNearbyModalOpen(false)}
        stops={stops}
        vehicles={vehicles}
        routes={routes}
        userLocation={userLocation}
        language={language}
        onSelectStopAsOrigin={(stopId) => {
          setOriginStop(stopId);
          setLocationToast('Origin updated from selected stop.');
        }}
        onSelectVehicle={(v) => {
          onSelectVehicle(v);
          if (onNavigateTab) onNavigateTab('track');
        }}
      />

    </div>
  );
};
