import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, MapPin, Phone, ArrowRight, UserPlus, Users, MessageCircle } from "lucide-react";
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
  const { user } = useAuth();
  const { toast } = useToast();

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
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground tracking-tighter">Ride Board</h1>
            <p className="text-muted-foreground font-medium text-sm">Students looking for a ride right now.</p>
          </div>
          <Button 
            className="rounded-full h-12 px-6 shadow-lg shadow-primary/20"
            onClick={() => setIsModalOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" /> Request Ride
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 bg-secondary/20 rounded-[2rem] border border-dashed border-border/50">
            <div className="w-16 h-16 rounded-[2rem] bg-muted/50 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">No requests right now</h3>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">Check back later or post your own.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((req) => {
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
