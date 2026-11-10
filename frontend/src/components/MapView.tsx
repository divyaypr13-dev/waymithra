import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Crosshair, Compass, Navigation, Bus, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { VehicleLiveState, Stop, Route, Language } from '../types';
import { getTranslation } from '../translations';

export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

interface MapViewProps {
  stops: Stop[];
  routes: Route[];
  vehicles: VehicleLiveState[];
  selectedVehicle?: VehicleLiveState | null;
  onSelectVehicle?: (vehicle: VehicleLiveState) => void;
  onOpenLiveCam?: (vehicle: VehicleLiveState) => void;
  language: Language;
  userLocation?: { lat: number; lng: number; accuracy?: number } | null;
  onUserLocationChange?: (loc: { lat: number; lng: number; accuracy?: number }) => void;
  onNearestStopFound?: (stop: Stop, distanceMeters: number) => void;
  showFollowToggle?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  stops,
  routes,
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  onOpenLiveCam,
  language,
  userLocation: propUserLocation,
  onUserLocationChange,
  onNearestStopFound,
  showFollowToggle = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polylineLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  
  const [internalUserLoc, setInternalUserLoc] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [followBus, setFollowBus] = useState<boolean>(false);
  
  const activeUserLoc = propUserLocation || internalUserLoc;
  const t = getTranslation(language);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      // Center on Bengaluru Central Transit Core
      const map = L.map(mapContainerRef.current, {
        center: [12.9716, 77.5946],
        zoom: 12,
        zoomControl: false,
        attributionControl: false
      });

