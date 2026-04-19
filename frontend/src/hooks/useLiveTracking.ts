import { useState, useEffect, useCallback, useRef } from "react";
import { useNotifications } from "../context/NotificationContext";
import { toast } from "@/hooks/use-toast";

interface Location {
  lat: number;
  lng: number;
  role?: string;
}

// Haversine formula to calculate distance in meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // In meters
};

export const useLiveTracking = (
  rideId: string, 
  userId: string, 
  role: 'driver' | 'passenger', 
  active: boolean,
  destinationCoords?: { lat: number, lng: number } | null
) => {
  const { socket } = useNotifications();
  const [myLocation, setMyLocation] = useState<Location | null>(null);
  const [otherLocation, setOtherLocation] = useState<Location | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [distanceToDestination, setDistanceToDestination] = useState<number | null>(null);
  const lastAlertThreshold = useRef<number | null>(null);

  // Join ride room
  useEffect(() => {
    if (socket && rideId && active) {
      socket.emit("join-ride", rideId);
    }
  }, [socket, rideId, active]);

  // Handle Geolocation
  useEffect(() => {
    let watchId: number;
    const hasShownErrorToast = { current: false };

    const startTracking = () => {
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude: lat, longitude: lng } = position.coords;
            const newLoc = { lat, lng };
            setMyLocation(newLoc);
            
            // Send to socket only if active
            if (active && socket && rideId) {
              socket.emit("location-update", { rideId, lat, lng, role });
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
            if (!hasShownErrorToast.current) {
                let description = "Failed to get your location.";
                if (error.code === 1) {
                  description = "Location permission denied. Please allow access to see yourself on the map.";
                } else if (error.code === 2) {
                  description = "Location information is unavailable.";
                } else if (error.code === 3) {
                  description = "Location request timed out.";
                }
                
                toast({
                  title: "Location Unreachable",
                  description,
                  variant: "destructive",
                });
                hasShownErrorToast.current = true;
            }
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
        );
      } else {
        toast({
          title: "Not Supported",
          description: "Geolocation is not supported by your browser.",
          variant: "destructive",
        });
      }
    };

    startTracking();

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [active, rideId, socket, role]); // Keep active in dependency to trigger socket updates when state changes

  // Listen for other user's location
  useEffect(() => {
    if (!socket || !active) return;

    const handleOtherLocation = (data: any) => {
      console.log("[Tracking] Received location update:", data);
      
      // Only care if it's from the same ride and not from me
      if (data.userId && data.userId !== userId) {
        console.log("[Tracking] Setting other location for user:", data.userId);
        setOtherLocation({ lat: data.lat, lng: data.lng, role: data.role });
      }
    };

    socket.on("location:received", handleOtherLocation);

    return () => {
      socket.off("location:received", handleOtherLocation);
    };
  }, [socket, active, userId]);

  // Proximity Engine
  useEffect(() => {
    if (myLocation) {
        // Distance to other person
        if (otherLocation) {
          const d = calculateDistance(myLocation.lat, myLocation.lng, otherLocation.lat, otherLocation.lng);
          setDistance(d);

          // Alert Thresholds: 100m, 50m, 25m
          const thresholds = [100, 50, 25];
          for (const threshold of thresholds) {
              if (d <= threshold && (lastAlertThreshold.current === null || lastAlertThreshold.current > threshold)) {
                  toast({
                      title: `Proximity Alert: ${threshold}m 🚗`,
                      description: `The ${otherLocation.role || 'other person'} is less than ${threshold} meters away!`,
                      variant: "default",
                  });
                  lastAlertThreshold.current = threshold;
                  break;
              }
          }
        }

        // Distance to destination
        if (destinationCoords?.lat && destinationCoords?.lng) {
          const dToDest = calculateDistance(myLocation.lat, myLocation.lng, destinationCoords.lat, destinationCoords.lng);
          setDistanceToDestination(dToDest);
        }
    }
  }, [myLocation, otherLocation, destinationCoords]);

  return { myLocation, otherLocation, distance, distanceToDestination };
};
