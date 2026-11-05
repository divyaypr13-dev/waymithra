import React, { useState, useEffect } from 'react';
import { Language, AppMode, VehicleLiveState, Stop, Route } from './types';
import { Header } from './components/Header';
import { UserHome } from './components/UserHome';
import { AdminDashboard } from './components/AdminDashboard';
import { ConductorMode } from './components/ConductorMode';
import { BusInteriorCameraModal } from './components/BusInteriorCameraModal';
import { HelpRequestsModal } from './components/HelpRequestsModal';
import { Footer } from './components/Footer';
import { api } from './services/api';

export const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [mode, setMode] = useState<AppMode>('user');
  const [activeTab, setActiveTab] = useState<string>('home');
  
  const [stops, setStops] = useState<Stop[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [vehicles, setVehicles] = useState<VehicleLiveState[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleLiveState | null>(null);
  
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // Initial Data Load
  useEffect(() => {
    const initData = async () => {
      const [stopsData, routesData, vehiclesData] = await Promise.all([
        api.getStops(),
        api.getRoutes(),
        api.getVehicles()
      ]);
      setStops(stopsData);
      setRoutes(routesData);
      setVehicles(vehiclesData);
      if (vehiclesData.length > 0) {
        setSelectedVehicle(vehiclesData[0]);
      }
    };
    initData();
  }, []);

  // Real-time Vehicle Polling (every 2.5s)
  useEffect(() => {
    const interval = setInterval(async () => {
      const liveVehicles = await api.getVehicles();
      if (liveVehicles && liveVehicles.length > 0) {
        setVehicles(liveVehicles);
        setSelectedVehicle(prev => {
          if (!prev) return liveVehicles[0];
          const updated = liveVehicles.find(v => v.id === prev.id);
          return updated || prev;
        });
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const handleOpenLiveCam = (vehicle?: VehicleLiveState) => {
    if (vehicle) setSelectedVehicle(vehicle);
    setIsCameraModalOpen(true);
  };

  const defaultBus = selectedVehicle || vehicles[0] || {
    id: 'WM-V1',
    display_name: 'Bus 404',
    vehicle_number: 'KA-01-F-4040',
    capacity: 6,
    crowd_count: 3,
    crowd_level: 'Low',
    current_stop_id: 'BLR-STOP-02',
    next_stop_id: 'BLR-STOP-01',
    lat: 12.9756,
    lng: 77.6097,
    heading: 270,
    progress_between_stops: 0.35,
    status: 'ON_TIME',
    speed_kmh: 24,
    eta_next_stop_minutes: 2,
    capacity_exceeded: false,
    crowd_source: 'Simulated crowd observation',
    wheelchair_accessible: true,
    low_floor: true,
    ramp_available: true,
    audio_announcement: true,
    camera_feed_enabled: true,
    route_id: 'WM-1',
    is_demo_bus: true
  };

  return (
    <div className="min-h-screen bg-[#081225] flex flex-col selection:bg-amber-400 selection:text-slate-900">
      
      {/* Top Header with Language & Mode Selectors */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        mode={mode}
        onModeChange={setMode}
        onOpenHelp={() => setIsHelpModalOpen(true)}
      />

      {/* Main Viewport Content based on active mode */}
      <main className="flex-1">
        {mode === 'user' && (
          <UserHome
            stops={stops}
            routes={routes}
            vehicles={vehicles}
            selectedVehicle={defaultBus}
            onSelectVehicle={setSelectedVehicle}
            onOpenLiveCam={handleOpenLiveCam}
            language={language}
            onNavigateTab={setActiveTab}
          />
        )}

        {mode === 'admin' && (
          <AdminDashboard
            stops={stops}
            routes={routes}
            vehicles={vehicles}
            selectedVehicle={defaultBus}
            onSelectVehicle={setSelectedVehicle}
            onOpenLiveCam={handleOpenLiveCam}
            language={language}
            onSwitchToUser={() => setMode('user')}
          />
        )}

        {mode === 'conductor' && (
          <ConductorMode
            stops={stops}
            vehicles={vehicles}
            selectedVehicle={defaultBus}
            language={language}
          />
        )}
      </main>

      {/* Live Interior Privacy Camera Modal (Core feature matching user outline image) */}
      <BusInteriorCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        language={language}
        selectedVehicle={selectedVehicle}
        vehicles={vehicles}
        onSelectVehicle={setSelectedVehicle}
      />

      {/* Accessibility & SOS Modal */}
      <HelpRequestsModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        stops={stops}
        vehicles={vehicles}
        language={language}
      />

      {/* Bottom Floating Navigation Dock */}
      {mode === 'user' && (
        <Footer
          language={language}
          mode={mode}
          onModeChange={setMode}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenLiveCam={() => handleOpenLiveCam(defaultBus)}
        />
      )}

    </div>
  );
};

export default App;
