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
        <div className="grid grid-cols-2 gap-4 animate-fade-in">
          <div 
            className="bg-card rounded-xl p-4 shadow-soft border border-border text-center cursor-pointer hover:border-primary transition-colors h-full flex flex-col items-center justify-center"
            onClick={() => {
              const element = document.getElementById('available-rides');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 mx-auto mb-2 flex items-center justify-center">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xl font-bold text-foreground">{stats.activeRides}</p>
            <p className="text-xs text-muted-foreground">Active Rides</p>
          </div>
          
          <div 
            className="bg-card rounded-xl p-4 shadow-soft border border-border text-center cursor-pointer hover:border-accent transition-colors h-full flex flex-col items-center justify-center"
            onClick={() => navigate("/profile")}
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 mx-auto mb-2 flex items-center justify-center">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <p className="text-xl font-bold text-foreground">{stats.ridesTaken}</p>
            <p className="text-xs text-muted-foreground">Rides Taken</p>
          </div>
        </div>

        {/* Search */}
        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <SearchBar />
        </div>

        {/* Available Rides */}
        <div className="space-y-4" id="available-rides">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Available Rides</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              See all
            </Button>
          </div>

          <div className="space-y-4">
            {rides.map((ride, index) => (
              <div 
                key={ride.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${0.15 + index * 0.05}s` }}
              >
                <RideCard ride={ride} onJoinRide={handleJoinRide} />
              </div>
            ))}
          </div>
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
