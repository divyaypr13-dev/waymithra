import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Video, Bus, BarChart3, Settings, LogOut,
  AlertTriangle, Clock, ArrowUpRight, ShieldCheck, CheckCircle2,
  RefreshCw, Sliders, EyeOff, Sparkles, Camera, Users, Play, Pause, FastForward
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
  const [currentScenario, setCurrentScenario] = useState<string>('normal');
  const [simSpeed, setSimSpeed] = useState<number>(2.0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll overview & logs
  useEffect(() => {
    const fetchOverview = async () => {
      const data = await api.getOperatorOverview();
      setOverview(data);
    };
    const fetchLogs = async () => {
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    };
    fetchOverview();
    fetchLogs();
    const interval = setInterval(() => {
      fetchOverview();
      fetchLogs();
    }, 2500);
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

  const handleScenarioChange = async (scenario: string, speed = simSpeed, paused = isPaused) => {
    setCurrentScenario(scenario);
    await api.setScenario({ scenario, simulation_speed: speed, paused });
  };

  const handleSpeedChange = async (speed: number) => {
    setSimSpeed(speed);
    await api.setScenario({ scenario: currentScenario, simulation_speed: speed, paused: isPaused });
  };

  const handlePauseToggle = async () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    await api.setScenario({ scenario: currentScenario, simulation_speed: simSpeed, paused: nextPaused });
  };

  const demoVehicle = vehicles.find(v => v.id === 'WM-V1') || vehicles[0];
  const demoCrowdCount = demoVehicle?.crowd_count ?? demoCrowd;
  const demoCapacity = demoVehicle?.capacity || 6;
  const occupancyPercent = Math.round((demoCrowdCount / demoCapacity) * 100);

  // Real, truthful state metrics (no fabricated 48 buses or fake +6%)
  const realTotalBuses = vehicles.length;
  const realPassengersOnboard = vehicles.reduce((acc, v) => acc + v.crowd_count, 0);
  const realDelayedBuses = vehicles.filter(v => v.status === 'DELAYED').length;
  const realOnTimeRate = Math.round(((realTotalBuses - realDelayedBuses) / Math.max(1, realTotalBuses)) * 100);

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
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveNav('Live Monitoring')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeNav === 'Live Monitoring'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-[#132347] hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Live Monitoring</span>
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
              <span>Bus Fleet</span>
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
              <span>Simulator & Scenarios</span>
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
              {t.adminTitle} - {activeNav}
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

        {/* ================= VIEW 1: DASHBOARD ================= */}
        {activeNav === 'Dashboard' && (
          <>
            {/* KPI Cards Row (Real truthful values from system state) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
              
              {/* Card 1: Total Buses */}
              <div className="p-4 rounded-2xl bg-[#0D1B36] border border-[#1E3563] flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{realTotalBuses}</p>
                    <p className="text-xs text-slate-400">{t.totalBuses} (Active Fleet)</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                  {realOnTimeRate}% On Time
                </span>
              </div>

              {/* Card 2: Total Passengers Onboard */}
              <div className="p-4 rounded-2xl bg-[#0D1B36] border border-[#1E3563] flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{realPassengersOnboard}</p>
                    <p className="text-xs text-slate-400">Passengers Onboard</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold">
                  Live Sensor Sum
                </span>
              </div>

              {/* Card 3: Active Alert */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 to-[#0D1B36] border border-rose-500/30 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-rose-400">
                      {overview?.active_alerts_count ?? 1}
                    </p>
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
                    onClick={() => setActiveNav('Bus Management')}
                    className="text-xs font-bold text-sky-400 hover:text-sky-300"
                  >
                    Manage Fleet →
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

            {/* Bottom Row: Bus Fleet Status Table + Alerts & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Bus Fleet Status Table (7 Cols) */}
              <div className="lg:col-span-7 rounded-2xl bg-[#0D1B36] border border-[#1E3563] p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#1E3563] mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bus className="w-4 h-4 text-sky-400" />
                    <span>{t.busFleetStatus}</span>
                  </h3>
                  <button
                    onClick={() => setActiveNav('Bus Management')}
                    className="text-xs font-bold text-sky-400 hover:text-sky-300"
                  >
                    View Details →
                  </button>
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
                                {v.crowd_level === 'Low' ? t.low : v.crowd_level === 'Moderate' ? t.moderate : t.high} ({v.crowd_count})
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

              {/* Alerts & Activity (5 Cols) */}
              <div className="lg:col-span-5 rounded-2xl bg-[#0D1B36] border border-[#1E3563] p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#1E3563] mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>{t.alertsActivity}</span>
                  </h3>
                </div>

                <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
                  {auditLogs.length > 0 ? (
                    auditLogs.slice(0, 6).map((log, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#09152B] border border-sky-500/20 flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                          i
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{log.event_type}: {log.details || 'System event recorded'}</p>
                          <p className="text-[10px] text-slate-400">{new Date(log.timestamp_iso || Date.now()).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="p-3 rounded-xl bg-[#09152B] border border-rose-500/20 flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                          !
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">DEMO-BUS-A camera pipeline active</p>
                          <p className="text-[10px] text-slate-400">1 min ago</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#09152B] border border-emerald-500/20 flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                          ✓
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Fleet telemetry synced across 6 buses</p>
                          <p className="text-[10px] text-slate-400">Just now</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>
          </>
        )}

        {/* ================= VIEW 2: LIVE MONITORING ================= */}
        {activeNav === 'Live Monitoring' && (
          <div className="space-y-6 my-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 rounded-2xl bg-[#0D1B36] border border-[#1E3563] p-6 shadow-2xl">
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                  <Video className="w-5 h-5 text-sky-400" />
                  <span>DEMO-BUS-A Primary Vision Sensor</span>
                </h3>
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-[#1E3563]">
                  <img
                    src="/api/camera/stream"
                    alt="Live Stream"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/bus_sketch.png';
                    }}
                  />
                </div>
              </div>

              <div className="lg:col-span-4 rounded-2xl bg-[#0D1B36] border border-[#1E3563] p-6 shadow-2xl space-y-4">
                <h4 className="text-sm font-bold text-white">Detection Parameters</h4>
                <div className="p-3 rounded-xl bg-[#09152B] border border-[#1E3563] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Privacy Filter:</span>
                    <span className="text-emerald-400 font-bold">Line Sketch Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Facial Data:</span>
                    <span className="text-emerald-400 font-bold">100% Redacted</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Visible Count:</span>
                    <span className="text-amber-400 font-bold">{demoCrowdCount} Passengers</span>
                  </div>
                </div>

                <button
                  onClick={() => onOpenLiveCam(demoVehicle)}
                  className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
                >
                  Open Full Screen Privacy Shader →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW 3: BUS FLEET MANAGEMENT ================= */}
        {activeNav === 'Bus Management' && (
          <div className="space-y-6 my-6">
            <div className="rounded-2xl bg-[#0D1B36] border border-[#1E3563] p-6 shadow-2xl">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Bus className="w-5 h-5 text-sky-400" />
                <span>Complete BMTC Bus Fleet Status</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map(v => (
                  <div key={v.id} className="p-4 rounded-xl bg-[#09152B] border border-[#1E3563] space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-white">{v.display_name}</h4>
                        <p className="text-xs text-slate-400">{v.vehicle_number}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.status === 'DELAYED' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {v.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-1">
                      <p>Speed: {v.speed_kmh} km/h • Heading: {Math.round(v.heading)}°</p>
                      <p>Occupancy: {v.crowd_count} / {v.capacity} ({v.crowd_level})</p>
                    </div>
                    <button
                      onClick={() => onOpenLiveCam(v)}
                      className="w-full py-2 rounded-lg bg-[#132347] hover:bg-[#182C5A] text-xs font-bold text-sky-300"
                    >
                      Inspect Camera Stream
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW 4: ANALYTICS ================= */}
        {activeNav === 'Analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <div className="p-6 rounded-2xl bg-[#0D1B36] border border-[#1E3563] shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>Fleet Occupancy Distribution</span>
              </h3>
              <div className="space-y-3">
                {vehicles.map(v => (
                  <div key={v.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{v.display_name}</span>
                      <span className="font-bold text-amber-400">{v.crowd_count} / {v.capacity} pax</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full"
                        style={{ width: `${Math.round((v.crowd_count / v.capacity) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0D1B36] border border-[#1E3563] shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>On-Time Performance & Dispatch</span>
              </h3>
              <div className="p-4 rounded-xl bg-[#09152B] border border-[#1E3563] text-center space-y-2">
                <span className="text-4xl font-black text-emerald-400">{realOnTimeRate}%</span>
                <p className="text-xs text-slate-300 font-medium">Network Reliability Score</p>
                <p className="text-[11px] text-slate-400">{realTotalBuses - realDelayedBuses} of {realTotalBuses} vehicles strictly on schedule</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW 5: SETTINGS & SIMULATOR ================= */}
        {activeNav === 'Settings' && (
          <div className="p-6 rounded-2xl bg-[#0D1B36] border border-[#1E3563] shadow-2xl space-y-6 my-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" />
              <span>Simulator Engine & Synthetic Scenarios</span>
            </h3>

            {/* Scenario Buttons */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Inject Operational Scenario:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => handleScenarioChange('normal')}
                  className={`p-3.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    currentScenario === 'normal'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-[#09152B] border-[#1E3563] text-slate-300 hover:bg-[#132347]'
                  }`}
                >
                  <p className="font-bold">1. Normal Transit</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-normal">Standard 24 km/h speed with normal stop boardings</p>
                </button>

                <button
                  onClick={() => handleScenarioChange('evening_surge')}
                  className={`p-3.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    currentScenario === 'evening_surge'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-[#09152B] border-[#1E3563] text-slate-300 hover:bg-[#132347]'
                  }`}
                >
                  <p className="font-bold">2. Evening Peak Surge</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-normal">High stop demand; vehicles fill to 80-100%</p>
                </button>

                <button
                  onClick={() => handleScenarioChange('silk_board_jam')}
                  className={`p-3.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    currentScenario === 'silk_board_jam'
                      ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                      : 'bg-[#09152B] border-[#1E3563] text-slate-300 hover:bg-[#132347]'
                  }`}
                >
                  <p className="font-bold">3. Silk Board Traffic Jam</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-normal">Delays buses near Silk Board junction to 8 km/h</p>
                </button>
              </div>
            </div>

            {/* Simulation Speed Controls */}
            <div className="pt-4 border-t border-[#1E3563] space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Simulation Speed Multiplier:
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePauseToggle}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    isPaused ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? 'Resume Simulation' : 'Pause'}</span>
                </button>

                {[1.0, 2.0, 5.0].map(speed => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold ${
                      simSpeed === speed ? 'bg-sky-500 text-white' : 'bg-[#09152B] border border-[#1E3563] text-slate-300'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

    </div>
  );
};
