import React, { useEffect, useRef } from "react";
import { RideData } from "./RideCard";
import { Button } from "./ui/button";
import { createRoot } from "react-dom/client";

interface GlobalRideMapProps {
  rides: RideData[];
  onSelectRide?: (rideId: string) => void;
}

const GlobalRideMap = ({ rides, onSelectRide }: GlobalRideMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);

  useEffect(() => {
    if (mapContainerRef.current && (window as any).L && !mapInstance.current) {
      const L = (window as any).L;
      // Create map
      mapInstance.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([30.3165, 78.0322], 12);

      // Add Tile Layer (Google Maps)
      L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        crossOrigin: true,
        attribution: '&copy; Google Maps'
      }).addTo(mapInstance.current);

      layerGroupRef.current = L.layerGroup().addTo(mapInstance.current);

      // Invalidate size for stability
      setTimeout(() => {
        if (mapInstance.current) mapInstance.current.invalidateSize();
      }, 300);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []);

  // Sync markers when rides change
  useEffect(() => {
    if (mapInstance.current && layerGroupRef.current && (window as any).L) {
      const L = (window as any).L;
      layerGroupRef.current.clearLayers();
      const points: any[] = [];
      const customIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      });

      rides.forEach((ride) => {
        if (ride.fromCoords) {
          const pos: [number, number] = [ride.fromCoords.lat, ride.fromCoords.lng];
          points.push(pos);

          const marker = L.marker(pos, { icon: customIcon }).addTo(layerGroupRef.current!);
          
          const popupContent = document.createElement('div');
          const root = createRoot(popupContent);
          root.render(
            <div className="p-1 space-y-2 min-w-[150px] font-sans">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                  {(ride.driverName || "U").split(' ').filter(Boolean).map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight text-slate-800">{ride.driverName}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{ride.driverRole}</p>
                </div>
              </div>
              <div className="space-y-1 text-[11px] text-slate-600 border-l-2 border-slate-100 pl-2">
                <p className="truncate">🏁 {ride.source}</p>
                <p className="truncate">📍 {ride.destination}</p>
              </div>
              <p className="text-xs font-bold text-primary">₹{ride.pricePerSeat} • {ride.time}</p>
              <Button 
                size="sm" 
                className="w-full h-7 text-[10px] font-bold" 
                onClick={() => onSelectRide?.(ride.id)}
              >
                View Details
              </Button>
            </div>
          );

          marker.bindPopup(popupContent, {
            className: 'custom-leaflet-popup',
            maxWidth: 200
          });
        }
      });

      if (points.length > 0 && mapInstance.current) {
        const bounds = L.latLngBounds(points);
        mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [rides, onSelectRide]);

  return (
    <div className="w-full h-[400px] rounded-3xl overflow-hidden border border-slate-200 shadow-xl relative z-0 mb-8">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default GlobalRideMap;
