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
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          <Card 
            className="premium-card bg-primary/10 border-primary/20 rounded-[2rem] p-5 group flex flex-col items-center sm:items-start text-center sm:text-left transition-transform active:scale-95"
            onClick={() => {
              const element = document.getElementById('available-rides');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="p-2.5 rounded-2xl bg-primary/20 mb-3 group-hover:scale-110 transition-transform">
              <Car className="h-6 w-6 text-primary" />
            </div>
            <p className="text-3xl font-black text-primary tracking-tighter">{stats.activeRides}+</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-1">Active Rides</p>
          </Card>
          
          <Card 
            className="premium-card bg-accent/10 border-accent/20 rounded-[2rem] p-5 group flex flex-col items-center sm:items-start text-center sm:text-left transition-transform active:scale-95"
            onClick={() => navigate("/profile")}
          >
            <div className="p-2.5 rounded-2xl bg-accent/20 mb-3 group-hover:scale-110 transition-transform">
              <Clock className="h-6 w-6 text-accent" />
            </div>
            <p className="text-3xl font-black text-accent tracking-tighter">{stats.ridesTaken}</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-1">My Journeys</p>
          </Card>

          <Card className="premium-card bg-success/10 border-success/20 rounded-[2rem] p-5 group flex flex-col items-center sm:items-start text-center sm:text-left transition-transform active:scale-95 hidden lg:flex">
            <div className="p-2.5 rounded-2xl bg-success/20 mb-3 group-hover:scale-110 transition-transform">
              <MapPin className="h-6 w-6 text-success" />
            </div>
            <p className="text-3xl font-black text-success tracking-tighter">15+</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-1">Campus Routes</p>
          </Card>

          <Card className="premium-card bg-warning/10 border-warning/20 rounded-[2rem] p-5 group flex flex-col items-center sm:items-start text-center sm:text-left transition-transform active:scale-95 hidden lg:flex">
            <div className="p-2.5 rounded-2xl bg-warning/20 mb-3 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6 text-warning" />
            </div>
            <p className="text-3xl font-black text-warning tracking-tighter">1.2k</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-1">Verified Users</p>
          </Card>
        </div>

        {/* Search */}
        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <SearchBar />
        </div>

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
  
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
          <p className="text-[8px] text-muted-foreground/20 text-center uppercase tracking-widest pt-8">SmartPool Dashboard v2.2</p>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
