import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { 
  History, 
  MapPin, 
  Car, 
  Calendar, 
  ChevronLeft,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../apiConfig";


const RideHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'offered' | 'taken'>('all');

  const fetchHistory = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await fetch(getApiUrl(`/api/rides/dashboard/${user.id}`));
      const data = await res.json();
      if (data.dashboard) {
        // Compose a unified list of rides (taken & offered)
        const allRides = [
          ...data.dashboard.bookedRides.map((r: any) => ({
            ...r,
            type: new Date(r.time) < new Date() ? 'Taken' : 'Booked'
          })),
          ...data.dashboard.createdRides.map((r: any) => ({
            ...r,
            type: new Date(r.time) < new Date() ? 'Completed' : 'Offered'
          }))
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        
        setRides(allRides);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const filteredRides = rides.filter(ride => {
    if (filter === 'all') return true;
    if (filter === 'offered') return ride.type === 'Offered' || ride.type === 'Completed';
    if (filter === 'taken') return ride.type === 'Taken' || ride.type === 'Booked';
    return true;
  });

  return (
    <Layout showHeader={false}>
      <div className="bg-gradient-hero min-h-screen pb-24">
        {/* Header */}
        <div className="pt-8 pb-6 px-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-full bg-background/50 backdrop-blur-sm"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Ride History</h1>
        </div>

        {/* Filters/Tabs */}
        <div className="px-4 mb-6">
          <div className="flex gap-2 p-1 bg-muted/30 rounded-xl backdrop-blur-sm">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setFilter('all')}
              className={`flex-1 text-xs font-semibold rounded-lg transition-all ${
                filter === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'
              }`}
            >
              All Rides
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setFilter('offered')}
              className={`flex-1 text-xs font-semibold rounded-lg transition-all ${
                filter === 'offered' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'
              }`}
            >
              Offered
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setFilter('taken')}
              className={`flex-1 text-xs font-semibold rounded-lg transition-all ${
                filter === 'taken' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'
              }`}
            >
              Taken
            </Button>
          </div>
        </div>

        {/* History List */}
        <div className="px-4 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : filteredRides.length > 0 ? (
            filteredRides.map((ride, idx) => (
              <Card 
                key={ride._id || idx} 
                className="border-0 shadow-soft overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer animate-fade-in"
                onClick={() => navigate(`/ride/${ride._id || ride.rideId}`)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          ride.type === 'Booked' ? 'bg-success/10 text-success' :
                          ride.type === 'Offered' ? 'bg-primary/10 text-primary' :
                          ride.type === 'Taken' ? 'bg-accent/10 text-accent' :
                          'bg-muted text-muted-foreground' // Completed
                        }`}>
                          {ride.type}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                          <Calendar className="h-3 w-3" />
                          {new Date(ride.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="font-bold text-foreground">
                        {ride.fromLocation} → {ride.toLocation}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary">₹{ride.price || 50}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(ride.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2">
                       <Car className="h-3 w-3 text-muted-foreground" />
                       <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[120px]">
                         {ride.vehicleDetails || "Standard Vehicle"}
                       </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-accent" />
                      <span className="text-[10px] font-semibold text-foreground">View Details</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
              <div className="bg-primary/5 p-6 rounded-full mb-4">
                <History className="h-12 w-12 text-primary/40" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                {filter === 'all' ? "You have not traveled" : 
                 filter === 'offered' ? "You have not offered any rides" : 
                 "You have not taken any rides"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-[200px] mb-6">
                {filter === 'all' ? "Ready to start your journey? Find a ride or offer one today." : 
                 filter === 'offered' ? "Share your journey with others. Create a ride to get started." :
                 "Travel made easy. Book your first ride today."}
              </p>
              <Button 
                onClick={() => navigate(filter === 'offered' ? "/create-ride" : "/search")}
                className="rounded-full px-8 shadow-elevated"
              >
                {filter === 'offered' ? "Offer a Ride" : "Find a Ride"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RideHistory;
