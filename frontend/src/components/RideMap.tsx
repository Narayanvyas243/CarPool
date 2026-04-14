import React, { useEffect, useRef } from "react";

interface RideMapProps {
  from: { lat: number | null | undefined; lng: number | null | undefined; name: string };
  to: { lat: number | null | undefined; lng: number | null | undefined; name: string };
  markers?: Array<{ lat: number; lng: number; label: string; color: string }>;
}

const RideMap = ({ from, to, markers }: RideMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const liveMarkersRef = useRef<Map<string, any>>(new Map());
  const routeLayerRef = useRef<any>(null);

  useEffect(() => {
    const L = (window as any).L;
    if (!mapContainerRef.current || !L) return;

    const initMap = async () => {
      let fromLat = from.lat;
      let fromLng = from.lng;
      let toLat = to.lat;
      let toLng = to.lng;

      // Geocoding Fallback if coords are missing
      if (fromLat === null || fromLat === undefined || fromLng === null || fromLng === undefined) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(from.name + ", Dehradun")}`);
          const data = await res.json();
          if (data[0]) {
            fromLat = parseFloat(data[0].lat);
            fromLng = parseFloat(data[0].lon);
          }
        } catch (e) {
          console.error("Geocoding fallback failed for 'from'", e);
        }
      }

      if (toLat === null || toLat === undefined || toLng === null || toLng === undefined) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(to.name + ", Dehradun")}`);
          const data = await res.json();
          if (data[0]) {
            toLat = parseFloat(data[0].lat);
            toLng = parseFloat(data[0].lon);
          }
        } catch (e) {
          console.error("Geocoding fallback failed for 'to'", e);
        }
      }

      if (fromLat === null || fromLat === undefined || fromLng === null || fromLng === undefined || 
          toLat === null || toLat === undefined || toLng === null || toLng === undefined) return;

      if (!mapInstance.current) {
        const fromPos: [number, number] = [fromLat, fromLng];
        const toPos: [number, number] = [toLat, toLng];

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

        // Fetch Road Route from OSRM
        const fetchRoute = async () => {
          try {
            const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`);
            const data = await res.json();
            
            if (data.routes && data.routes.length > 0) {
              const coordinates = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
              
              if (routeLayerRef.current) mapInstance.current.removeLayer(routeLayerRef.current);
              
              routeLayerRef.current = L.polyline(coordinates, {
                color: 'hsl(var(--primary))',
                weight: 5,
                opacity: 0.8,
                lineJoin: 'round'
              }).addTo(mapInstance.current);

              // Fit bounds to the actual route
              mapInstance.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });
            } else {
              drawStraightLine(fromPos, toPos);
            }
          } catch (err) {
            console.error("OSRM Route error:", err);
            drawStraightLine(fromPos, toPos);
          }
        };

        const drawStraightLine = (p1: [number, number], p2: [number, number]) => {
          if (routeLayerRef.current) mapInstance.current.removeLayer(routeLayerRef.current);
          routeLayerRef.current = L.polyline([p1, p2], {
            color: 'hsl(var(--primary))',
            weight: 4,
            opacity: 0.6,
            dashArray: '10, 10'
          }).addTo(mapInstance.current);
          const bounds = L.latLngBounds([p1, p2]);
          mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
        };

        fetchRoute();

        setTimeout(() => {
          if (mapInstance.current) mapInstance.current.invalidateSize();
        }, 300);
      }
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        routeLayerRef.current = null;
      }
    };
  }, [from.lat, from.lng, to.lat, to.lng, from.name, to.name]);

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
        const allPoints = [...markerPoints];
        
        if (from.lat !== null && from.lat !== undefined && from.lng !== null && from.lng !== undefined) {
          allPoints.push([from.lat, from.lng]);
        }
        if (to.lat !== null && to.lat !== undefined && to.lng !== null && to.lng !== undefined) {
          allPoints.push([to.lat, to.lng]);
        }
        
        if (allPoints.length > 0) {
          mapInstance.current.fitBounds(L.latLngBounds(allPoints as [number, number][]), { padding: [40, 40] });
        }
    }
  }, [markers, from, to]);

  if (!from.name || !to.name) {
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
