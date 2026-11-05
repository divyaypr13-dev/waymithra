import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { VehicleLiveState, Stop, Route, Language } from '../types';
import { getTranslation } from '../translations';

interface MapViewProps {
  stops: Stop[];
  routes: Route[];
  vehicles: VehicleLiveState[];
  selectedVehicle?: VehicleLiveState | null;
  onSelectVehicle?: (vehicle: VehicleLiveState) => void;
  onOpenLiveCam?: (vehicle: VehicleLiveState) => void;
  language: Language;
}

export const MapView: React.FC<MapViewProps> = ({
  stops,
  routes,
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  onOpenLiveCam,
  language
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polylineLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const t = getTranslation(language);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      // Center Bengaluru
      const map = L.map(mapContainerRef.current, {
        center: [12.9716, 77.5946],
        zoom: 12,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Clean OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        opacity: 0.85
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

  // Draw Route Polylines and Stop Markers
  useEffect(() => {
    if (!mapRef.current || !polylineLayerGroupRef.current) return;
    polylineLayerGroupRef.current.clearLayers();

    const stopsMap = new Map<string, Stop>();
    stops.forEach(s => stopsMap.set(s.id, s));

    // Draw route lines
    routes.forEach(route => {
      const latlngs: [number, number][] = [];
      route.stops.forEach(stopId => {
        const stop = stopsMap.get(stopId);
        if (stop) {
          latlngs.push([stop.lat, stop.lng]);
        }
      });

      if (latlngs.length > 1) {
        const polyline = L.polyline(latlngs, {
          color: route.color || '#0284c7',
          weight: 4,
          opacity: 0.85,
          dashArray: route.id === 'WM-2' ? '6, 6' : undefined
        });
        polyline.bindTooltip(`${route.route_number}: ${route.name}`, { sticky: true });
        polylineLayerGroupRef.current?.addLayer(polyline);
      }
    });

    // Draw Stop Markers
    stops.forEach(stop => {
      const stopName = t.stops[stop.id as keyof typeof t.stops] || stop.name;
      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `<div style="width: 14px; height: 14px; background: #0284c7; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 0 8px rgba(2,132,199,0.8);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([stop.lat, stop.lng], { icon: stopIcon });
      marker.bindTooltip(`<b>${stopName}</b><br/><span style="color:#94a3b8;font-size:11px;">${stop.landmark || ''}</span>`, {
        direction: 'top',
        offset: [0, -6]
      });
      polylineLayerGroupRef.current?.addLayer(marker);
    });

  }, [stops, routes, language]);

  // Update Live Vehicles Markers
  useEffect(() => {
    if (!mapRef.current) return;

    vehicles.forEach(vehicle => {
      const isSelected = selectedVehicle?.id === vehicle.id;
      const isHigh = vehicle.crowd_level === 'High';
      const isDelayed = vehicle.status === 'DELAYED';
      const badgeBg = isDelayed ? '#f59e0b' : isHigh ? '#f43f5e' : '#10b981';

      const busHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: scale(${isSelected ? 1.25 : 1}); transition: transform 0.2s;">
          <div style="background: #0d1b36; border: 2px solid ${badgeBg}; border-radius: 20px; padding: 2px 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; items: center; gap: 4px; white-space: nowrap;">
            <span style="font-weight: 800; font-size: 11px; color: #ffffff;">${vehicle.display_name}</span>
            <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${badgeBg};"></span>
          </div>
          <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #0d1b36; margin-top: -1px;"></div>
        </div>
      `;

      const busIcon = L.divIcon({
        className: 'custom-bus-marker',
        html: busHtml,
        iconSize: [64, 32],
        iconAnchor: [32, 28]
      });

      if (markersRef.current[vehicle.id]) {
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

    // If selected vehicle changes, pan softly
    if (selectedVehicle && mapRef.current) {
      mapRef.current.panTo([selectedVehicle.lat, selectedVehicle.lng], { animate: true });
    }
  }, [vehicles, selectedVehicle, onSelectVehicle]);

  return (
    <div className="relative w-full h-full min-h-[280px] rounded-xl overflow-hidden border border-[#1E3563] shadow-inner bg-[#0b1528]">
      <div ref={mapContainerRef} className="w-full h-full"></div>
      
      {/* Map Legend Overlay */}
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
          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
          {t.nearbyStops}
        </span>
      </div>
    </div>
  );
};
