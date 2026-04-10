import React, { useEffect, useRef } from "react";

interface RideMapProps {
  from: { lat: number; lng: number; name: string };
  to: { lat: number; lng: number; name: string };
  markers?: Array<{ lat: number; lng: number; label: string; color: string }>;
}

const RideMap = ({ from, to, markers }: RideMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const liveMarkersRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    if (mapContainerRef.current && (window as any).L && !mapInstance.current) {
      if (!from.lat || !from.lng || !to.lat || !to.lng) return;

      const L = (window as any).L;
      const fromPos: [number, number] = [from.lat, from.lng];
      const toPos: [number, number] = [to.lat, to.lng];

      // Create map
      mapInstance.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false
      }).setView(fromPos, 13);

      // Add Tile Layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapInstance.current);

      const customIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      });

      L.marker(fromPos, { icon: customIcon }).addTo(mapInstance.current).bindPopup(`Pickup: ${from.name}`);
      const dropIcon = L.icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      });
      L.marker(toPos, { icon: dropIcon }).addTo(mapInstance.current).bindPopup(`Drop-off: ${to.name}`);

      L.polyline([fromPos, toPos], {
        color: 'hsl(var(--primary))',
        weight: 4,
        opacity: 0.6,
        dashArray: '10, 10'
      }).addTo(mapInstance.current);

      const bounds = L.latLngBounds([fromPos, toPos]);
      mapInstance.current.fitBounds(bounds, { padding: [50, 50] });

      setTimeout(() => {
        if (mapInstance.current) mapInstance.current.invalidateSize();
      }, 300);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [from.lat, from.lng, to.lat, to.lng]);

  // Handle dynamic markers (Live Tracking)
  useEffect(() => {
    if (!mapInstance.current || !markers || !(window as any).L) return;
    const L = (window as any).L;

    // Clear old markers that aren't in the new list
    const currentLabels = new Set(markers.map(m => m.label));
    liveMarkersRef.current.forEach((marker, label) => {
        if (!currentLabels.has(label)) {
            mapInstance.current.removeLayer(marker);
            liveMarkersRef.current.delete(label);
        }
    });

    // Update or add markers
    markers.forEach(m => {
        const existing = liveMarkersRef.current.get(m.label);
        if (existing) {
            existing.setLatLng([m.lat, m.lng]);
        } else {
            const circleMarker = L.circleMarker([m.lat, m.lng], {
                radius: 8,
                fillColor: m.color === 'blue' ? '#3b82f6' : '#ef4444',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            }).addTo(mapInstance.current).bindPopup(m.label);
            liveMarkersRef.current.set(m.label, circleMarker);
        }
    });

    // Adjust bounds if live markers are outside
    if (markers.length > 0) {
        const markerPoints = markers.map(m => [m.lat, m.lng]);
        const allPoints = [...markerPoints, [from.lat, from.lng], [to.lat, to.lng]] as [number, number][];
        mapInstance.current.fitBounds(L.latLngBounds(allPoints), { padding: [40, 40] });
    }
  }, [markers, from, to]);

  if (!from.lat || !from.lng || !to.lat || !to.lng) {
    return (
      <div className="w-full h-32 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm font-medium">
        Route visualization not ready yet
      </div>
    );
  }

  return (
    <div className="w-full h-[350px] rounded-2xl overflow-hidden border border-slate-200 shadow-md relative z-0 bg-slate-100">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-xl text-[10px] space-y-1.5 max-w-[180px]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm" />
          <span className="font-bold text-slate-700 truncate">{from.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm" />
          <span className="font-bold text-slate-700 truncate">{to.name}</span>
        </div>
      </div>
    </div>
  );
};

export default RideMap;