      // Dark transit map tiles matching dark navy palette
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        opacity: 0.95
      }).addTo(map);

      polylineLayerGroupRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Locate User Function via Browser Geolocation API
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation not supported by your browser');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Acquiring real-time GPS location...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        const loc = { lat: latitude, lng: longitude, accuracy };
        setInternalUserLoc(loc);
        if (onUserLocationChange) {
          onUserLocationChange(loc);
        }

        // Find closest stop in network
        if (stops.length > 0) {
          let closestStop = stops[0];
          let minDistance = Infinity;

          stops.forEach((s) => {
            const dist = getDistanceMeters(latitude, longitude, s.lat, s.lng);
            if (dist < minDistance) {
              minDistance = dist;
              closestStop = s;
            }
          });

          if (onNearestStopFound) {
            onNearestStopFound(closestStop, minDistance);
          }

          const distKm = (minDistance / 1000).toFixed(1);
          if (minDistance < 3000) {
            setLocationStatus(`Located! Nearest Stop: ${closestStop.short_name} (${minDistance}m away)`);
          } else {
            setLocationStatus(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (${distKm}km from Bengaluru core)`);
          }
        }

        // Center map on user
        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 14, { duration: 1.2 });
        }
      },
      (err) => {
        setIsLocating(false);
        // Fallback gracefully to demo location
        setLocationStatus('Permission denied. Centered on Bengaluru Demo Origin (MG Road).');
        const fallback = { lat: 12.9756, lng: 77.6097, accuracy: 50 };
        setInternalUserLoc(fallback);
        if (onUserLocationChange) onUserLocationChange(fallback);
        if (mapRef.current) {
          mapRef.current.panTo([fallback.lat, fallback.lng], { animate: true });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  // Render User Location Pin with radar ripple
  useEffect(() => {
    if (!mapRef.current) return;

    if (activeUserLoc) {
      const userHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
          <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(56, 189, 248, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 16px; height: 16px; border-radius: 50%; background: #0284c7; border: 3px solid #ffffff; box-shadow: 0 0 12px rgba(2, 132, 199, 0.9);"></div>
        </div>
      `;

      const userIcon = L.divIcon({
        className: 'user-pulse-marker',
        html: userHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([activeUserLoc.lat, activeUserLoc.lng]);
      } else {
        const marker = L.marker([activeUserLoc.lat, activeUserLoc.lng], {
          icon: userIcon,
          zIndexOffset: 1000
        }).addTo(mapRef.current);
        marker.bindPopup(`<b>📍 Your Live Location</b><br/><span style="font-size:11px;color:#64748b;">GPS Live Accuracy: ±${Math.round(activeUserLoc.accuracy || 20)}m</span>`);
        userMarkerRef.current = marker;
      }

      // Accuracy radius circle
      if (activeUserLoc.accuracy && activeUserLoc.accuracy < 1000) {
        if (userAccuracyCircleRef.current) {
          userAccuracyCircleRef.current.setLatLng([activeUserLoc.lat, activeUserLoc.lng]);
          userAccuracyCircleRef.current.setRadius(activeUserLoc.accuracy);
        } else {
          userAccuracyCircleRef.current = L.circle([activeUserLoc.lat, activeUserLoc.lng], {
            radius: activeUserLoc.accuracy,
            color: '#38bdf8',
            weight: 1,
            fillColor: '#38bdf8',
            fillOpacity: 0.12
          }).addTo(mapRef.current);
        }
      }
    }
  }, [activeUserLoc]);

  // Draw Route Polylines and Stop Markers
  useEffect(() => {
    if (!mapRef.current || !polylineLayerGroupRef.current) return;
    polylineLayerGroupRef.current.clearLayers();

    const stopsMap = new Map<string, Stop>();
    stops.forEach((s) => stopsMap.set(s.id, s));

    // Draw route lines
    routes.forEach((route) => {
      const latlngs: [number, number][] = [];
      route.stops.forEach((stopId) => {
        const stop = stopsMap.get(stopId);
        if (stop) {
          latlngs.push([stop.lat, stop.lng]);
        }
      });

      const isSelectedRoute = selectedVehicle && selectedVehicle.route_id === route.id;

      if (latlngs.length > 1) {
        // Base route line
        const polyline = L.polyline(latlngs, {
          color: route.color || '#0284c7',
          weight: isSelectedRoute ? 6 : 3.5,
          opacity: isSelectedRoute ? 0.95 : 0.6,
          dashArray: route.id === 'WM-2' ? '6, 6' : undefined
        });
        polyline.bindTooltip(`<b>Route ${route.route_number}</b>: ${route.name}`, { sticky: true });
        polylineLayerGroupRef.current?.addLayer(polyline);

        // Glow layer for selected route
        if (isSelectedRoute) {
          const glowPolyline = L.polyline(latlngs, {
            color: route.color || '#38bdf8',
            weight: 12,
            opacity: 0.25
          });
          polylineLayerGroupRef.current?.addLayer(glowPolyline);
        }
      }
    });

    // Draw Stop Markers
    stops.forEach((stop) => {
      const stopName = t.stops[stop.id as keyof typeof t.stops] || stop.name;
      const isRouteStop = selectedVehicle && routes.find(r => r.id === selectedVehicle.route_id)?.stops.includes(stop.id);

      const stopHtml = `
        <div style="width: ${isRouteStop ? 16 : 12}px; height: ${isRouteStop ? 16 : 12}px; background: ${isRouteStop ? '#FFB703' : '#0284c7'}; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 0 10px ${isRouteStop ? 'rgba(255,183,3,0.9)' : 'rgba(2,132,199,0.7)'}; transition: all 0.2s;"></div>
      `;

      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: stopHtml,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([stop.lat, stop.lng], { icon: stopIcon });
      marker.bindPopup(`
        <div style="font-family: system-ui; padding: 2px;">
          <h4 style="font-weight: 800; font-size: 13px; margin: 0 0 4px 0; color: #0f172a;">${stopName}</h4>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 4px 0;">📍 ${stop.landmark || 'BMTC Transit Hub'}</p>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            ${(stop.facilities || []).map(f => `<span style="font-size: 9px; padding: 2px 6px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-weight: 600;">${f}</span>`).join('')}
          </div>
        </div>
      `);
      polylineLayerGroupRef.current?.addLayer(marker);
    });
  }, [stops, routes, selectedVehicle, language]);

  // Update Live Vehicles Markers with Real-Time BMTC Style Badges
  useEffect(() => {
    if (!mapRef.current) return;

    vehicles.forEach((vehicle) => {
      const isSelected = selectedVehicle?.id === vehicle.id;
      const isHigh = vehicle.crowd_level === 'High';
      const isDelayed = vehicle.status === 'DELAYED';
      const statusColor = isDelayed ? '#f59e0b' : isHigh ? '#f43f5e' : '#10b981';

      // BMTC App style vehicle pin with route number, arrow heading, and status badge
      const busHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: scale(${isSelected ? 1.25 : 1}); transition: transform 0.2s, top 0.4s ease-out, left 0.4s ease-out; z-index: ${isSelected ? 500 : 200};">
          <div style="background: #09152b; border: 2.5px solid ${statusColor}; border-radius: 12px; padding: 3px 8px; box-shadow: 0 6px 18px rgba(0,0,0,0.65); display: flex; align-items: center; gap: 5px; white-space: nowrap;">
            <span style="font-size: 11px;">🚌</span>
            <span style="font-weight: 900; font-size: 11px; color: #ffffff; letter-spacing: -0.2px;">${vehicle.display_name}</span>
            <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${statusColor}; ${isSelected ? 'animation: pulse 1.5s infinite;' : ''}"></span>
          </div>
          <!-- Arrow pointer indicating heading -->
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid ${statusColor}; margin-top: -1px;"></div>
        </div>
      `;

      const busIcon = L.divIcon({
        className: 'bmtc-live-bus-marker',
        html: busHtml,
        iconSize: [84, 38],
        iconAnchor: [42, 35]
      });

      if (markersRef.current[vehicle.id]) {
        // Smoothly update location
        markersRef.current[vehicle.id].setLatLng([vehicle.lat, vehicle.lng]);
        markersRef.current[vehicle.id].setIcon(busIcon);
      } else {
        const marker = L.marker([vehicle.lat, vehicle.lng], { icon: busIcon }).addTo(mapRef.current!);
        marker.on('click', () => {
          if (onSelectVehicle) onSelectVehicle(vehicle);
        });
        markersRef.current[vehicle.id] = marker;
      }
    });

    // If follow bus is enabled, smoothly follow selected bus
    if (followBus && selectedVehicle && mapRef.current) {
      mapRef.current.panTo([selectedVehicle.lat, selectedVehicle.lng], { animate: true });
    }
  }, [vehicles, selectedVehicle, followBus, onSelectVehicle]);

  // Center on all fleet buses
  const handleFitFleet = () => {
    if (!mapRef.current || vehicles.length === 0) return;
    const group = new L.FeatureGroup(vehicles.map((v) => L.marker([v.lat, v.lng])));
    mapRef.current.fitBounds(group.getBounds().pad(0.2));
  };

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-[#1E3563] shadow-inner bg-[#081225]">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full"></div>

      {/* Floating GPS & Action Controls (Google Maps / BMTC style) */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        {/* Locate Me FAB (Google Maps Crosshair Button) */}
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          className={`w-10 h-10 rounded-xl shadow-xl flex items-center justify-center transition-all ${
            activeUserLoc
              ? 'bg-sky-600 text-white border-2 border-sky-400 shadow-sky-500/30'
              : 'bg-[#0D1B36]/90 hover:bg-[#132347] text-sky-400 border border-[#1E3563]'
          }`}
          title="Locate My Live GPS Location"
        >
          <Crosshair className={`w-5 h-5 ${isLocating ? 'animate-spin text-amber-400' : ''}`} />
        </button>

        {/* Fit Entire Fleet on Map */}
        <button
          onClick={handleFitFleet}
          className="w-10 h-10 rounded-xl bg-[#0D1B36]/90 hover:bg-[#132347] text-amber-400 border border-[#1E3563] shadow-xl flex items-center justify-center transition-all"
          title="Fit All Buses in View"
        >
          <Bus className="w-5 h-5" />
        </button>

        {/* Follow Selected Bus Toggle */}
        {showFollowToggle && selectedVehicle && (
          <button
            onClick={() => setFollowBus(!followBus)}
            className={`w-10 h-10 rounded-xl shadow-xl flex items-center justify-center transition-all ${
              followBus
                ? 'bg-amber-400 text-slate-950 font-bold border-2 border-amber-300'
                : 'bg-[#0D1B36]/90 hover:bg-[#132347] text-slate-300 border border-[#1E3563]'
            }`}
            title={followBus ? 'Unfollow Bus' : 'Lock Map & Follow Bus in Real-Time'}
          >
            <Compass className={`w-5 h-5 ${followBus ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Toast Notification of Location Status */}
      {locationStatus && (
        <div className="absolute top-3 left-3 z-[1000] max-w-xs bg-[#09152B]/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-sky-500/40 text-xs text-sky-200 shadow-2xl flex items-center gap-2">
          <Navigation className="w-4 h-4 text-sky-400 shrink-0 animate-pulse" />
          <span className="line-clamp-2 leading-tight">{locationStatus}</span>
          <button
            onClick={() => setLocationStatus(null)}
            className="ml-auto text-slate-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Live Map Telemetry Legend */}
      <div className="absolute bottom-2.5 left-2.5 z-[1000] bg-[#09142A]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#1E3563] flex items-center gap-3 text-[11px] font-medium text-slate-300 pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          {t.onTime}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          {t.delayed}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          {t.high}
        </span>
        {activeUserLoc && (
          <span className="flex items-center gap-1.5 text-sky-300 font-bold border-l border-slate-700 pl-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
            GPS Active
          </span>
        )}
      </div>
    </div>
  );
};
