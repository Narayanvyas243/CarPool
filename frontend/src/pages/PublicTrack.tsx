import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { getApiUrl } from "../apiConfig";
import RideMap from "@/components/RideMap";
import { io, Socket } from "socket.io-client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Clock, ShieldCheck, Navigation } from "lucide-react";

const PublicTrack = () => {
  const { id } = useParams();
  const [ride, setRide] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Fetch public ride details
    fetch(getApiUrl(`/api/rides/track/${id}`))
      .then(res => res.json())
      .then(data => {
        if (!data.message) {
          setRide(data);
        }
      })
      .catch(err => console.error("Error fetching ride", err))
      .finally(() => setIsLoading(false));

    // Connect to socket for public tracking
    socketRef.current = io(getApiUrl(""));
    socketRef.current.emit("join-public-tracking", id);

    socketRef.current.on("location-update", (data) => {
      if (data.role === 'driver') {
        setDriverLocation({ lat: data.lat, lng: data.lng });
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading Tracker...</div>;
  }

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center flex-col">
        <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-xl font-bold">Link Expired or Invalid</h2>
        <p className="text-muted-foreground text-sm mt-2">This live tracking link is no longer active.</p>
      </div>
    );
  }

  const mapFrom = { lat: ride.fromCoords?.lat, lng: ride.fromCoords?.lng, name: ride.fromLocation };
  const mapTo = { lat: ride.toCoords?.lat, lng: ride.toCoords?.lng, name: ride.toLocation };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary px-4 py-4 shadow-md z-10 flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-full">
          <Navigation className="h-6 w-6 text-white animate-pulse" />
        </div>
        <div className="text-white">
          <h1 className="font-black tracking-tight leading-tight text-lg">SmartPool Live Tracking</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 flex items-center gap-1 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
          </p>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <RideMap 
          from={mapFrom} 
          to={mapTo} 
          markers={
            driverLocation 
              ? [{ lat: driverLocation.lat, lng: driverLocation.lng, label: "Driver", color: "blue" }] 
              : []
          }
        />
        
        {/* Status Overlay */}
        <div className="absolute top-4 left-4 right-4 z-[1000]">
          {!driverLocation && ride.status !== 'completed' && (
            <div className="bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-lg border border-border/50 flex items-center gap-3 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-slate-700">Waiting for driver's GPS signal...</span>
            </div>
          )}
          {driverLocation && ride.status !== 'completed' && (
            <div className="bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-lg border border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-700">Driver is en route</span>
              </div>
            </div>
          )}
          {ride.status === 'completed' && (
            <div className="bg-green-500/90 backdrop-blur-md rounded-xl p-3 shadow-lg flex items-center gap-3 text-white">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-bold">Ride Completed Safely</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Info Sheet */}
      <div className="bg-background rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20 -mt-6 pt-6 pb-8 px-5">
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
        
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-14 w-14 ring-2 ring-primary/10">
            <AvatarFallback className="bg-primary/5 text-primary text-lg font-bold">
              {(ride.createdBy?.name || 'D').charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-0.5">Driver</p>
            <p className="font-bold text-lg leading-tight">{ride.createdBy?.name || "Driver"}</p>
            <p className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground w-fit mt-1 uppercase font-semibold">
              {ride.createdBy?.role || "Student"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center mt-1">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <div className="w-0.5 h-8 bg-border" />
              <MapPin className="h-4 w-4 text-accent" />
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5">From</p>
                <p className="text-sm font-semibold text-foreground leading-tight">{ride.fromLocation}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5">To</p>
                <p className="text-sm font-semibold text-foreground leading-tight">{ride.toLocation}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Started: {new Date(ride.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded"><ShieldCheck className="h-3.5 w-3.5" /> Secure Tracking</span>
        </div>
      </div>
    </div>
  );
};

export default PublicTrack;
