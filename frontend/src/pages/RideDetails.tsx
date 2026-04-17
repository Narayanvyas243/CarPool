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
  Mail,
  Copy,
  Check,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../apiConfig";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import RideMap from "@/components/RideMap";
import { useLiveTracking } from "../hooks/useLiveTracking";
import { useNotifications } from "../context/NotificationContext";

const RideDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [ride, setRide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPassenger, setSelectedPassenger] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isConfirmingOnboard, setIsConfirmingOnboard] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [isConfirmingCompletion, setIsConfirmingCompletion] = useState(false);
  const [autoPromptRequestId, setAutoPromptRequestId] = useState<string | null>(null);
  const [autoPromptPassengerName, setAutoPromptPassengerName] = useState<string | null>(null);
  const { socket } = useNotifications();

  useEffect(() => {
    fetch(getApiUrl(`/api/rides/${id}`))
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
      const res = await fetch(getApiUrl(`/api/rides/${id}/request`), {
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
      const upRes = await fetch(getApiUrl(`/api/rides/${id}`));
      setRide(await upRes.json());
      
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsJoining(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: "accept" | "reject") => {
    if (!user) return;
    
    setIsUpdating(requestId);
    try {
      const res = await fetch(getApiUrl(`/api/rides/${id}/requests/${requestId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ownerId: user.id })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to ${action} request`);
      
      toast({
        title: action === "accept" ? "Request Accepted! ✅" : "Request Rejected ❌",
        description: action === "accept" ? "Passenger added to your ride." : "Request has been removed.",
      });

      // Refresh ride data
      const upRes = await fetch(getApiUrl(`/api/rides/${id}`));
      setRide(await upRes.json());
      
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsUpdating(null);
    }
  };

  const isOwner = user && ride?.createdBy && ride.createdBy._id === user.id;

  const hasBeenAccepted = user && (ride?.requests || []).some((req: any) => 
    req.requester?._id === user.id && req.status === "accepted"
  );
  
  const myRequest = user && (ride?.requests || []).find((req: any) => 
    req.requester?._id === user.id
  );

  const isAlreadyOnboarded = myRequest?.isOnboarded;

  // Determine role for tracking
  const role = isOwner ? 'driver' : (hasBeenAccepted ? 'passenger' : null);
  const isTrackingActive = !!(role && !isAlreadyOnboarded);

  // Hook for live tracking
  const { myLocation, otherLocation, distance, distanceToDestination } = useLiveTracking(
    id || "", 
    user?.id || "", 
    role as any, 
    isTrackingActive,
    ride?.toCoords
  );

  // Show onboarding modal when close (< 15m) and not yet onboarded
  useEffect(() => {
    if (distance !== null && distance < 15 && isTrackingActive && !isOwner) {
      setIsOnboardingOpen(true);
    }
  }, [distance, isTrackingActive, isOwner]);

  // Listen for automatic completion prompts from server
  useEffect(() => {
    if (!socket) return;

    const handleAutoCompletion = (data: any) => {
      console.log("[RideDetails] Received auto-completion prompt:", data);
      
      // If I'm the driver OR if I'm the specific passenger mentioned
      const isMePassenger = user?.id === data.passengerId;
      const amIDriver = isOwner;

      if (isMePassenger || amIDriver) {
        setAutoPromptRequestId(data.requestId);
        
        // Try to find the passenger name for better UI
        const passenger = passengers.find(p => p.requesterId === data.passengerId);
        if (passenger) setAutoPromptPassengerName(passenger.name);
        
        setIsCompletionDialogOpen(true);
      }
    };

    socket.on("ride:confirm-completion", handleAutoCompletion);

    return () => {
      socket.off("ride:confirm-completion", handleAutoCompletion);
    };
  }, [socket, user, isOwner, passengers]);

  // Keep manual distance-based trigger as a fallback (for passengers only)
  useEffect(() => {
    const isActuallyOnboarded = myRequest?.isOnboarded;
    const isAlreadyCompleted = myRequest?.isCompleted;

    if (
      isActuallyOnboarded && 
      !isAlreadyCompleted && 
      distanceToDestination !== null && 
      distanceToDestination < 50 &&
      !isOwner &&
      !isCompletionDialogOpen // Don't re-trigger if already open from socket
    ) {
      setIsCompletionDialogOpen(true);
    }
  }, [distanceToDestination, myRequest, isOwner, isCompletionDialogOpen]);

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

  const rideTime = ride.time || new Date().toISOString();
  const dateObj = new Date(rideTime);
  const formattedDate = dateObj.toLocaleDateString();
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Compute accepted passengers
  const passengers = (ride.requests || [])
    .filter((req: any) => req.status === "accepted")
    .map((req: any) => ({
      _id: req._id,
      name: req.requester?.name || "Passenger",
      avatar: "",
      phone: req.requester?.phone || "",
      role: req.requester?.role || "student",
      email: req.requester?.email || "",
      isOnboarded: req.isOnboarded,
      isCompleted: req.isCompleted,
      requesterId: req.requester?._id
    }));

  const pendingRequests = (ride.requests || [])
    .filter((req: any) => req.status === "pending");

  const hasRequested = user && (ride.requests || []).some((req: any) => 
    req.requester?._id === user.id && req.status === "pending"
  );
  

  const handleConfirmOnboard = async () => {
    if (!user || !myRequest) return;
    setIsConfirmingOnboard(true);
    try {
      const res = await fetch(getApiUrl(`/api/rides/${id}/requests/${myRequest._id}/onboard`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to confirm onboarding");
      
      toast({ title: "Onboarded! 🎉", description: "You have officially joined the ride." });
      setIsOnboardingOpen(false);

      // Refresh ride data
      const upRes = await fetch(getApiUrl(`/api/rides/${id}`));
      setRide(await upRes.json());
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsConfirmingOnboard(false);
    }
  };

  const handleConfirmCompletion = async (reqId?: string) => {
    if (!user) return;
    const requestId = reqId || autoPromptRequestId || myRequest?._id;
    if (!requestId) return;

    setIsConfirmingCompletion(true);
    try {
      const res = await fetch(getApiUrl(`/api/rides/${id}/requests/${requestId}/complete`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to confirm completion");
      
      toast({ 
        title: "Ride Completed! 🏁", 
        description: isOwner ? "Passenger ride marked as completed." : "Hope you had a safe journey!" 
      });
      setIsCompletionDialogOpen(false);

      // Refresh ride data
      const upRes = await fetch(getApiUrl(`/api/rides/${id}`));
      setRide(await upRes.json());
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsConfirmingCompletion(false);
    }
  };

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

        {/* Map View */}
        {ride.fromLocation && ride.toLocation && (
          <div className="animate-fade-in" style={{ animationDelay: "0.02s" }}>
            <RideMap 
              from={{ 
                lat: ride.fromCoords?.lat, 
                lng: ride.fromCoords?.lng, 
                name: ride.fromLocation 
              }} 
              to={{ 
                lat: ride.toCoords?.lat, 
                lng: ride.toCoords?.lng, 
                name: ride.toLocation 
              }} 
              markers={[
                ...(myLocation ? [{ lat: myLocation.lat, lng: myLocation.lng, label: "You", color: "blue" }] : []),
                ...(otherLocation ? [{ lat: otherLocation.lat, lng: otherLocation.lng, label: role === 'driver' ? "Passenger" : "Driver", color: "red" }] : [])
              ]}
            />
            
            {isTrackingActive && (
              <div className="mt-2 p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between animate-pulse-subtle">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${otherLocation ? 'bg-success' : 'bg-warning'} animate-pulse`} />
                  <span className="text-xs font-semibold text-primary">
                    {otherLocation ? 'Live Tracking Active' : 'Waiting for connection...'}
                  </span>
                </div>
                <span className="text-xs font-bold text-foreground">
                  {distance !== null 
                    ? (distance < 1000 ? `${Math.round(distance)}m away` : `${(distance/1000).toFixed(1)}km away`)
                    : (otherLocation ? 'Calculating...' : 'Initializing...')}
                </span>
              </div>
            )}
            
            {!myLocation && (
              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium">Enable GPS to see your location on map</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-[10px] font-bold text-primary hover:bg-primary/5"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Driver Card */}
        <Card className="border-0 shadow-soft animate-fade-in" style={{ animationDelay: "0.05s" }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 ring-2 ring-primary/10">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {(ride.createdBy?.name || 'U').split(' ').filter(Boolean).map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{ride.createdBy?.name}</span>
                    <BadgeCheck className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="verified-badge inline-flex capitalize w-fit">
                      {ride.createdBy?.role || "student"}
                    </span>
                    {hasBeenAccepted && ride.createdBy?.phone && (
                      <div className="flex items-center gap-2 group animate-in fade-in slide-in-from-left-1 duration-300">
                        <span className="text-xs font-medium text-primary flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {ride.createdBy.phone}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => {
                            navigator.clipboard.writeText(ride.createdBy.phone);
                            toast({ title: "Copied", description: "Driver's number copied to clipboard" });
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={`rounded-full ${hasBeenAccepted ? 'bg-success/10 text-success border-success' : ''}`}
                  onClick={() => {
                    if (hasBeenAccepted) {
                      toast({
                        title: "Driver Contact",
                        description: `Phone: ${ride.createdBy?.phone || "Not provided"}`,
                      });
                      // Also copy to clipboard
                      if (ride.createdBy?.phone) {
                        navigator.clipboard.writeText(ride.createdBy.phone);
                        toast({ title: "Copied", description: "Phone number copied to clipboard" });
                      }
                    } else if (isOwner) {
                      toast({ title: "My Profile", description: "This is your ride!" });
                    } else {
                      toast({ 
                        title: "Contact Restricted", 
                        description: "Contact details are revealed once your request is accepted.",
                        variant: "destructive"
                      });
                    }
                  }}
                >
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
                <div 
                  key={index} 
                  className={`flex flex-col items-center gap-1 group ${isOwner ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (isOwner) {
                      setSelectedPassenger(passenger);
                      setIsProfileOpen(true);
                    }
                  }}
                >
                  <div className="relative">
                    <Avatar className={`h-10 w-10 ${isOwner ? 'ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all' : ''}`}>
                      <AvatarFallback className="bg-secondary text-sm">
                        {(passenger.name || "P").split(' ').filter(Boolean).map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {passenger.isCompleted && (
                      <div className="absolute -top-1 -right-1 bg-success text-white rounded-full p-0.5 shadow-lg border-2 border-background animate-fade-in">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                    )}
                    {isOwner && passenger.phone && !passenger.isCompleted && (
                      <div 
                        className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 shadow-soft"
                      >
                        <Phone className="h-2 w-2" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {passenger.name.split(' ')[0]}
                    </span>
                    {passenger.isCompleted && (
                      <span className="text-[8px] text-success font-bold uppercase tracking-tighter">Done</span>
                    )}
                  </div>
                </div>
              ))}
              {Array.from({ length: Math.max(0, ride.seatsAvailable || 0) }).map((_, i) => (
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

        {/* Pending Requests for Owner */}
        {isOwner && pendingRequests.length > 0 && (
          <div className="animate-fade-in space-y-3" style={{ animationDelay: "0.12s" }}>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
              <Clock className="h-4 w-4 text-primary" />
              Pending Requests ({pendingRequests.length})
            </h3>
            <div className="space-y-3">
              {pendingRequests.map((req: any) => (
                <Card key={req._id} className="border-0 shadow-soft overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                          <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                            {(req.requester?.name || 'U').split(' ').filter(Boolean).map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{req.requester?.name}</p>
                          <p className="text-[10px] text-muted-foreground capitalize font-medium">{req.requester?.role} • 1 seat requested</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-9 w-9 rounded-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          onClick={() => handleRequestAction(req._id, "reject")}
                          disabled={isUpdating === req._id}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          className="h-9 w-9 rounded-full bg-success hover:bg-success/90"
                          onClick={() => handleRequestAction(req._id, "accept")}
                          disabled={isUpdating === req._id}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

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

      {/* Passenger Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[350px] p-0 overflow-hidden border-0 shadow-elevated">
          {selectedPassenger && (
            <div className="animate-fade-in">
              <div className="bg-gradient-primary pt-8 pb-12 px-6 text-center">
                <Avatar className="h-20 w-20 mx-auto ring-4 ring-background/20 shadow-lg">
                  <AvatarFallback className="bg-background text-primary text-xl font-bold">
                    {(selectedPassenger.name || "P").split(' ').filter(Boolean).map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-3 text-primary-foreground">
                  <h3 className="text-xl font-bold">{selectedPassenger.name}</h3>
                  <div className="flex items-center justify-center gap-1.5 mt-1 opacity-90">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 uppercase tracking-wider">
                      {selectedPassenger.role}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-6 -mt-6 bg-background rounded-t-[30px] space-y-6">
                {/* Rating */}
                <div className="flex items-center justify-center gap-6 py-4 border-b border-border">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-warning">
                      <Star className="h-4 w-4 fill-warning" />
                      <span className="font-bold text-lg">5.0</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase">Rating</p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <div className="font-bold text-lg">Verified</div>
                    <p className="text-[10px] text-muted-foreground uppercase">Status</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Phone Number</p>
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{selectedPassenger.phone || "Not provided"}</p>
                        {selectedPassenger.phone && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedPassenger.phone);
                              toast({ title: "Copied", description: "Passenger's number copied to clipboard" });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-accent/10">
                      <Mail className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Email Address</p>
                      <p className="font-medium text-sm break-all">{selectedPassenger.email || "Not provided"}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {selectedPassenger.phone && (
                    <Button 
                      className="w-full bg-success hover:bg-success/90 h-11"
                      onClick={() => window.open(`tel:${selectedPassenger.phone}`)}
                    >
                      <Phone className="h-4 w-4 mr-2" /> Call
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full h-11 border-primary text-primary"
                    onClick={() => {
                      toast({ title: "WhatsApp integration", description: "Coming soon!" });
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" /> Message
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Onboarding Dialog */}
      <Dialog open={isOnboardingOpen} onOpenChange={setIsOnboardingOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Are you onboard? 🚗</DialogTitle>
            <DialogDescription>
              We detected that you and the driver are now at the same location. Please confirm once you've entered the vehicle.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center gap-4">
             <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center animate-bounce">
                <BadgeCheck className="h-8 w-8 text-success" />
             </div>
             <p className="text-center text-sm text-muted-foreground">
               Confirming your onboarding helps us track the ride completion and ensure campus safety.
             </p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="flex-1" onClick={() => setIsOnboardingOpen(false)}>Not yet</Button>
             <Button className="flex-1 bg-success hover:bg-success/90" onClick={handleConfirmOnboard} disabled={isConfirmingOnboard}>
               {isConfirmingOnboard ? "Confirming..." : "Yes, I'm Onboard"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reached Destination? 🏁</DialogTitle>
            <DialogDescription>
              {isOwner 
                ? `It looks like you've reached the destination for ${autoPromptPassengerName || 'a passenger'}. Please confirm if they have completed their ride.`
                : "It looks like you've reached your drop-off point. Please confirm that you have safely exited the vehicle."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-4">
             <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center animate-pulse">
                <MapPin className="h-10 w-10 text-success" />
             </div>
             <div className="text-center space-y-1">
               <p className="font-semibold text-foreground">Arrival Detected</p>
               <p className="text-xs text-muted-foreground">You are within 50 meters of {ride.toLocation}</p>
             </div>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="flex-1" onClick={() => {
                setIsCompletionDialogOpen(false);
                setAutoPromptRequestId(null);
             }}>Not yet</Button>
             <Button className="flex-1 bg-success hover:bg-success/90 shadow-lg shadow-success/20" onClick={() => handleConfirmCompletion()} disabled={isConfirmingCompletion}>
               {isConfirmingCompletion ? "Completing..." : "Yes, I've Arrived"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Completion Action in Profile View for Owner */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[350px] p-0 overflow-hidden border-0 shadow-elevated">
          {selectedPassenger && (
            <div className="animate-fade-in">
              <div className="bg-gradient-primary pt-8 pb-12 px-6 text-center">
                <Avatar className="h-20 w-20 mx-auto ring-4 ring-background/20 shadow-lg">
                  <AvatarFallback className="bg-background text-primary text-xl font-bold">
                    {(selectedPassenger.name || "P").split(' ').filter(Boolean).map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-3 text-primary-foreground">
                  <h3 className="text-xl font-bold">{selectedPassenger.name}</h3>
                  <div className="flex items-center justify-center gap-1.5 mt-1 opacity-90">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 uppercase tracking-wider">
                      {selectedPassenger.role}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-6 -mt-6 bg-background rounded-t-[30px] space-y-6">
                {/* Status Section */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className={`h-5 w-5 ${selectedPassenger.isOnboarded ? 'text-success' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-bold text-foreground">{selectedPassenger.isOnboarded ? 'Onboard' : 'Waiting'}</span>
                  </div>
                  <div className="h-4 w-px bg-slate-200" />
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedPassenger.isCompleted ? 'bg-success' : 'bg-warning'}`} />
                    <span className="text-xs font-bold text-foreground">{selectedPassenger.isCompleted ? 'Completed' : 'In Progress'}</span>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Phone Number</p>
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{selectedPassenger.phone || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-2">
                   {isOwner && selectedPassenger.isOnboarded && !selectedPassenger.isCompleted && (
                     <Button 
                       className="w-full bg-primary hover:bg-primary/90 h-11"
                       onClick={() => {
                         handleConfirmCompletion(selectedPassenger._id);
                         setIsProfileOpen(false);
                       }}
                       disabled={isConfirmingCompletion}
                     >
                       {isConfirmingCompletion ? "Processing..." : "Complete Passenger Ride"}
                     </Button>
                   )}
                   <div className="grid grid-cols-2 gap-3">
                    {selectedPassenger.phone && (
                      <Button 
                        variant="outline"
                        className="w-full border-success text-success h-11"
                        onClick={() => window.open(`tel:${selectedPassenger.phone}`)}
                      >
                        <Phone className="h-4 w-4 mr-2" /> Call
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full h-11 border-primary text-primary"
                      onClick={() => {
                        toast({ title: "WhatsApp integration", description: "Coming soon!" });
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" /> Message
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default RideDetails;
