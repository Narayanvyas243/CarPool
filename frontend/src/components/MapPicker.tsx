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
  type?: 'pickup' | 'dropoff';
}

const MapPicker = ({ onLocationSelect, title = "Select Location", initialLocation, type = 'pickup' }: MapPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [libStatus, setLibStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedName, setSelectedName] = useState("");
  const [mapType, setMapType] = useState<'voyager' | 'satellite'>('voyager');
  const [isLocating, setIsLocating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dehradun Bounding Box
  const DDN_BOUNDS = {
    minLat: 30.15,
    maxLat: 30.55,
    minLng: 77.75,
    maxLng: 78.30
  };

  const isLocationInDehradun = (lat: number, lng: number) => {
    return lat >= DDN_BOUNDS.minLat && 
           lat <= DDN_BOUNDS.maxLat && 
           lng >= DDN_BOUNDS.minLng && 
           lng <= DDN_BOUNDS.maxLng;
  };
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  // Handle checking for Leaflet (L) global
  useEffect(() => {
    if (!isOpen) return;

    const check = () => {
      if ((window as any).L) {
        setLibStatus('ready');
        return true;
      }
      return false;
    };

    if (!check()) {
        const timer = setInterval(() => {
            if (check()) clearInterval(timer);
        }, 100);
        return () => clearInterval(timer);
    }
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

        // Initial layer
        const layerUrl = mapType === 'satellite' 
          ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' 
          : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
        
        tileLayerRef.current = L.tileLayer(layerUrl, {
          maxZoom: mapType === 'satellite' ? 18 : 20,
          maxNativeZoom: 18,
          crossOrigin: true,
          attribution: '&copy; Google Maps'
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
          
          if (!isLocationInDehradun(lat, lng)) {
            setErrorMsg("This location is outside Dehradun. Please select a point within the city/university area.");
            return;
          }
          
          setErrorMsg(null);
          setCoords({ lat, lng });
          setSelectedName(""); // Clear locked name on manual click
          
          if (markerInstance.current) {
            markerInstance.current.setLatLng(e.latlng);
          } else {
            markerInstance.current = L.marker(e.latlng, { icon: customIcon }).addTo(mapInstance.current!);
          }

          // UX Improvement: Destinations don't need the precision modal
          if (type === 'dropoff') {
            // Wait a tiny bit for the marker animation/placement to feel natural
            setTimeout(() => {
               handleConfirmDirectly({ lat, lng });
            }, 300);
          } else {
            setIsConfirming(true); // Ask for confirmation only for pickups
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
        tileLayerRef.current = null;
      }
    };
  }, [isOpen, libStatus]);

  // Handle Resize Visibility (Fixes "White Map" bug)
  useEffect(() => {
    if (!mapContainerRef.current || !isOpen) return;
    
    // Resize Observer handles standard layout changes
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    });

    resizeObserver.observe(mapContainerRef.current);
    
    // Aggressive "Wake-up" cycle: Invalidate size repeatedly for the first 1.5s
    // This solves issues where the container is animating or has lazy dimensions
    let count = 0;
    const wakeUpInterval = setInterval(() => {
        if (mapInstance.current) {
            mapInstance.current.invalidateSize();
        }
        count++;
        if (count > 15) clearInterval(wakeUpInterval);
    }, 100);

    return () => {
        resizeObserver.disconnect();
        clearInterval(wakeUpInterval);
    };
  }, [isOpen, libStatus]);

  // Handle layer switching
  useEffect(() => {
    if (mapInstance.current && (window as any).L) {
      const L = (window as any).L;
      if (tileLayerRef.current) {
        mapInstance.current.removeLayer(tileLayerRef.current);
      }
      
      const layerUrl = mapType === 'satellite' 
        ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' 
        : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      
      tileLayerRef.current = L.tileLayer(layerUrl, {
        maxZoom: mapType === 'satellite' ? 18 : 20,
        maxNativeZoom: 18,
        crossOrigin: true,
        attribution: '&copy; Google Maps'
      }).addTo(mapInstance.current);
    }
  }, [mapType]);

  const handleSearch = async () => {
    if (!searchQuery || !mapInstance.current) return;
    setErrorMsg(null);
    
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

      // UX Improvement: Auto-confirm campus selection for dropoff
      if (type === 'dropoff') {
        setTimeout(() => handleConfirmDirectly(campusOverride), 500);
      } else {
        setIsConfirming(true);
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

        if (!isLocationInDehradun(lat, lon)) {
          setErrorMsg("Found location is outside Dehradun. Please search for an area closer to UPES/Dehradun.");
          setIsSearching(false);
          return;
        }

        setCoords({ lat, lng: lon });
        setSelectedName(""); // Clear locked name on new search
        setIsConfirming(true);
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
      setIsLocating(true);
      const L = (window as any).L;
      
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          
          if (!isLocationInDehradun(latitude, longitude)) {
            setErrorMsg("Your current location is outside Dehradun. Please manually select a point on the map.");
            setIsLocating(false);
            return;
          }
          
          setErrorMsg(null);
          setCoords({ lat: latitude, lng: longitude });
          
          if (type === 'pickup') {
            setIsConfirming(true);
          } else {
            // For dropoff, just show it on map and let them confirm if they want, 
            // but usually people use search for dropoff.
            // If they click 'Locate Me' for dropoff, we just set coords.
          }

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

          // Smart Proximity Check
          const findNearbyCampus = () => {
            for (const loc of QUICK_LOCATIONS) {
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
              })
              .catch(() => {
                setSearchQuery(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
              });
          }
          setIsLocating(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsLocating(false);
          let errorMsg = "Could not get your location.";
          if (error.code === 1) errorMsg = "Location permission denied. Please allow location access in your browser settings.";
          else if (error.code === 2) errorMsg = "Location information is unavailable.";
          else if (error.code === 3) errorMsg = "The request to get user location timed out.";
          
          alert(errorMsg); // Using alert as fallback, but could use toast
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // New helper for skipping the modal
  const handleConfirmDirectly = async (targetCoords: {lat: number, lng: number}) => {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${targetCoords.lat}&lon=${targetCoords.lng}`);
        const data = await res.json();
        const addressParts = data.display_name.split(',');
        const address = addressParts.length > 2 ? addressParts.slice(0, 3).join(',') : data.display_name;
        onLocationSelect({ address, lat: targetCoords.lat, lng: targetCoords.lng });
      } catch {
        onLocationSelect({ address: "Selected Location", lat: targetCoords.lat, lng: targetCoords.lng });
      }
      setIsOpen(false);
  };

  const handleConfirm = async () => {
    if (coords) {
      if (selectedName) {
        // If we have a locked name (from Quick Select), use it directly
        onLocationSelect({ address: selectedName, lat: coords.lat, lng: coords.lng });
        setIsOpen(false);
        return;
      }

      await handleConfirmDirectly(coords);
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
            <Button variant="outline" onClick={handleLocateMe} disabled={isLocating} className="h-11 px-3 border-slate-200 shadow-sm" title="Locate Me">
              {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4 text-slate-600" />}
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
                  if (!isLocationInDehradun(loc.lat, loc.lng)) {
                    setErrorMsg("This preset is outside the currently allowed boundary.");
                    return;
                  }
                  setErrorMsg(null);
                  setCoords({ lat: loc.lat, lng: loc.lng });
                  setSearchQuery(loc.name);
                  setSelectedName(loc.name); // Lock the name
                  setIsConfirming(true);
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

        <div className="flex-1 min-h-[300px] relative z-0 border-y flex items-center justify-center">
          <div ref={mapContainerRef} className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${libStatus === 'ready' ? 'opacity-100' : 'opacity-0'}`} />
          
          {/* Layer Toggle Floating Button */}
          {libStatus === 'ready' && (
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                className="shadow-xl border-2 border-white/50 bg-white/90 backdrop-blur-md hover:bg-white font-bold text-[11px] h-9 px-3 text-slate-700"
                onClick={() => setMapType(mapType === 'voyager' ? 'satellite' : 'voyager')}
              >
                {mapType === 'voyager' ? "Satellite View" : "Street View"}
              </Button>
            </div>
          )}
          
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

          {libStatus === 'ready' && !coords && !errorMsg && (
            <div className="absolute inset-x-0 top-4 z-[1000] flex justify-center pointer-events-none">
                <span className="bg-primary/95 text-white text-[10px] px-4 py-2 rounded-full font-bold shadow-xl animate-bounce border-2 border-white/20">
                    Map is ready! Click to pick a point
                </span>
            </div>
          )}

          {errorMsg && (
            <div className="absolute inset-x-0 top-4 z-[1000] flex justify-center px-4">
                <div className="bg-red-600 text-white text-[11px] px-4 py-3 rounded-xl font-bold shadow-2xl flex items-center gap-2 border-2 border-white/20 animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle className="h-4 w-4" />
                    {errorMsg}
                </div>
            </div>
          )}

          {isConfirming && coords && (
            <div className="absolute inset-0 z-[1001] bg-slate-900/60 backdrop-blur-[3px] flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-[32px] p-8 shadow-2xl max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200 border border-slate-100">
                <div className="relative mx-auto w-20 h-20">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                  <div className="relative w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                    <MapPin className="h-10 w-10 text-white" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Precision Location</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    We've captured your exact coordinates within the Dehradun region. This helps drivers find you precisely.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-primary">
                    FIX
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coordinates</p>
                    <p className="text-xs font-mono font-bold text-slate-700 truncate">{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 h-12 rounded-2xl border-slate-200 font-bold text-slate-600" onClick={() => setIsConfirming(false)}>Adjust</Button>
                  <Button className="flex-1 h-12 rounded-2xl font-bold shadow-xl shadow-primary/40 bg-primary hover:bg-primary/90 transition-all active:scale-95" onClick={handleConfirm}>Confirm Spot</Button>
                </div>
              </div>
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
