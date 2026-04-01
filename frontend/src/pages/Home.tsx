import { useState } from "react";
import Layout from "@/components/Layout";
import SearchBar from "@/components/SearchBar";
import RideCard, { RideData } from "@/components/RideCard";
import { Button } from "@/components/ui/button";
import { Car, TrendingUp, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Removed mock data

import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const [rides, setRides] = useState<RideData[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/rides/all')
      .then(res => res.json())
      .then(data => {
        if (data.rides) {
          const mappedRides = data.rides.map((r: any) => {
            const dateObj = new Date(r.time);
            return {
              id: r._id,
              driverName: r.createdBy?.name || "Unknown",
              driverRole: r.createdBy?.role || "student",
              isVerified: true, // Assuming true for now
              source: r.fromLocation,
              destination: r.toLocation,
              date: dateObj.toLocaleDateString(),
              time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              availableSeats: r.seatsAvailable,
              totalSeats: 4, // Default visual
              pricePerSeat: 50 // Default visual missing from schema
            };
          });
          setRides(mappedRides);
        }
      })
      .catch(err => console.error("Error fetching rides:", err));
  }, []);

  const handleJoinRide = (rideId: string) => {
    navigate(`/ride/${rideId}`);
  };

  return (
    <Layout userName={user?.name || "Guest"}>
      <div className="container px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in">
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border text-center">
            <div className="w-10 h-10 rounded-lg bg-primary/10 mx-auto mb-2 flex items-center justify-center">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xl font-bold text-foreground">{rides.length}</p>
            <p className="text-xs text-muted-foreground">Active Rides</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border text-center">
            <div className="w-10 h-10 rounded-lg bg-success/10 mx-auto mb-2 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <p className="text-xl font-bold text-foreground">₹500</p>
            <p className="text-xs text-muted-foreground">Saved</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border text-center">
            <div className="w-10 h-10 rounded-lg bg-accent/10 mx-auto mb-2 flex items-center justify-center">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <p className="text-xl font-bold text-foreground">12</p>
            <p className="text-xs text-muted-foreground">Rides Taken</p>
          </div>
        </div>

        {/* Search */}
        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <SearchBar />
        </div>

        {/* Available Rides */}
        <div className="space-y-4">
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
