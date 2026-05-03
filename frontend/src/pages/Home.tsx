import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import SearchBar from "@/components/SearchBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Removed mock data

import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../apiConfig";
import { calculateDistance, getFairPriceEstimate, getPriceStatus } from "../utils/fareUtils";
import { 
  ChevronLeft,
  ChevronRight,
  History,
  Calendar,
  Car,
  Search,
  Clock, 
  MapPin, 
  Users, 
  BadgeCheck 
} from "lucide-react";
import RideCard, { RideData } from "@/components/RideCard";


const Home = () => {
  const [rides, setRides] = useState<RideData[]>([]);
  const [suggestions, setSuggestions] = useState<RideData[]>([]);
  const { user } = useAuth();
  const [stats, setStats] = useState({ ridesTaken: 0, activeRides: 0 });
  const navigate = useNavigate();
  const { toast } = useToast();

  const mapRideData = (r: any, userId?: string) => {
    const dateObj = new Date(r.time);
    return {
      id: r._id,
      driverName: r.createdBy?.name || "Unknown",
      driverRole: r.createdBy?.role || "student",
      isVerified: true, 
      source: r.fromLocation,
      destination: r.toLocation,
      date: dateObj.toLocaleDateString(),
      time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      availableSeats: r.seatsAvailable,
      totalSeats: r.totalSeats || 4,
      pricePerSeat: r.price !== undefined ? r.price : 50,
      driverGender: r.createdBy?.gender,
      driverId: r.createdBy?._id || r.createdBy || "",
      isPassenger: r.requests?.some((req: any) => 
        (req.requester?._id === userId || req.requester === userId) && 
        req.status === "accepted"
      ),
      genderPreference: r.genderPreference,
      priceComparison: (() => {
        if (!r.fromCoords || !r.toCoords || r.price === undefined) return null;
        const distance = calculateDistance(
          r.fromCoords.lat, r.fromCoords.lng,
          r.toCoords.lat, r.toCoords.lng
        );
        const fairPrice = getFairPriceEstimate(distance);
        return {
          fairPrice,
          status: getPriceStatus(r.price, fairPrice)
        };
      })()
    };
  };

  useEffect(() => {
    fetch(getApiUrl('/api/rides/all'))
      .then(res => res.json())
      .then(data => {
        if (data.rides) {
          const mappedRides = data.rides.map((r: any) => mapRideData(r, user?.id));
          setRides(mappedRides);
          setStats(prev => ({ ...prev, activeRides: data.rides.length }));
        }
      })
      .catch(err => console.error("Error fetching rides:", err));

    if (user?.id) {
       fetch(getApiUrl(`/api/rides/dashboard/${user.id}`))
        .then(res => res.json())
        .then(data => {
          if (data.dashboard) {
            setStats(prev => ({ 
              ...prev, 
              ridesTaken: data.dashboard.pastBookedRides?.length || 0 
            }));
          }
        })
        .catch(err => console.error(err));

       fetch(getApiUrl(`/api/rides/suggestions/${user.id}`))
        .then(res => res.json())
        .then(data => {
          if (data.suggestions) {
            const mapped = data.suggestions.map((r: any) => mapRideData(r, user.id));
            setSuggestions(mapped);
          }
        })
        .catch(err => console.error("Error fetching suggestions:", err));
    }
  }, [user]);

  const handleJoinRide = (rideId: string) => {
    navigate(`/ride/${rideId}`);
  };

  return (
    <Layout userName={user?.name || "Guest"}>
      <div className="container px-4 py-6 space-y-6">
        {/* Quick Stats */}
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          <Card 
            className="premium-card bg-primary/10 border-primary/20 rounded-[2.5rem] p-8 group flex flex-col items-center text-center transition-transform active:scale-95"
            onClick={() => {
              const element = document.getElementById('available-rides');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="p-4 rounded-3xl bg-primary/20 mb-4 group-hover:scale-110 transition-transform">
              <Car className="h-8 w-8 text-primary" />
            </div>
            <p className="text-5xl font-black text-primary tracking-tighter">{stats.activeRides}+</p>
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-3">Active Rides</p>
          </Card>
          
          <Card 
            className="premium-card bg-accent/10 border-accent/20 rounded-[2.5rem] p-8 group flex flex-col items-center text-center transition-transform active:scale-95"
            onClick={() => navigate("/profile")}
          >
            <div className="p-4 rounded-3xl bg-accent/20 mb-4 group-hover:scale-110 transition-transform">
              <Clock className="h-8 w-8 text-accent" />
            </div>
            <p className="text-5xl font-black text-accent tracking-tighter">{stats.ridesTaken}</p>
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-3">My Journeys</p>
          </Card>
        </div>

        {/* Search */}
        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <SearchBar />
        </div>

        {/* Suggested for You */}
        {suggestions.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both space-y-4">
            <div className="flex items-center gap-2 px-1">
              <History className="h-4 w-4 text-primary" />
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Suggested for You</h2>
            </div>
            <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide snap-x">
              {suggestions.map((ride, index) => (
                <div key={ride.id} className="min-w-[300px] snap-center">
                  <RideCard ride={ride} onJoinRide={handleJoinRide} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History List */}
        <div className="px-4 space-y-6">
          {/* Available Rides */}
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both" id="available-rides">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Nearby Rides</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary font-black uppercase text-[10px] hover:bg-primary/10 rounded-full px-4"
                onClick={() => navigate("/search")}
              >
                See all
              </Button>
            </div>
    
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rides.map((ride, index) => (
                <div 
                  key={ride.id} 
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                  style={{ animationDelay: `${0.15 + index * 0.05}s` }}
                >
                  <RideCard ride={ride} onJoinRide={handleJoinRide} />
                </div>
              ))}
              {rides.length === 0 && (
                <div className="col-span-full py-20 text-center bg-secondary/10 rounded-[3rem] border border-dashed border-border/50">
                  <div className="w-16 h-16 rounded-[2rem] bg-muted/50 mx-auto mb-4 flex items-center justify-center">
                    <Car className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest">No rides available</h3>
                  <p className="text-[10px] text-muted-foreground mb-6 uppercase tracking-widest">Be the first to offer a ride today!</p>
                  <Button className="rounded-2xl px-8" onClick={() => navigate("/create-ride")}>
                    Create Ride
                  </Button>
                </div>
              )}
            </div>
            {/* Deployment Verification Anchor */}
            <p className="text-[8px] text-muted-foreground/30 uppercase tracking-widest mt-1">SmartPool Dashboard v2.5</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
