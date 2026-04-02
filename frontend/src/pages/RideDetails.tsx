import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  BadgeCheck,
  Phone,
  MessageCircle,
  QrCode,
  IndianRupee,
  Calendar,
  Star,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";

const RideDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [ride, setRide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/rides/${id}`)
      .then(res => res.json())
      .then(data => {
        setRide(data);
      })
      .catch(err => {
        toast({ title: "Error", description: "Failed to load ride details", variant: "destructive" });
      })
      .finally(() => setIsLoading(false));
  }, [id, toast]);

  const handleJoinRide = async () => {
    if (!user) {
      toast({ title: "Unauthorized", description: "Please log in first" });
      navigate("/login");
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch(`/api/rides/${id}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: user.id, seatsRequested: 1 })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to join ride");
      
      toast({
        title: "Ride Requested! 🎉",
        description: "Your request has been sent to the driver.",
      });

      // Refresh ride data
      const upRes = await fetch(`/api/rides/${id}`);
      setRide(await upRes.json());
      
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <Layout showHeader={false} showNav={false}>
        <div className="flex items-center justify-center h-screen">Loading...</div>
      </Layout>
    );
  }

  if (!ride || ride.message === "Ride not found") {
    return (
      <Layout showHeader={false} showNav={false}>
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ride Not Found</h2>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  const dateObj = new Date(ride.time);
  const formattedDate = dateObj.toLocaleDateString();
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Compute accepted passengers
  const passengers = (ride.requests || [])
    .filter((req: any) => req.status === "accepted")
    .map((req: any) => ({
      name: req.requester?.name || "Passenger",
      avatar: ""
    }));

  const isOwner = user && ride.createdBy && ride.createdBy._id === user.id;

  const hasRequested = user && (ride.requests || []).some((req: any) => 
    req.requester?._id === user.id && req.status === "pending"
  );
  
  const hasBeenAccepted = user && (ride.requests || []).some((req: any) => 
    req.requester?._id === user.id && req.status === "accepted"
  );

  return (
    <Layout showHeader={false} showNav={false}>
      {/* Custom Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Ride Details</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="container px-4 py-6 pb-24 space-y-4">
        {/* Route Card */}
        <Card className="border-0 shadow-elevated animate-fade-in overflow-hidden">
          <div className="bg-gradient-primary p-4">
            <div className="flex items-center justify-between text-primary-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">{formattedTime}</span>
              </div>
            </div>
          </div>
          <CardContent className="p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
                <span className="font-semibold text-foreground">{ride.fromLocation}</span>
              </div>
              <div className="route-line ml-[5px]" />
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-accent flex-shrink-0" />
                <span className="font-semibold text-foreground">{ride.toLocation}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver Card */}
        <Card className="border-0 shadow-soft animate-fade-in" style={{ animationDelay: "0.05s" }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 ring-2 ring-primary/10">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {(ride.createdBy?.name || 'U').split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{ride.createdBy?.name}</span>
                    <BadgeCheck className="h-5 w-5 text-success" />
                  </div>
                  <span className="verified-badge mt-1 inline-flex capitalize">
                    {ride.createdBy?.role || "student"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-full">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Passengers */}
        <Card className="border-0 shadow-soft animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Passengers</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {passengers.length} filled, {ride.seatsAvailable} available
              </span>
            </div>
            
            <div className="flex gap-3">
              {passengers.map((passenger: any, index: number) => (
                <div key={index} className="flex flex-col items-center gap-1">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-secondary text-sm">
                      {passenger.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {passenger.name.split(' ')[0]}
                  </span>
                </div>
              ))}
              {Array.from({ length: ride.seatsAvailable }).map((_, i) => (
                <div key={`empty-${i}`} className="flex flex-col items-center gap-1">
                  <div className="h-10 w-10 rounded-full border-2 border-dashed border-muted flex items-center justify-center">
                    <Users className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <span className="text-xs text-muted-foreground">Available</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Price Card */}
        <Card className="border-0 shadow-soft animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-success/10">
                  <IndianRupee className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price per seat</p>
                  <p className="text-2xl font-bold text-foreground">₹{ride.price !== undefined ? ride.price : 50}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <QrCode className="h-5 w-5" />
                <span className="text-sm">UPI Default</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Button */}
      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border">
          <Button 
            className="w-full h-12" 
            size="lg"
            onClick={handleJoinRide}
            disabled={isJoining || ride.seatsAvailable === 0 || hasRequested || hasBeenAccepted}
          >
            {isJoining ? (
              <span className="animate-pulse">Requesting...</span>
            ) : hasBeenAccepted ? (
              "You are in this ride!"
            ) : hasRequested ? (
              "Request Pending..."
            ) : ride.seatsAvailable === 0 ? (
              "Fully Booked"
            ) : (
              <>Request Seat • ₹{ride.price !== undefined ? ride.price : 50}</>
            )}
          </Button>
        </div>
      )}
    </Layout>
  );
};

export default RideDetails;
