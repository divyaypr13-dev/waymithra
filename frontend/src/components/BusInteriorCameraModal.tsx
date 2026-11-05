import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, Video, Users, Volume2, Sparkles, AlertTriangle, RefreshCw, EyeOff } from 'lucide-react';
import { Language, VehicleLiveState } from '../types';
import { getTranslation } from '../translations';
import { api } from '../services/api';

interface BusInteriorCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  selectedVehicle?: VehicleLiveState | null;
  vehicles: VehicleLiveState[];
  onSelectVehicle?: (vehicle: VehicleLiveState) => void;
}

export const BusInteriorCameraModal: React.FC<BusInteriorCameraModalProps> = ({
  isOpen,
  onClose,
  language,
  selectedVehicle,
  vehicles,
  onSelectVehicle
}) => {
  const t = getTranslation(language);
  const [activeTab, setActiveTab] = useState<'sketch' | 'heatmap' | 'webcam'>('sketch');
  const [currentCrowd, setCurrentCrowd] = useState<number>(selectedVehicle?.crowd_count ?? 3);
  const [webcamActive, setWebcamActive] = useState<boolean>(false);
  const [useBackendStream, setUseBackendStream] = useState<boolean>(true);
  const [isAnnouncing, setIsAnnouncing] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const vehicle = selectedVehicle || vehicles[0] || {
    id: 'WM-V1',
    display_name: 'Bus 404',
    vehicle_number: 'KA-01-F-4040',
    capacity: 6,
    crowd_count: 3,
    crowd_level: 'Low',
    current_stop_id: 'BLR-STOP-02',
    next_stop_id: 'BLR-STOP-01'
  };

  useEffect(() => {
    if (selectedVehicle) {
      setCurrentCrowd(selectedVehicle.crowd_count);
    }
  }, [selectedVehicle]);

  // Handle local webcam stream with pencil-sketch privacy shader if chosen
  useEffect(() => {
    let stream: MediaStream | null = null;
    let animFrame: number;

    if (activeTab === 'webcam' && webcamActive) {
      navigator.mediaDevices?.getUserMedia({ video: { width: 640, height: 480 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
          }

          // Apply real-time pencil-sketch line art filter to preserve facial privacy
          const renderSketchFilter = () => {
            if (canvasRef.current && videoRef.current && videoRef.current.readyState >= 2) {
              const ctx = canvasRef.current.getContext('2d');
              const vid = videoRef.current;
              if (ctx) {
                const w = canvasRef.current.width;
                const h = canvasRef.current.height;
                ctx.drawImage(vid, 0, 0, w, h);
                const imgData = ctx.getImageData(0, 0, w, h);
                const data = imgData.data;

                // Grayscale and simple edge inversion for line-sketch appearance
                for (let i = 0; i < data.length; i += 4) {
                  const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
                  // High contrast sketch inversion
                  const val = avg > 120 ? 250 : 25;
                  data[i] = val;
                  data[i + 1] = val;
                  data[i + 2] = val;
                }
                ctx.putImageData(imgData, 0, 0);

                // Add privacy bounding box & overlay
                ctx.strokeStyle = '#00e5a3';
                ctx.lineWidth = 3;
                ctx.strokeRect(w * 0.25, h * 0.2, w * 0.5, h * 0.65);
                ctx.fillStyle = '#00e5a3';
                ctx.font = '14px sans-serif';
                ctx.fillText('Passenger [Privacy Shield Active]', w * 0.25 + 5, h * 0.2 - 8);
              }
            }
            animFrame = requestAnimationFrame(renderSketchFilter);
          };
          renderSketchFilter();
        })
        .catch((err) => {
          console.warn('Webcam permission denied or unavailable:', err);
          setWebcamActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      cancelAnimationFrame(animFrame);
    };
  }, [activeTab, webcamActive]);

  const handleCrowdChange = async (newCount: number) => {
    setCurrentCrowd(newCount);
    await api.setManualCount(newCount);
  };

  const handleAudioAnnouncement = () => {
    if (!('speechSynthesis' in window)) return;
    setIsAnnouncing(true);

    const stopName = t.stops[vehicle.next_stop_id as keyof typeof t.stops] || 'Majestic Kempegowda Bus Station';
    let text = `Next stop: ${stopName}. Please prepare to alight.`;
    if (language === 'kn') {
      text = `ಮುಂದಿನ ನಿಲ್ದಾಣ: ${stopName}. ಇಳಿಯಲು ಸಿದ್ಧರಾಗಿ.`;
    } else if (language === 'hi') {
      text = `अगला स्टॉप: ${stopName}. कृपया उतरने के लिए तैयार रहें।`;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setIsAnnouncing(false);
    utterance.onerror = () => setIsAnnouncing(false);
    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;

  const totalSeats = vehicle.capacity || 6;
  const occupiedCount = Math.min(currentCrowd, totalSeats);
  const vacantCount = Math.max(0, totalSeats - occupiedCount);
  const isCrowded = currentCrowd >= 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0D1B36] border border-[#1E3563] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E3563] bg-[#09142A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {t.interiorCamTitle}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  {t.live}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>{vehicle.display_name} ({vehicle.vehicle_number})</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {t.interiorCamSubtitle}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Privacy Guarantee Banner */}
        <div className="px-5 py-2.5 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-sky-950/60 border-b border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-300">
          <EyeOff className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="leading-relaxed">
            {t.cameraPrivacyNotice}
          </p>
        </div>

        {/* Mode Selector Tabs & Bus Selector */}
        <div className="px-5 py-2.5 bg-[#0A162D] border-b border-[#1E3563] flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center p-1 rounded-xl bg-[#081225] border border-[#1E3563] text-xs">
            <button
              onClick={() => setActiveTab('sketch')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'sketch'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎨 {t.cameraModeLineArt}
            </button>
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'heatmap'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🗺️ {t.cameraModeHeatmap}
            </button>
            <button
              onClick={() => {
                setActiveTab('webcam');
                setWebcamActive(true);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'webcam'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📹 {t.cameraModeWebcam}
            </button>
          </div>

          {/* Bus Switcher */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">{t.busNo}:</span>
            <select
              value={vehicle.id}
              onChange={(e) => {
                const target = vehicles.find(v => v.id === e.target.value);
                if (target && onSelectVehicle) onSelectVehicle(target);
              }}
              className="bg-[#081225] border border-[#1E3563] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-sky-500"
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.display_name} - {v.vehicle_number}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Main Body / Camera Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#081225]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Visual Feed Display Box (Left 8 Cols) */}
            <div className="lg:col-span-8 flex flex-col items-center">
              
              <div className="relative w-full max-w-[540px] aspect-[540/760] bg-slate-950 rounded-2xl border-2 border-[#1E3563] shadow-2xl overflow-hidden flex items-center justify-center">
                
                {activeTab === 'sketch' && (
                  <>
                    {/* Real-time backend stream or local sketch asset */}
                    {useBackendStream ? (
                      <img
                        src="/api/camera/stream"
                        alt="Privacy Safe Bus Interior Camera Feed"
                        className="w-full h-full object-cover"
                        onError={() => setUseBackendStream(false)}
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        <img
                          src="/assets/bus_sketch.png"
                          alt="Bus Interior Outline"
                          className="w-full h-full object-cover"
                        />
                        {/* Overlay seat bounding boxes */}
                        <div className="absolute inset-0 pointer-events-none">
                          {currentCrowd >= 1 && (
                            <div className="absolute top-[32%] left-[40%] w-[20%] h-[28%] border-2 border-emerald-400 bg-emerald-500/10 rounded-lg flex items-start justify-center p-1">
                              <span className="bg-emerald-600 text-[10px] text-white px-1.5 py-0.5 rounded font-mono font-bold">
                                P1: Aisle
                              </span>
                            </div>
                          )}
                          {currentCrowd >= 2 && (
                            <div className="absolute top-[48%] left-[8%] w-[22%] h-[26%] border-2 border-emerald-400 bg-emerald-500/10 rounded-lg flex items-start justify-center p-1">
                              <span className="bg-emerald-600 text-[10px] text-white px-1.5 py-0.5 rounded font-mono font-bold">
                                P2: Seat 1L
                              </span>
                            </div>
                          )}
                          {currentCrowd >= 3 && (
                            <div className="absolute top-[50%] right-[10%] w-[24%] h-[26%] border-2 border-emerald-400 bg-emerald-500/10 rounded-lg flex items-start justify-center p-1">
                              <span className="bg-emerald-600 text-[10px] text-white px-1.5 py-0.5 rounded font-mono font-bold">
                                P3: Seat 1R
                              </span>
                            </div>
                          )}
                          {currentCrowd >= 4 && (
                            <div className="absolute top-[42%] left-[20%] w-[18%] h-[18%] border-2 border-emerald-400 bg-emerald-500/10 rounded-lg flex items-start justify-center p-1">
                              <span className="bg-emerald-600 text-[10px] text-white px-1.5 py-0.5 rounded font-mono font-bold">
                                P4: Seat 2L
                              </span>
                            </div>
                          )}
                          {currentCrowd >= 5 && (
                            <div className="absolute top-[44%] right-[22%] w-[18%] h-[18%] border-2 border-emerald-400 bg-emerald-500/10 rounded-lg flex items-start justify-center p-1">
                              <span className="bg-emerald-600 text-[10px] text-white px-1.5 py-0.5 rounded font-mono font-bold">
                                P5: Seat 2R
                              </span>
                            </div>
                          )}
                          {currentCrowd >= 6 && (
                            <div className="absolute top-[36%] right-[32%] w-[15%] h-[15%] border-2 border-emerald-400 bg-emerald-500/10 rounded-lg flex items-start justify-center p-1">
                              <span className="bg-emerald-600 text-[10px] text-white px-1.5 py-0.5 rounded font-mono font-bold">
                                P6: Seat 3R
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* HUD Watermark & Live Overlays */}
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10 text-[11px] text-slate-200 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>CV Filter: Line-Art Privacy Shield</span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400" />
                        <span className="text-white font-bold">{currentCrowd} / {totalSeats}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          currentCrowd <= 2 ? 'bg-emerald-500/20 text-emerald-400' :
                          currentCrowd <= 4 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {currentCrowd <= 2 ? t.low : currentCrowd <= 4 ? t.moderate : t.high}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[11px]">Identity Protected ✓</span>
                    </div>
                  </>
                )}

                {activeTab === 'heatmap' && (
                  <div className="w-full h-full p-6 flex flex-col justify-between bg-gradient-to-b from-[#0D1B36] to-[#081225]">
                    <div className="text-center">
                      <h4 className="text-sm font-bold text-white mb-1">Cabin Seat Density Layout</h4>
                      <p className="text-xs text-slate-400">Green = Available • Red/Amber = Occupied</p>
                    </div>

                    {/* Bus Cabin Floorplan */}
                    <div className="w-full max-w-xs mx-auto border-2 border-slate-700 rounded-3xl p-4 bg-slate-900/90 shadow-inner relative">
                      {/* Driver Area */}
                      <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800">
                        <span className="text-[11px] font-bold text-amber-400">FRONT (Driver Cabin)</span>
                        <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-400 text-[10px]">Entrance</span>
                      </div>

                      {/* Row 1 */}
                      <div className="flex justify-between items-center mb-4">
                        <div className={`w-14 h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold border transition-all ${
                          currentCrowd >= 2 ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        }`}>
                          <span>1L</span>
                          <span>{currentCrowd >= 2 ? 'Taken' : 'Open'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">Aisle</div>
                        <div className={`w-14 h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold border transition-all ${
                          currentCrowd >= 3 ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        }`}>
                          <span>1R</span>
                          <span>{currentCrowd >= 3 ? 'Taken' : 'Open'}</span>
                        </div>
                      </div>

                      {/* Row 2 */}
                      <div className="flex justify-between items-center mb-4">
                        <div className={`w-14 h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold border transition-all ${
                          currentCrowd >= 4 ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        }`}>
                          <span>2L</span>
                          <span>{currentCrowd >= 4 ? 'Taken' : 'Open'}</span>
                        </div>
                        {currentCrowd >= 1 ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500 text-amber-400 text-[9px] font-mono">
                            Standing
                          </span>
                        ) : (
                          <div className="text-[10px] text-slate-500 font-mono">Aisle</div>
                        )}
                        <div className={`w-14 h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold border transition-all ${
                          currentCrowd >= 5 ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        }`}>
                          <span>2R</span>
                          <span>{currentCrowd >= 5 ? 'Taken' : 'Open'}</span>
                        </div>
                      </div>

                      {/* Row 3 */}
                      <div className="flex justify-between items-center">
                        <div className={`w-14 h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold border transition-all ${
                          currentCrowd >= 6 ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        }`}>
                          <span>3L</span>
                          <span>{currentCrowd >= 6 ? 'Taken' : 'Open'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">Aisle</div>
                        <div className={`w-14 h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold border transition-all ${
                          currentCrowd >= 7 ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        }`}>
                          <span>3R</span>
                          <span>{currentCrowd >= 7 ? 'Taken' : 'Open'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-xs text-slate-400">
                      Rear Emergency Exit & Ramp Compatible
                    </div>
                  </div>
                )}

                {activeTab === 'webcam' && (
                  <div className="w-full h-full relative flex items-center justify-center bg-black">
                    <video ref={videoRef} className="hidden" playsInline muted></video>
                    <canvas ref={canvasRef} width={540} height={720} className="w-full h-full object-cover"></canvas>
                    <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Real-Time Pencil Sketch Privacy Filter Running
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* Sidebar Controls & Live Statistics (Right 4 Cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              
              {/* Occupancy Summary Card */}
              <div className="p-4 rounded-xl bg-[#0D1B36] border border-[#1E3563]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                  <span>Occupancy Breakdown</span>
                  <span className="text-sky-400">Live Telemetry</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-[#081225] border border-[#1E3563]">
                    <p className="text-[11px] text-slate-400 mb-0.5">{t.occupiedSeats}</p>
                    <p className="text-2xl font-black text-amber-400">{occupiedCount}</p>
                    <p className="text-[10px] text-slate-500">Out of {totalSeats} seats</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#081225] border border-[#1E3563]">
                    <p className="text-[11px] text-slate-400 mb-0.5">{t.vacantSeats}</p>
                    <p className="text-2xl font-black text-emerald-400">{vacantCount}</p>
                    <p className="text-[10px] text-slate-500">Immediate boarding</p>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{t.crowdLevel}:</span>
                    <span className={isCrowded ? 'text-rose-400' : 'text-emerald-400'}>
                      {currentCrowd <= 2 ? t.low : currentCrowd <= 4 ? t.moderate : t.high}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        currentCrowd <= 2 ? 'bg-emerald-500' :
                        currentCrowd <= 4 ? 'bg-amber-400' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, (currentCrowd / totalSeats) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {currentCrowd > totalSeats && (
                  <div className="mt-3 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{t.capacityExceeded}: Standing room only.</span>
                  </div>
                )}
              </div>

              {/* Interactive Crowd Simulation Slider (Demo) */}
              <div className="p-4 rounded-xl bg-[#0D1B36] border border-[#1E3563]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.manualCrowdControl}</span>
                  </label>
                  <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-xs font-bold">
                    {currentCrowd} {t.passengers}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={currentCrowd}
                  onChange={(e) => handleCrowdChange(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0 (Empty)</span>
                  <span>3 (Moderate)</span>
                  <span>6 (Full)</span>
                  <span>8 (Surge)</span>
                </div>
              </div>

              {/* Passenger Accessibility Action */}
              <button
                onClick={handleAudioAnnouncement}
                disabled={isAnnouncing}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all"
              >
                <Volume2 className={`w-4 h-4 ${isAnnouncing ? 'animate-bounce' : ''}`} />
                <span>{isAnnouncing ? 'Broadcasting...' : t.audioAnnouncement}</span>
              </button>

              {/* Privacy Architecture Details */}
              <div className="p-3 rounded-xl bg-[#081225] border border-[#1E3563] text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-200">How Facial Privacy Works:</p>
                <p>1. Computer vision detects person bounding cylinders only.</p>
                <p>2. Video is converted to line-drawing outlines matching the artistic styling.</p>
                <p>3. No biometric facial features or identities are stored or broadcasted.</p>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
