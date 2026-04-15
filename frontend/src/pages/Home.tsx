import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import SearchBar from "@/components/SearchBar";
import RideCard, { RideData } from "@/components/RideCard";
import { Button } from "@/components/ui/button";
import { Car, TrendingUp, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Removed mock data

import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../apiConfig";


const Home = () => {
  const [rides, setRides] = useState<RideData[]>([]);
  const { user } = useAuth();
  const [stats, setStats] = useState({ ridesTaken: 0, activeRides: 0 });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetch(getApiUrl('/api/rides/all'))
      .then(res => res.json())
      .then(data => {
        if (data.rides) {
          const mappedRides = data.rides.map((r: any) => {
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
              driverId: r.createdBy?._id || r.createdBy || "",
              isPassenger: r.requests?.some((req: any) => 
                (req.requester?._id === user?.id || req.requester === user?.id) && 
                req.status === "accepted"
              )
            };
          });
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
    }
  }, [user]);

  const handleJoinRide = (rideId: string) => {
    navigate(`/ride/${rideId}`);
  };

  return (
    <Layout userName={user?.name || "Guest"}>
      <div className="container px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div 
            className="premium-card rounded-3xl p-6 shadow-soft text-center cursor-pointer group flex flex-col items-center justify-center bg-gradient-to-br from-card to-secondary/30"
            onClick={() => {
              const element = document.getElementById('available-rides');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 mx-auto mb-3 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:bg-primary/20">
              <Car className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-black text-foreground tracking-tighter">{stats.activeRides}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Rides</p>
            </div>
          </div>
          
          <div 
            className="premium-card rounded-3xl p-6 shadow-soft text-center cursor-pointer group flex flex-col items-center justify-center bg-gradient-to-br from-card to-secondary/30"
            onClick={() => navigate("/profile")}
          >
            <div className="w-14 h-14 rounded-2xl bg-accent/10 mx-auto mb-3 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:bg-accent/20">
              <Clock className="h-7 w-7 text-accent" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-black text-foreground tracking-tighter">{stats.ridesTaken}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rides Taken</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <SearchBar />
        </div>

        {/* Available Rides */}
        <div className="space-y-6" id="available-rides">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-foreground tracking-tight">Available Rides</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary font-bold hover:bg-primary/10 rounded-full px-4"
              onClick={() => navigate("/search")}
            >
              See all
            </Button>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rides.map((ride, index) => (
              <div 
                key={ride.id} 
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${0.15 + index * 0.05}s`, animationFillMode: 'both' }}
              >
                <RideCard ride={ride} onJoinRide={handleJoinRide} />
              </div>
            ))}
          </div>

        {/* Empty State (when no rides) */}
        {rides.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Car className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No rides available</h3>
            <p className="text-muted-foreground mb-4">Be the first to create a ride!</p>
            <Button onClick={() => navigate("/create-ride")}>
              Create Ride
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Home;
