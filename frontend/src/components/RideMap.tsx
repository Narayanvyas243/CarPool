import React, { useEffect, useRef, useState } from "react";
import { Layers, MapPin, Navigation, Info, AlertTriangle, Loader2 } from "lucide-react";

interface RideMapProps {
  from: { lat: number | null | undefined; lng: number | null | undefined; name: string };
  to: { lat: number | null | undefined; lng: number | null | undefined; name: string };
  markers?: Array<{ lat: number; lng: number; label: string; color: string }>;
}

const RideMap = ({ from, to, markers }: RideMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const liveMarkersRef = useRef<Map<string, any>>(new Map());
  const routeLayerRef = useRef<any>(null);
  
  const [mapType, setMapType] = useState<'voyager' | 'satellite'>('voyager');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper for geocoding
  const geocode = async (name: string) => {
    try {
      // Priority 1: Dehradun bias
      let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name + ", Dehradun")}`);
      let data = await res.json();
      if (data && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };

      // Priority 2: Generic search
      res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}`);
      data = await res.json();
      if (data && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch (e) {
      console.error("Geocoding failed for", name, e);
    }
    return null;
  };

  useEffect(() => {
    const L = (window as any).L;
    if (!mapContainerRef.current || !L) return;

    const initMap = async () => {
      setIsLoading(true);
      setError(null);

      let fromLat = from.lat;
      let fromLng = from.lng;
      let toLat = to.lat;
      let toLng = to.lng;

      // Dictionary of common UPES/Dehradun keywords for fallback
      const COMMON_LOCATIONS: Record<string, { lat: number; lng: number }> = {
        'bidholi': { lat: 30.398, lng: 77.969 },
        'kandoli': { lat: 30.412, lng: 77.962 },
        'prem nagar': { lat: 30.339, lng: 77.966 },
        'isbt': { lat: 30.286, lng: 77.996 },
        'clock tower': { lat: 30.324, lng: 78.041 },
        'ballupur': { lat: 30.334, lng: 78.016 },
        'jakhan': { lat: 30.358, lng: 78.062 },
        'rajpur road': { lat: 30.335, lng: 78.058 },
        'ddn': { lat: 30.316, lng: 78.032 }
      };

      const findInDictionary = (name: string) => {
        const lower = name.toLowerCase();
        for (const [key, coords] of Object.entries(COMMON_LOCATIONS)) {
          if (lower.includes(key)) return coords;
        }
        return null;
      };

      // Geocoding Fallbacks
      if (fromLat == null || fromLng == null) {
        const dictMatch = findInDictionary(from.name);
        if (dictMatch) {
          fromLat = dictMatch.lat;
          fromLng = dictMatch.lng;
        } else {
          const coords = await geocode(from.name);
          if (coords) {
            fromLat = coords.lat;
            fromLng = coords.lng;
          }
        }
      }

      if (toLat == null || toLng == null) {
        const dictMatch = findInDictionary(to.name);
        if (dictMatch) {
          toLat = dictMatch.lat;
          toLng = dictMatch.lng;
        } else {
          const coords = await geocode(to.name);
          if (coords) {
            toLat = coords.lat;
            toLng = coords.lng;
          }
        }
      }

      if (fromLat == null || fromLng == null || toLat == null || toLng == null) {
        setError("Map coordinates could not be found for these locations.");
        setIsLoading(false);
        return;
      }

      const fromPos: [number, number] = [fromLat, fromLng];
      const toPos: [number, number] = [toLat, toLng];

      if (!mapInstance.current) {
        // Initialize Map
        mapInstance.current = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
          scrollWheelZoom: false
        }).setView(fromPos, 13);

        // Add Zoom Control at custom position
        L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

        // Tile Layer
        const layerUrl = mapType === 'satellite' 
          ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' 
          : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

        tileLayerRef.current = L.tileLayer(layerUrl, { 
          maxZoom: 20,
          maxNativeZoom: 18,
          crossOrigin: true,
          attribution: '&copy; Google Maps'
        }).addTo(mapInstance.current);

        // Track tile loading
        tileLayerRef.current.on('tileload', () => console.log("[RideMap] Tile loaded successfully"));
        tileLayerRef.current.on('tileerror', (e: any) => console.error("[RideMap] Tile failed:", e.url));

        // Markers
        const customIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        });

        const dropIcon = L.icon({
          iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        });

        L.marker(fromPos, { icon: customIcon }).addTo(mapInstance.current).bindPopup(`<b>Pickup:</b><br/>${from.name}`);
        L.marker(toPos, { icon: dropIcon }).addTo(mapInstance.current).bindPopup(`<b>Drop-off:</b><br/>${to.name}`);

        // Route Fetching (OSRM)
        const fetchRoute = async () => {
          try {
            const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`);
            const data = await res.json();
            
            if (data.routes && data.routes.length > 0) {
              const coordinates = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
              if (routeLayerRef.current) mapInstance.current.removeLayer(routeLayerRef.current);
              
              routeLayerRef.current = L.polyline(coordinates, {
                color: '#3b82f6',
                weight: 6,
                opacity: 0.8,
                lineJoin: 'round'
              }).addTo(mapInstance.current);

              mapInstance.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });
            } else {
              drawStraightLine();
            }
          } catch (err) {
            console.error("OSRM error:", err);
            drawStraightLine();
          } finally {
            setIsLoading(false);
          }
        };

        const drawStraightLine = () => {
          if (routeLayerRef.current) mapInstance.current.removeLayer(routeLayerRef.current);
          routeLayerRef.current = L.polyline([fromPos, toPos], {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.6,
            dashArray: '10, 10'
          }).addTo(mapInstance.current);
          mapInstance.current.fitBounds(L.latLngBounds([fromPos, toPos]), { padding: [50, 50] });
        };

        fetchRoute();
      } else {
        setIsLoading(false);
      }

      setTimeout(() => {
        if (mapInstance.current) mapInstance.current.invalidateSize();
      }, 500);
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        routeLayerRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, [from.lat, from.lng, to.lat, to.lng, from.name, to.name]);

  // Handle layer switching
  useEffect(() => {
    if (mapInstance.current && (window as any).L && tileLayerRef.current) {
      const L = (window as any).L;
      if (tileLayerRef.current) {
        mapInstance.current.removeLayer(tileLayerRef.current);
      }
      
      const layerUrl = mapType === 'satellite' 
        ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' 
        : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

      tileLayerRef.current = L.tileLayer(layerUrl, { 
        maxZoom: 20,
        maxNativeZoom: 18,
        crossOrigin: true,
        attribution: '&copy; Google Maps'
      }).addTo(mapInstance.current);
    }
  }, [mapType]);

  // Handle dynamic markers (Live Tracking)
  useEffect(() => {
    if (!mapInstance.current || !markers || !(window as any).L) return;
    const L = (window as any).L;

    const currentLabels = new Set(markers.map(m => m.label));
    liveMarkersRef.current.forEach((marker, label) => {
        if (!currentLabels.has(label)) {
            mapInstance.current.removeLayer(marker);
            liveMarkersRef.current.delete(label);
        }
    });

    markers.forEach(m => {
        const existing = liveMarkersRef.current.get(m.label);
        if (existing) {
            existing.setLatLng([m.lat, m.lng]);
        } else {
            const circleMarker = L.circleMarker([m.lat, m.lng], {
                radius: 10,
                fillColor: m.color === 'blue' ? '#3b82f6' : '#ef4444',
                color: '#fff',
                weight: 3,
                opacity: 1,
                fillOpacity: 1
            }).addTo(mapInstance.current).bindPopup(m.label);
            liveMarkersRef.current.set(m.label, circleMarker);
        }
    });

    if (markers.length > 0 && !isLoading) {
        const markerPoints = markers.map(m => [m.lat, m.lng]);
        const allPoints = [...markerPoints];
        if (from.lat && from.lng) allPoints.push([from.lat, from.lng]);
        if (to.lat && to.lng) allPoints.push([to.lat, to.lng]);
        
        mapInstance.current.fitBounds(L.latLngBounds(allPoints as [number, number][]), { padding: [50, 50] });
    }
  }, [markers, isLoading]);

  if (!from.name || !to.name) return null;

  return (
    <div className="w-full h-[400px] rounded-3xl overflow-hidden border border-slate-200 shadow-xl relative z-0 group">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Overlay States */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-sm z-10 space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <Navigation className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">Loading Route Details...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/95 backdrop-blur-sm z-20 p-8 text-center space-y-4">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-red-900">{error}</p>
            <p className="text-[10px] text-red-700 font-medium">Please try re-creating the ride using the map picker for exact coordinates.</p>
          </div>
        </div>
      )}

      {/* Floating Controls */}
      {!isLoading && !error && (
        <>
          {/* Layer Toggle */}
          <button 
            onClick={() => setMapType(mapType === 'voyager' ? 'satellite' : 'voyager')}
            className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-100 shadow-2xl flex items-center gap-2 hover:bg-white transition-all transform active:scale-95 group/btn"
          >
            <Layers className={`h-4 w-4 ${mapType === 'satellite' ? 'text-primary' : 'text-slate-500'}`} />
            <span className="text-[11px] font-bold text-slate-800">
              {mapType === 'voyager' ? 'Satellite View' : 'Map View'}
            </span>
          </button>

          {/* Quick Controls */}
          <div className="absolute top-16 right-4 z-[1000] flex flex-col gap-2">
            <button 
              onClick={() => {
                if (mapInstance.current && (window as any).navigator.geolocation) {
                  (window as any).navigator.geolocation.getCurrentPosition((pos: any) => {
                    const { latitude, longitude } = pos.coords;
                    mapInstance.current.setView([latitude, longitude], 16);
                  });
                }
              }}
              className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-100 shadow-2xl text-slate-600 hover:text-primary transition-all active:scale-95"
              title="My Location"
            >
              <Navigation className="h-4 w-4" />
            </button>
            <button 
              onClick={() => {
                if (mapInstance.current && routeLayerRef.current) {
                  mapInstance.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });
                }
              }}
              className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-100 shadow-2xl text-slate-600 hover:text-primary transition-all active:scale-95"
              title="Fit to Route"
            >
              <MapPin className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Info */}
          <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md p-2 rounded-2xl border border-slate-100 shadow-2xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Info className="h-4 w-4 text-primary" />
            </div>
            <div className="pr-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Active Route</p>
              <p className="text-[10px] font-bold text-slate-900">Dehradun Region</p>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-slate-100 shadow-2xl space-y-3 min-w-[200px] animate-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              <div className="flex-1 overflow-hidden">
                <p className="text-[11px] font-bold text-slate-800 truncate">{from.name}</p>
                <p className="text-[9px] text-slate-400 font-medium">Pickup Point</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
              <div className="flex-1 overflow-hidden">
                <p className="text-[11px] font-bold text-slate-800 truncate">{to.name}</p>
                <p className="text-[9px] text-slate-400 font-medium">Drop-off Point</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RideMap;
