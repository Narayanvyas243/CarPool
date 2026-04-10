import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Loader2, Navigation, Map as MapIcon, X, AlertTriangle } from "lucide-react";

// Pre-defined locations for quick selection
const QUICK_LOCATIONS = [
  { name: "UPES Bidholi", lat: 30.4033, lng: 77.9669 },
  { name: "UPES Kandoli", lat: 30.3853, lng: 77.9657 },
  { name: "Clock Tower", lat: 30.3244, lng: 78.0411 },
  { name: "ISBT Dehradun", lat: 30.2856, lng: 77.9981 },
];

interface MapPickerProps {
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void;
  title?: string;
  initialLocation?: { lat: number; lng: number };
}

const MapPicker = ({ onLocationSelect, title = "Select Location", initialLocation }: MapPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [libStatus, setLibStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedName, setSelectedName] = useState("");
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  // Dynamic Loader for Leaflet
  useEffect(() => {
    if (!isOpen) return;

    const checkAndInit = () => {
      if ((window as any).L) {
        setLibStatus('ready');
        return true;
      }
      return false;
    };

    if (checkAndInit()) return;

    // If not found, manually inject
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => setLibStatus('ready');
    script.onerror = () => setLibStatus('error');
    document.head.appendChild(script);

    const link = document.createElement('link');
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Timeout fallback
    const timer = setTimeout(() => {
      if (!(window as any).L) setLibStatus('error');
    }, 5000);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Sync coords when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (initialLocation) {
        setCoords({ lat: initialLocation.lat, lng: initialLocation.lng });
        setSelectedName("");
      } else {
        setCoords(null);
        setSelectedName("");
      }
    }
  }, [isOpen, initialLocation]);

  // Map Initialization logic
  useEffect(() => {
    if (isOpen && libStatus === 'ready' && mapContainerRef.current && (window as any).L && !mapInstance.current) {
      const L = (window as any).L;
      const initialCoords: [number, number] = coords 
        ? [coords.lat, coords.lng] 
        : [30.3165, 78.0322];

      try {
        mapInstance.current = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: false
        }).setView(initialCoords, 14);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd'
        }).addTo(mapInstance.current);

        const customIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        });

        if (coords) {
          markerInstance.current = L.marker([coords.lat, coords.lng], { icon: customIcon }).addTo(mapInstance.current);
        }

        mapInstance.current.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          setCoords({ lat, lng });
          setSelectedName(""); // Clear locked name on manual click
          
          if (markerInstance.current) {
            markerInstance.current.setLatLng(e.latlng);
          } else {
            markerInstance.current = L.marker(e.latlng, { icon: customIcon }).addTo(mapInstance.current!);
          }
        });

        setTimeout(() => {
          if (mapInstance.current) mapInstance.current.invalidateSize();
        }, 600);
      } catch (err) {
        console.error("Map init error:", err);
        setLibStatus('error');
      }
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerInstance.current = null;
      }
    };
  }, [isOpen, libStatus]);

  const handleSearch = async () => {
    if (!searchQuery || !mapInstance.current) return;
    
    // Smart Interceptor for UPES Campuses
    const lowerQuery = searchQuery.toLowerCase();
    let campusOverride = null;
    
    if (lowerQuery.includes("kandoli")) {
      campusOverride = QUICK_LOCATIONS.find(l => l.name.includes("Kandoli"));
    } else if (lowerQuery.includes("bidholi")) {
      campusOverride = QUICK_LOCATIONS.find(l => l.name.includes("Bidholi"));
    }

    if (campusOverride) {
      setCoords({ lat: campusOverride.lat, lng: campusOverride.lng });
      setSelectedName(campusOverride.name);
      mapInstance.current.setView([campusOverride.lat, campusOverride.lng], 16);
      
      const L = (window as any).L;
      const customIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      });

      if (markerInstance.current) {
        markerInstance.current.setLatLng([campusOverride.lat, campusOverride.lng]);
      } else {
        markerInstance.current = L.marker([campusOverride.lat, campusOverride.lng], { icon: customIcon }).addTo(mapInstance.current);
      }
      return;
    }

    setIsSearching(true);
    try {
      // Added viewbox for Dehradun/UPES area to increase priority (approx bounds for Dehradun)
      const viewbox = "77.8,30.2,78.2,30.5";
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&viewbox=${viewbox}&bounded=0`);
      const data = await res.json();
      if (data && data.length > 0) {
        const L = (window as any).L;
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setCoords({ lat, lng: lon });
        setSelectedName(""); // Clear locked name on new search
        mapInstance.current.setView([lat, lon], 15);
        
        const customIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        });

        if (markerInstance.current) {
          markerInstance.current.setLatLng([lat, lon]);
        } else {
          markerInstance.current = L.marker([lat, lon], { icon: customIcon }).addTo(mapInstance.current);
        }
      }
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocateMe = () => {
    if (navigator.geolocation && mapInstance.current) {
      const L = (window as any).L;
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        mapInstance.current?.setView([latitude, longitude], 16);
        
        const customIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        });

        if (markerInstance.current) {
          markerInstance.current.setLatLng([latitude, longitude]);
        } else {
          markerInstance.current = L.marker([latitude, longitude], { icon: customIcon }).addTo(mapInstance.current!);
        }

        // Smart Proximity Check - If within 600m of a known campus, prioritize our campus name
        const findNearbyCampus = () => {
          for (const loc of QUICK_LOCATIONS) {
            // Rough distance check (approx 0.005 degrees ~ 550m)
            const dist = Math.sqrt(Math.pow(loc.lat - latitude, 2) + Math.pow(loc.lng - longitude, 2));
            if (dist < 0.006) return loc.name;
          }
          return null;
        };

        const nearbyCampus = findNearbyCampus();
        if (nearbyCampus) {
          setSearchQuery(nearbyCampus);
          setSelectedName(nearbyCampus);
        } else {
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(res => res.json())
            .then(data => {
              const shortAddress = data.display_name.split(',').slice(0, 2).join(',');
              setSearchQuery(shortAddress);
              setSelectedName("");
            });
        }
      });
    }
  };

  const handleConfirm = async () => {
    if (coords) {
      if (selectedName) {
        // If we have a locked name (from Quick Select), use it directly
        onLocationSelect({ address: selectedName, lat: coords.lat, lng: coords.lng });
        setIsOpen(false);
        return;
      }

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`);
        const data = await res.json();
        const addressParts = data.display_name.split(',');
        const address = addressParts.length > 2 ? addressParts.slice(0, 3).join(',') : data.display_name;
        onLocationSelect({ address, lat: coords.lat, lng: coords.lng });
      } catch {
        onLocationSelect({ address: searchQuery || "Selected Location", lat: coords.lat, lng: coords.lng });
      }
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2 h-9 px-3 border-dashed hover:border-primary shrink-0">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline">Select on Map</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl h-[90vh] sm:h-[600px] flex flex-col p-0 overflow-hidden bg-white border shadow-2xl rounded-2xl">
        <DialogHeader className="p-4 border-b bg-slate-50">
          <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
            <MapIcon className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4 bg-white">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search area (e.g. Dehradun)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 pr-10 h-11 border-slate-200 focus-visible:ring-primary shadow-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button variant="outline" onClick={handleLocateMe} className="h-11 px-3 border-slate-200 shadow-sm" title="Locate Me">
              <Navigation className="h-4 w-4 text-slate-600" />
            </Button>
            <Button onClick={handleSearch} disabled={isSearching} className="px-6 h-11 font-bold shadow-md">
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_LOCATIONS.map((loc) => (
              <Button
                key={loc.name}
                variant="secondary"
                size="sm"
                className="h-8 text-[11px] rounded-full bg-slate-100 hover:bg-primary hover:text-white transition-all text-slate-700 font-semibold"
                onClick={() => {
                  setCoords({ lat: loc.lat, lng: loc.lng });
                  setSearchQuery(loc.name);
                  setSelectedName(loc.name); // Lock the name
                  if (mapInstance.current) {
                    mapInstance.current.setView([loc.lat, loc.lng], 15);
                    const L = (window as any).L;
                    const customIcon = L.icon({
                      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                      iconSize: [25, 41],
                      iconAnchor: [12, 41]
                    });
                    if (markerInstance.current) markerInstance.current.setLatLng([loc.lat, loc.lng]);
                    else markerInstance.current = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(mapInstance.current);
                  }
                }}
              >
                {loc.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-[300px] relative z-0 border-y bg-slate-50 flex items-center justify-center">
          <div ref={mapContainerRef} className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${libStatus === 'ready' ? 'opacity-100' : 'opacity-0'}`} style={{ background: '#f8fafc' }} />
          
          {libStatus === 'loading' && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-slate-500">Loading map system...</p>
            </div>
          )}

          {libStatus === 'error' && (
            <div className="flex flex-col items-center gap-3 px-8 text-center">
              <div className="p-3 bg-red-50 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-sm font-bold text-slate-800">Connection Error</p>
              <p className="text-xs text-slate-500">Could not reach the map provider. Please check your internet or try the Quick Select buttons above.</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry Page</Button>
            </div>
          )}

          {libStatus === 'ready' && !coords && (
            <div className="absolute inset-x-0 top-4 z-[1000] flex justify-center pointer-events-none">
                <span className="bg-primary/95 text-white text-[10px] px-4 py-2 rounded-full font-bold shadow-xl animate-bounce border-2 border-white/20">
                    Map is ready! Click to pick a point
                </span>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-white border-t">
          <div className="flex-1 text-xs text-slate-500 hidden sm:block font-medium">
            {coords ? `Point: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Select a point on the map"}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="ghost" className="flex-1 sm:flex-none border" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button className="flex-1 sm:flex-none px-12 font-bold shadow-lg h-11" onClick={handleConfirm} disabled={!coords}>
              Confirm Location
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MapPicker;
