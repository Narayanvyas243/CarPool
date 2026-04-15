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
  ChevronRight,
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
        <div className="pt-10 pb-6 px-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md shadow-soft hover:bg-white/80 transition-all active:scale-90"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-3xl font-black text-foreground tracking-tighter">Ride History</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Your journey timeline</p>
          </div>
        </div>

        {/* Filters/Tabs */}
        <div className="px-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          <div className="flex gap-1 p-1.5 bg-secondary/40 rounded-[1.25rem] backdrop-blur-sm border border-border/40">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setFilter('all')}
              className={`flex-1 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all h-10 ${
                filter === 'all' ? 'bg-white dark:bg-slate-900 shadow-premium text-primary border border-primary/10' : 'text-muted-foreground hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              All
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setFilter('offered')}
              className={`flex-1 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all h-10 ${
                filter === 'offered' ? 'bg-white dark:bg-slate-900 shadow-premium text-primary border border-primary/10' : 'text-muted-foreground hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              Offered
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setFilter('taken')}
              className={`flex-1 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all h-10 ${
                filter === 'taken' ? 'bg-white dark:bg-slate-900 shadow-premium text-primary border border-primary/10' : 'text-muted-foreground hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              Taken
            </Button>
          </div>
        </div>

        {/* History List */}
        <div className="px-4 space-y-5">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted/50 animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : filteredRides.length > 0 ? (
            filteredRides.map((ride, idx) => (
              <div 
                key={ride._id || idx} 
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${0.2 + idx * 0.05}s` }}
              >
                <Card 
                  className="premium-card rounded-3xl overflow-hidden hover:border-primary/30 cursor-pointer active:scale-[0.98] transition-all bg-white/40 backdrop-blur-sm border-white/40"
                  onClick={() => navigate(`/ride/${ride._id || ride.rideId}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${
                            ride.type === 'Booked' ? 'bg-success/10 text-success' :
                            ride.type === 'Offered' ? 'bg-primary/10 text-primary' :
                            ride.type === 'Taken' ? 'bg-accent/10 text-accent' :
                            'bg-muted text-muted-foreground' // Completed
                          }`}>
                            {ride.type}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-secondary/50 px-2.5 py-1 rounded-full border border-border/40">
                            {new Date(ride.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        <h3 className="font-black text-foreground text-sm tracking-tight line-clamp-1">
                          {ride.fromLocation} → {ride.toLocation}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-primary tracking-tighter">₹{ride.price || 50}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(ride.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                      <div className="flex items-center gap-2">
                         <div className="p-1.5 rounded-lg bg-secondary/50">
                           <Car className="h-3.5 w-3.5 text-primary" />
                         </div>
                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate max-w-[120px]">
                           {ride.vehicleDetails || "Standard Ride"}
                         </span>
                      </div>
                      <div className="flex items-center gap-1 text-primary group-hover:translate-x-1 transition-transform">
                        <span className="text-[10px] font-black uppercase tracking-widest">Details</span>
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
