import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Video, Bus, BarChart3, Settings, LogOut,
  AlertTriangle, Clock, ArrowUpRight, ShieldCheck, CheckCircle2,
  RefreshCw, Sliders, EyeOff, Sparkles, Camera, Users
} from 'lucide-react';
import {
  VehicleLiveState, Stop, Route, Language, OperatorOverview
} from '../types';
import { getTranslation } from '../translations';
import { MapView } from './MapView';
import { api } from '../services/api';

interface AdminDashboardProps {
  stops: Stop[];
  routes: Route[];
  vehicles: VehicleLiveState[];
  selectedVehicle: VehicleLiveState;
  onSelectVehicle: (vehicle: VehicleLiveState) => void;
  onOpenLiveCam: (vehicle: VehicleLiveState) => void;
  language: Language;
  onSwitchToUser: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stops,
  routes,
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  onOpenLiveCam,
  language,
  onSwitchToUser
}) => {
  const t = getTranslation(language);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [overview, setOverview] = useState<OperatorOverview | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [demoCrowd, setDemoCrowd] = useState(3);
  const [webcamEnabled, setWebcamEnabled] = useState(false);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll overview
  useEffect(() => {
    const fetchOverview = async () => {
      const data = await api.getOperatorOverview();
      setOverview(data);
    };
    fetchOverview();
    const interval = setInterval(fetchOverview, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCrowdSlider = async (val: number) => {
    setDemoCrowd(val);
    await api.setManualCount(val);
  };

  const handleToggleWebcam = async () => {
    const nextState = !webcamEnabled;
    const res = await api.toggleWebcam(nextState);
    setWebcamEnabled(res.webcam_enabled);
  };

  const demoVehicle = vehicles.find(v => v.id === 'WM-V1') || vehicles[0];
  const demoCrowdCount = demoVehicle?.crowd_count ?? demoCrowd;
  const demoCapacity = demoVehicle?.capacity || 6;
  const occupancyPercent = Math.round((demoCrowdCount / demoCapacity) * 100);

  return (
    <div className="w-full flex min-h-[calc(100vh-65px)] bg-[#081225] text-slate-100">
      
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#0A162D] border-r border-[#1E3563] p-4 hidden md:flex flex-col justify-between shrink-0">
        <div>
          {/* Brand In Sidebar */}
          <div className="flex items-center gap-2.5 px-3 py-3 mb-6 border-b border-[#1E3563]">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <Bus className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-extrabold text-white">Way</span>
              <span className="text-base font-extrabold text-amber-400 ml-1">ಮಿತ್ರ</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveNav('Dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeNav === 'Dashboard'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'text-slate-300 hover:bg-[#132347] hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t.home}</span>
            </button>

            <button
              onClick={() => {
                setActiveNav('Live Monitoring');
                onOpenLiveCam(demoVehicle);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeNav === 'Live Monitoring'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-[#132347] hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>{t.liveCameraFeed}</span>
            </button>

            <button
              onClick={() => setActiveNav('Bus Management')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeNav === 'Bus Management'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-[#132347] hover:text-white'
              }`}
            >
              <Bus className="w-4 h-4" />
              <span>{t.busFleetStatus}</span>
            </button>

            <button
              onClick={() => setActiveNav('Analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeNav === 'Analytics'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-[#132347] hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveNav('Settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeNav === 'Settings'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-[#132347] hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Bottom Switcher & Silhouette */}
        <div>
          <button
            onClick={onSwitchToUser}
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors mb-4"
          >
            <LogOut className="w-4 h-4 text-amber-400" />
            <span>Switch to {t.userMode}</span>
          </button>

          {/* Vidhana Soudha Artwork silhouette note */}
          <div className="p-3 rounded-xl bg-[#081225] border border-[#1E3563] text-center">
            <p className="text-[11px] font-bold text-amber-400">🏛️ Namma Bengaluru</p>
            <p className="text-[10px] text-slate-400">Smart Transit Control System</p>
          </div>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1E3563]">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {t.adminTitle}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {t.adminSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {t.systemOnline}
            </span>
          </div>
        </div>

        {/* KPI Cards Row (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          
          {/* Card 1: Total Buses */}
          <div className="p-4 rounded-2xl bg-[#0D1B36] border border-[#1E3563] flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">48</p>
                <p className="text-xs text-slate-400">{t.totalBuses}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              +2
            </span>
          </div>

          {/* Card 2: Total Passengers */}
          <div className="p-4 rounded-2xl bg-[#0D1B36] border border-[#1E3563] flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">2,850</p>
                <p className="text-xs text-slate-400">{t.totalPassengers}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              +6%
            </span>
          </div>

          {/* Card 3: Active Alert */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 to-[#0D1B36] border border-rose-500/30 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-rose-400">1</p>
                <p className="text-xs text-slate-400">{t.activeAlerts}</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Card 4: Live Clock */}
          <div className="p-4 rounded-2xl bg-[#0D1B36] border border-[#1E3563] flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[11px] text-slate-400">
                  {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Middle Row: Camera Feed (4 Cols) + Crowd Status (3 Cols) + Bus Locations Map (5 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-6">
          
          {/* Live Camera Feed - DEMO-BUS-A (4 Cols) */}
          <div className="lg:col-span-4 rounded-2xl bg-[#0D1B36] border border-[#1E3563] p-5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3563] mb-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Camera Feed – DEMO-BUS-A
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                {t.live}
              </span>
            </div>

            {/* Video Viewport: Privacy Sketch Feed */}
            <div
              onClick={() => onOpenLiveCam(demoVehicle)}
              className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border border-[#1E3563] cursor-pointer group shadow-inner flex items-center justify-center"
              title="Click to expand privacy camera"
            >
              <img
                src="/api/camera/stream"
                alt="Bus 404 Live Feed"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/bus_sketch.png';
                }}
              />
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 backdrop-blur-md text-emerald-400 text-[11px] font-mono font-bold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>{demoCrowdCount} People</span>
              </div>
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-slate-300 font-mono">
                {currentTime.toLocaleTimeString()}
              </div>
            </div>

            {/* Demo Controls: Crowd Slider & Webcam Toggle */}
            <div className="mt-4 pt-3 border-t border-[#1E3563] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {t.manualCrowdControl}
                </span>
                <span className="font-bold text-amber-400">{demoCrowdCount} / 6</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                value={demoCrowdCount}
                onChange={(e) => handleCrowdSlider(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 cursor-pointer"
              />

              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={handleToggleWebcam}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-sky-400" />
                  <span>{webcamEnabled ? 'Disable Webcam' : t.enableWebcam}</span>
                </button>

                <button
                  onClick={() => api.resetCamera()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.resetSim}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Crowd Status Gauge (3 Cols) */}
          <div className="lg:col-span-3 rounded-2xl bg-[#0D1B36] border border-[#1E3563] p-5 shadow-xl flex flex-col items-center justify-between">
            <div className="w-full pb-3 border-b border-[#1E3563] mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {t.crowdStatus}
              </h3>
            </div>

            {/* Circular Gauge */}
            <div className="relative my-4 flex items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  stroke="#1E3563"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  stroke={occupancyPercent > 80 ? '#f43f5e' : occupancyPercent > 50 ? '#f59e0b' : '#10b981'}
                  strokeWidth="12"
                  strokeDasharray="351.8"
                  strokeDashoffset={351.8 - (351.8 * Math.min(100, occupancyPercent)) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute flex flex-col items-center text-center">
                <Users className="w-6 h-6 text-slate-300 mb-1" />
                <span className="text-lg font-black text-white">{demoCrowdCount} / {demoCapacity}</span>
                <span className="text-[11px] font-bold text-slate-400">({occupancyPercent}%)</span>
              </div>
            </div>

            <div className="text-center">
              <p className={`text-base font-extrabold ${
                occupancyPercent > 80 ? 'text-rose-400' : occupancyPercent > 50 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {occupancyPercent > 80 ? t.high : occupancyPercent > 50 ? t.moderate : t.low} {t.crowd}
              </p>
            </div>

            <div className="w-full mt-4 p-2.5 rounded-xl bg-[#081225] border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-[11px] leading-tight">Occupancy updated from camera ✓</span>
            </div>
          </div>

          {/* Bus Live Locations Map (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl bg-[#0D1B36] border border-[#1E3563] p-5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3563] mb-3">
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  {t.busLiveLocations}
                </h3>
              </div>
              <button
                onClick={() => onSelectVehicle(selectedVehicle)}
                className="text-xs font-bold text-sky-400 hover:text-sky-300"
              >
                {t.viewAll} →
              </button>
            </div>

            <div className="h-64 w-full rounded-xl overflow-hidden relative">
              <MapView
                stops={stops}
                routes={routes}
                vehicles={vehicles}
                selectedVehicle={selectedVehicle}
                onSelectVehicle={onSelectVehicle}
                language={language}
              />
            </div>
          </div>

        </div>

        {/* Bottom Row: Bus Fleet Status Table + Alerts & Activity + Safe & Smart Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Bus Fleet Status Table (6 Cols) */}
          <div className="lg:col-span-6 rounded-2xl bg-[#0D1B36] border border-[#1E3563] p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3563] mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bus className="w-4 h-4 text-sky-400" />
                <span>{t.busFleetStatus}</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E3563] text-slate-400 font-semibold">
                    <th className="pb-2.5">{t.busNo}</th>
                    <th className="pb-2.5">{t.route}</th>
                    <th className="pb-2.5">{t.status}</th>
                    <th className="pb-2.5">{t.crowd}</th>
                    <th className="pb-2.5">{t.eta}</th>
                    <th className="pb-2.5 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3563]/60">
                  {vehicles.map((v) => {
                    const isDelayed = v.status === 'DELAYED';
                    const route = routes.find(r => r.id === v.route_id);
                    return (
                      <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 font-bold text-white">{v.display_name}</td>
                        <td className="py-2.5 text-slate-300 max-w-[140px] truncate">
                          {route?.name || 'MG Road → Majestic'}
                        </td>
                        <td className="py-2.5">
                          <span className={`inline-flex items-center gap-1 font-semibold ${
                            isDelayed ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {isDelayed ? t.delayed : t.onTime}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            v.crowd_level === 'Low' ? 'bg-emerald-500/20 text-emerald-300' :
                            v.crowd_level === 'Moderate' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {v.crowd_level === 'Low' ? t.low : v.crowd_level === 'Moderate' ? t.moderate : t.high}
                          </span>
                        </td>
                        <td className="py-2.5 font-semibold text-slate-200">
                          {v.eta_next_stop_minutes} {t.min}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => onOpenLiveCam(v)}
                            className="px-2.5 py-1 rounded bg-sky-600/30 hover:bg-sky-600 text-sky-300 hover:text-white text-[11px] font-bold transition-colors"
                          >
                            {t.viewCam}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alerts & Activity (3 Cols) */}
          <div className="lg:col-span-3 rounded-2xl bg-[#0D1B36] border border-[#1E3563] p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3563] mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>{t.alertsActivity}</span>
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-xl bg-[#09152B] border border-rose-500/20 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  !
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Bus 210 - High Crowd Detected</p>
                  <p className="text-[10px] text-slate-400">2 min ago</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#09152B] border border-sky-500/20 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  i
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Camera online - DEMO-BUS-A</p>
                  <p className="text-[10px] text-slate-400">3 min ago</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#09152B] border border-emerald-500/20 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Bus 404 reached MG Road</p>
                  <p className="text-[10px] text-slate-400">5 min ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Safe & Smart Bengaluru Banner (3 Cols) */}
          <div className="lg:col-span-3 rounded-2xl bg-gradient-to-br from-rose-900/40 via-[#0D1B36] to-sky-950/40 border border-rose-500/30 p-5 shadow-xl flex flex-col justify-between">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-3 shadow-lg">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h4 className="text-base font-black text-white leading-tight">
                {t.safeSmartBanner}
              </h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Empowering BMTC passengers with live privacy-first crowd awareness and real-time accessibility.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-rose-500/20 flex items-center justify-center gap-2 text-xs font-bold text-amber-400">
              <span>Namma Bengaluru Transit</span>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
};
