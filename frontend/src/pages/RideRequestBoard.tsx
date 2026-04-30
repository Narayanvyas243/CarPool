import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, MapPin, Phone, ArrowRight, UserPlus, Users, MessageCircle, Filter, X, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../apiConfig";
import { useToast } from "@/hooks/use-toast";
import PostRequestModal from "@/components/PostRequestModal";

interface RideRequest {
  _id: string;
  requester: {
    _id: string;
    name: string;
    role: string;
    gender: string;
    phone: string;
  };
  fromLocation: string;
  toLocation: string;
  time: string;
  seatsNeeded: number;
  status: string;
}

const RideRequestBoard = () => {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filter States
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterTime, setFilterTime] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  const routeSequence = [
    { keywords: ["bidholi"], name: "UPES Bidholi" },
    { keywords: ["kandoli"], name: "UPES Kandoli" },
    { keywords: ["prem nagar", "premnagar"], name: "Prem Nagar" },
    { keywords: ["clock tower", "ghanta ghar", "clocktower"], name: "Clock Tower" },
    { keywords: ["railway", "station"], name: "Railway Station" },
    { keywords: ["isbt"], name: "ISBT Dehradun" }
  ];

  const getLocationIndex = (loc: string) => {
    if (!loc) return -1;
    const lowerLoc = loc.toLowerCase();
    return routeSequence.findIndex(stop => 
      stop.keywords.some(kw => lowerLoc.includes(kw))
    );
  };

  const getFilteredRequests = () => {
    return requests.filter(req => {
      let locationMatch = true;
      let timeMatch = true;

      if (filterFrom || filterTo) {
        const dF = getLocationIndex(filterFrom);
        const dT = getLocationIndex(filterTo);
        const rF = getLocationIndex(req.fromLocation);
        const rT = getLocationIndex(req.toLocation);

        if (dF !== -1 && dT !== -1 && rF !== -1 && rT !== -1 && dF !== dT) {
          const driverDir = Math.sign(dT - dF);
          const reqDir = Math.sign(rT - rF);
          
          if (driverDir === reqDir) {
            if (driverDir === 1) {
              locationMatch = (rF >= dF) && (rT <= dT);
            } else {
              locationMatch = (rF <= dF) && (rT >= dT);
            }
          } else {
            locationMatch = false; 
          }
        } else {
          const fromMatch = !filterFrom || req.fromLocation.toLowerCase().includes(filterFrom.toLowerCase());
          const toMatch = !filterTo || req.toLocation.toLowerCase().includes(filterTo.toLowerCase());
          locationMatch = fromMatch && toMatch;
        }
      }

      if (filterTime && locationMatch) {
        const driverDate = new Date(filterTime).getTime();
        const reqDate = new Date(req.time).getTime();
        const ONE_HOUR = 60 * 60 * 1000;
        timeMatch = Math.abs(driverDate - reqDate) <= ONE_HOUR;
      }

      return locationMatch && timeMatch;
    });
  };

  const filteredRequests = getFilteredRequests();

  const fetchRequests = () => {
    setIsLoading(true);
    fetch(getApiUrl("/api/ride-requests"))
      .then(res => res.json())
      .then(data => {
        if (data.posts) setRequests(data.posts);
      })
      .catch(err => console.error("Error fetching ride requests", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <Layout userName={user?.name || "Guest"}>
      <div className="container px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground tracking-tighter">Ride Board</h1>
            <p className="text-muted-foreground font-medium text-sm">Students looking for a ride right now.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={showFilters ? "default" : "outline"}
              className="rounded-full h-12 w-12 p-0 shrink-0"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? <X className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
            </Button>
            <Button 
              className="rounded-full h-12 px-6 shadow-lg shadow-primary/20"
              onClick={() => setIsModalOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" /> Request Ride
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="border-0 shadow-soft overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <CardContent className="p-4 sm:p-6 bg-secondary/20">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground text-sm">Driver Route Filter</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Your Route From</label>
                  <Input 
                    placeholder="e.g. Bidholi" 
                    value={filterFrom} 
                    onChange={e => setFilterFrom(e.target.value)} 
                    className="bg-background h-11 border-border/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Your Route To</label>
                  <Input 
                    placeholder="e.g. Railway Station" 
                    value={filterTo} 
                    onChange={e => setFilterTo(e.target.value)} 
                    className="bg-background h-11 border-border/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Departure Time</label>
                  <Input 
                    type="datetime-local" 
                    value={filterTime} 
                    onChange={e => setFilterTime(e.target.value)} 
                    className="bg-background h-11 border-border/50"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-border/50">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium max-w-md">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
                  See passengers whose requests fall along your exact route. Time filter matches requests within ±1 hour.
                </p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-9 px-4 text-xs font-semibold"
                  onClick={() => { setFilterFrom(""); setFilterTo(""); setFilterTime(""); }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-20 bg-secondary/20 rounded-[2rem] border border-dashed border-border/50">
            <div className="w-16 h-16 rounded-[2rem] bg-muted/50 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">No matching requests</h3>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">Adjust your filters or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map((req) => {
              const dateObj = new Date(req.time);
              const formattedDate = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
              const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <Card key={req._id} className="border-0 shadow-soft overflow-hidden hover:shadow-md transition-all">
                  <div className="p-4 bg-gradient-to-r from-secondary/50 to-transparent flex items-center justify-between border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {req.requester.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{req.requester.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {req.requester.role}
                          </span>
                          {req.requester.gender && (
                            <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                              req.requester.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                            }`}>
                              {req.requester.gender}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        </div>
                        <p className="text-sm font-medium">{req.fromLocation}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="h-3 w-3 text-accent" />
                        </div>
                        <p className="text-sm font-medium">{req.toLocation}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-semibold">{formattedDate}, {formattedTime}</span>
                      </div>
                      <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-md">
                        {req.seatsNeeded} {req.seatsNeeded === 1 ? 'Seat' : 'Seats'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        className="w-full text-xs"
                        onClick={() => {
                          if (req.requester.phone) {
                            window.open(`tel:${req.requester.phone}`);
                          } else {
                            toast({ title: "Not available", description: "This user hasn't provided a phone number."});
                          }
                        }}
                      >
                        <Phone className="h-3 w-3 mr-2" /> Call
                      </Button>
                      <Button 
                        className="w-full text-xs bg-primary hover:bg-primary/90"
                        onClick={() => {
                          if (req.requester.phone) {
                            const phone = req.requester.phone.replace(/\D/g, '').replace(/^91/, '');
                            window.open(`https://wa.me/91${phone}?text=Hey%20${req.requester.name},%20I%20saw%20your%20ride%20request%20on%20SmartPool.`, "_blank");
                          } else {
                            toast({ title: "Not available", description: "This user hasn't provided a phone number."});
                          }
                        }}
                      >
                        <MessageCircle className="h-3 w-3 mr-2" /> Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <PostRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchRequests();
        }} 
      />
    </Layout>
  );
};

export default RideRequestBoard;
