import { useState, useEffect, useMemo } from "react";
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
  PhoneCall,
  X
} from "lucide-react";
import { calculateDistance, getFairPriceEstimate, getPriceStatus } from "../utils/fareUtils";
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
import RideChat from "@/components/RideChat";
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
  
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackTargetUserId, setFeedbackTargetUserId] = useState<string | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const [isMidwayDialogOpen, setIsMidwayDialogOpen] = useState(false);
  const [pickupText, setPickupText] = useState("");
  const [dropoffText, setDropoffText] = useState("");

  const fareComparison = useMemo(() => {
    if (!ride?.fromCoords || !ride?.toCoords || ride?.price === undefined) return null;
    const distance = calculateDistance(
      ride.fromCoords.lat, ride.fromCoords.lng,
      ride.toCoords.lat, ride.toCoords.lng
    );
    const fairPrice = getFairPriceEstimate(distance);
    return {
      fairPrice,
      status: getPriceStatus(ride.price, fairPrice)
    };
  }, [ride]);

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
        body: JSON.stringify({ 
          requesterId: user.id, 
          seatsRequested: 1,
          pickupLocation: pickupText || ride.fromLocation,
          dropoffLocation: dropoffText || ride.toLocation
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to join ride");
      
      toast({
        title: "Ride Requested! 🎉",
        description: "Your request has been sent to the driver.",
      });

      setIsMidwayDialogOpen(false);

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

  const isOwner = user && ride?.createdBy && String(ride.createdBy._id || ride.createdBy) === String(user.id);

  const hasBeenAccepted = user && (ride?.requests || []).some((req: any) => 
    String(req.requester?._id || req.requester) === String(user.id) && req.status === "accepted"
  );
  
  const myRequest = user && (ride?.requests || []).find((req: any) => 
    String(req.requester?._id || req.requester) === String(user.id)
  );

  const isAlreadyOnboarded = myRequest?.isOnboarded;

  // Determine role for tracking
  const role = isOwner ? 'driver' : (hasBeenAccepted ? 'passenger' : null);
  const isTrackingActive = !!(role && !isAlreadyOnboarded);
  
  // Memoize map locations to prevent RideMap from re-initializing unnecessarily
  const mapFrom = useMemo(() => ({
    lat: ride?.fromCoords?.lat,
    lng: ride?.fromCoords?.lng,
    name: ride?.fromLocation
  }), [ride?.fromCoords?.lat, ride?.fromCoords?.lng, ride?.fromLocation]);

  const mapTo = useMemo(() => ({
    lat: ride?.toCoords?.lat,
    lng: ride?.toCoords?.lng,
    name: ride?.toLocation
  }), [ride?.toCoords?.lat, ride?.toCoords?.lng, ride?.toLocation]);

  // Compute accepted passengers early so they can be used in hooks below
  const passengers = useMemo(() => {
    if (!ride || !ride.requests) return [];
    return ride.requests
      .filter((req: any) => req.status === "accepted")
      .map((req: any) => ({
        _id: req._id,
        name: req.requester?.name || "Passenger",
        avatar: "",
        phone: req.requester?.phone || "",
        role: req.requester?.role || "student",
        gender: req.requester?.gender,
        email: req.requester?.email || "",
        isOnboarded: req.isOnboarded,
        isCompleted: req.isCompleted,
        requesterId: req.requester?._id || req.requester
      }));
  }, [ride]);

  const { myLocation, otherLocation, distance, distanceToDestination } = useLiveTracking(
    id || "", 
    user?.id || "", 
    role as any, 
    isTrackingActive,
    ride?.toCoords
  );

  useEffect(() => {
    if (distance !== null && distance < 15 && isTrackingActive && !isOwner && !myRequest?.isOnboarded) {
      setIsOnboardingOpen(true);
    }
  }, [distance, isTrackingActive, isOwner, myRequest?.isOnboarded]);

  useEffect(() => {
    if (!socket) return;

    const handleAutoCompletion = (data: any) => {
      const isMePassenger = user?.id === data.passengerId;
      const amIDriver = isOwner;

      if (isMePassenger || amIDriver) {
        setAutoPromptRequestId(data.requestId);
        const passenger = passengers.find(p => p.requesterId === data.passengerId);
        if (passenger) setAutoPromptPassengerName(passenger.name);
        setIsCompletionDialogOpen(true);
      }
    };

    socket.on("ride:confirm-completion", handleAutoCompletion);

    const handleRideCompleted = (data: any) => {
      if (user?.id === data.passengerId && !isOwner) {
        setFeedbackTargetUserId(ride.createdBy?._id || ride.createdBy);
        setIsFeedbackDialogOpen(true);
        toast({ title: "Ride Completed! 🏁", description: "The driver has ended the ride. Thanks for using SmartPool!" });
      }

      fetch(getApiUrl(`/api/rides/${id}`))
        .then(res => res.json())
        .then(updatedRide => setRide(updatedRide))
        .catch(err => console.error("Error refreshing ride data:", err));
    };

    socket.on("ride:completed", handleRideCompleted);

    return () => {
      socket.off("ride:confirm-completion", handleAutoCompletion);
      socket.off("ride:completed", handleRideCompleted);
    };
  }, [socket, user, isOwner, passengers, id, ride?.createdBy]);

  useEffect(() => {
    const isActuallyOnboarded = myRequest?.isOnboarded;
    const isAlreadyCompleted = myRequest?.isCompleted;

    if (
      !isOwner &&
      isActuallyOnboarded && 
      !isAlreadyCompleted && 
      distanceToDestination !== null && 
      distanceToDestination < 300 &&
      !isCompletionDialogOpen
    ) {
      setIsCompletionDialogOpen(true);
    }

    if (
      isOwner &&
      distanceToDestination !== null &&
      distanceToDestination < 300 &&
      !isCompletionDialogOpen
    ) {
      const hasActivePassengers = passengers.some(p => p.isOnboarded && !p.isCompleted);
      if (hasActivePassengers) {
        setIsCompletionDialogOpen(true);
      }
    }
  }, [distanceToDestination, myRequest?.isOnboarded, myRequest?.isCompleted, isOwner, isCompletionDialogOpen, passengers]);

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

      const upRes = await fetch(getApiUrl(`/api/rides/${id}`));
      setRide(await upRes.json());
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsConfirmingOnboard(false);
    }
  };

  const handleConfirmCompletion = async (reqId?: any, forcePassengerId?: string) => {
    if (!user) return;
    const safeReqId = typeof reqId === 'string' ? reqId : undefined;
    const requestId = safeReqId || autoPromptRequestId || myRequest?._id;
    if (!requestId) {
      toast({ title: "Error", description: "Request ID missing. Please refresh.", variant: "destructive" });
      return;
    }

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

      let targetId = forcePassengerId;
      if (!targetId) {
        if (isOwner) {
          const req = data.ride.requests.find((r: any) => r._id === requestId);
          targetId = req?.requester?._id || req?.requester;
        } else {
          targetId = data.ride.createdBy?._id || data.ride.createdBy;
        }
      }
      
      if (targetId) {
        setFeedbackTargetUserId(targetId);
        setIsFeedbackDialogOpen(true);
      }

      setRide(data.ride);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsConfirmingCompletion(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!user || !feedbackTargetUserId || feedbackRating === 0) return;
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch(getApiUrl("/api/feedbacks"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rideId: ride._id,
          fromUserId: user.id,
          toUserId: feedbackTargetUserId,
          rating: feedbackRating,
          comment: feedbackComment
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit feedback");
      
      toast({ title: "Feedback submitted", description: "Thanks for securely sharing your feedback!" });
      setIsFeedbackDialogOpen(false);
      setFeedbackRating(0);
      setFeedbackComment("");
    } catch(err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      if (err.message.includes("already submitted")) setIsFeedbackDialogOpen(false);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <Layout showHeader={false} showNav={false}>
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Ride Details</h1>
          <div className="flex items-center gap-2">
            {(isOwner || hasBeenAccepted) && (
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-full bg-secondary hover:bg-secondary/80 border-border shadow-sm active:scale-95 transition-all"
                onClick={() => {
                  const trackingUrl = `${window.location.origin}/track/${id}`;
                  if (navigator.share) {
                    navigator.share({
                      title: 'SmartPool Live Tracking',
                      text: `Track my live ride on SmartPool! Driver: ${ride.createdBy?.name || 'Driver'}`,
                      url: trackingUrl
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(trackingUrl);
                    toast({ title: "Link Copied!", description: "Tracking link copied to clipboard. Share it with friends or family." });
                  }
                }}
              >
                <Copy className="h-4 w-4 text-foreground" />
              </Button>
            )}
            <Button 
              variant="destructive" 
              size="icon" 
              className="h-10 w-10 rounded-full shadow-lg shadow-destructive/20 active:scale-95 transition-all"
              onClick={() => {
                if (window.confirm("Do you want to call emergency services (112)?")) {
                  window.open("tel:112");
                }
              }}
            >
              <PhoneCall className="h-5 w-5 animate-pulse-soft" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6 pb-24 space-y-4">
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
          {ride.genderPreference && ride.genderPreference !== 'any' && (
            <div className={`px-4 py-2 border-b border-border flex items-center gap-2 ${
              ride.genderPreference === 'female' ? 'bg-pink-50/50' : 'bg-blue-50/50'
            }`}>
              <div className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${
                ride.genderPreference === 'female' ? 'bg-pink-100 text-pink-600 border border-pink-200' : 'bg-blue-100 text-blue-600 border border-blue-200'
              }`}>
                {ride.genderPreference === 'female' ? '🌸 Ladies Only Ride' : '👤 Male Only Ride'}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium italic">
                * Respecting community safety preferences.
              </p>
            </div>
          )}
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

        {ride.fromLocation && ride.toLocation && (
          <div className="animate-fade-in" style={{ animationDelay: "0.02s" }}>
            <RideMap 
              from={mapFrom} 
              to={mapTo} 
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
                    {ride.createdBy?.gender && (
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        ride.createdBy.gender.toLowerCase() === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                      }`}>
                        {ride.createdBy.gender}
                      </span>
                    )}
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
                <Button 
                  variant="outline" 
                   size="icon" 
                   className="rounded-full"
                   onClick={() => {
                     if (hasBeenAccepted && ride.createdBy?.phone) {
                       const phone = ride.createdBy.phone.replace(/\D/g, '').replace(/^91/, '');
                       window.open(`https://wa.me/91${phone}`, "_blank");
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
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      {passenger.name.split(' ')[0]}
                      {passenger.gender && (
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          passenger.gender.toLowerCase() === 'male' ? 'bg-blue-400' : 'bg-pink-400'
                        }`} title={passenger.gender} />
                      )}
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
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-foreground">{req.requester?.name}</p>
                            {req.requester?.gender && (
                              <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                                req.requester.gender.toLowerCase() === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                              }`}>
                                {req.requester.gender}
                              </span>
                            )}
                          </div>
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

        {!isOwner && myRequest?.isOnboarded && !myRequest?.isCompleted && (
          <Card className="border-0 shadow-soft animate-fade-in border-l-4 border-l-success" style={{ animationDelay: "0.13s" }}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-success/10">
                  <MapPin className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Reached your destination?</p>
                  <p className="text-xs text-muted-foreground">Tap below to confirm ride completion</p>
                </div>
              </div>
              <Button
                className="w-full h-11 bg-success hover:bg-success/90 shadow-md shadow-success/20"
                onClick={() => setIsCompletionDialogOpen(true)}
                disabled={isConfirmingCompletion}
              >
                {isConfirmingCompletion ? "Processing..." : "✅ I've Reached My Destination"}
              </Button>
            </CardContent>
          </Card>
        )}

        {isOwner && passengers.some((p: any) => p.isOnboarded && !p.isCompleted) && (
          <Card className="border-0 shadow-soft animate-fade-in border-l-4 border-l-primary" style={{ animationDelay: "0.14s" }}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Reached destination?</p>
                  <p className="text-xs text-muted-foreground">Mark each passenger's ride as complete</p>
                </div>
              </div>
              <div className="space-y-2">
                {passengers.filter((p: any) => p.isOnboarded && !p.isCompleted).map((p: any) => (
                  <div key={p._id} className="flex items-center justify-between p-3 rounded-xl bg-secondary">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {(p.name || 'P').split(' ').filter(Boolean).map((n: string) => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium">{p.name}</span>
                      {p.gender && (
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                          p.gender.toLowerCase() === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                        }`}>
                          {p.gender}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="h-8 bg-primary hover:bg-primary/90 text-xs"
                      onClick={() => handleConfirmCompletion(p._id, p.requesterId)}
                      disabled={isConfirmingCompletion}
                    >
                      {isConfirmingCompletion ? "..." : "Complete"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-soft animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <CardContent className="p-5">
            <div className="flex flex-col gap-4">
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
                  <span className="text-sm">UPI</span>
                </div>
              </div>
              {fareComparison ? (
                <div className={`p-3 rounded-xl border ${fareComparison.status.bg} border-current/10 flex flex-col gap-1`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${fareComparison.status.color}`}>
                      {fareComparison.status.label}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground">
                      Smart Estimate: ₹{fareComparison.fairPrice}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/80 leading-tight">
                    {fareComparison.status.type === 'cheap' 
                      ? "This ride is priced significantly lower than the campus average. Great catch!"
                      : fareComparison.status.type === 'premium'
                      ? "This driver charges a premium for extra comfort or vehicle quality."
                      : "The price is within the recommended fair range for this distance."}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-muted/30 border border-dashed border-border flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Smart Rate Unavailable
                  </span>
                  <p className="text-[9px] text-muted-foreground italic">Coordinate data missing for this ride.</p>
                </div>
              )}

              {hasBeenAccepted && ride.createdBy?.upiId && (
                <div className="pt-2">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 h-12 uppercase font-black text-xs tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                    onClick={() => {
                      const upiId = ride.upiId || ride.createdBy?.upiId;
                      const name = encodeURIComponent(ride.createdBy?.name || "Driver");
                      const amount = ride.price || 50;
                      const note = encodeURIComponent(`SmartPool ride to ${ride.toLocation}`);
                      const upiUrl = `upi://pay?pa=${upiId}&pn=${name}&am=${amount}&tn=${note}&cu=INR`;
                      window.location.href = upiUrl;
                      toast({ 
                        title: "Opening UPI App", 
                        description: "Please complete the payment in your preferred UPI app.",
                      });
                    }}
                  >
                    <QrCode className="h-4 w-4 mr-2" /> Pay Driver via UPI
                  </Button>
                  <p className="text-[9px] text-center text-muted-foreground mt-2 italic">
                    * Zero transaction fee. Pay directly to the driver's bank account.
                  </p>
                </div>
              )}

              {hasBeenAccepted && !(ride.upiId || ride.createdBy?.upiId) && (
                <div className="p-3 rounded-xl bg-muted/50 border border-dashed border-border flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground font-medium leading-tight">
                    Driver hasn't set up their UPI ID yet. Please pay in cash or ask for their QR code during the ride.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {(isOwner || hasBeenAccepted) && (
          <div className="animate-fade-in" style={{ animationDelay: "0.16s" }}>
            <RideChat rideId={id as string} />
          </div>
        )}
      </div>

      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border">
          <Button 
            className="w-full h-12" 
            size="lg"
            onClick={() => {
              setPickupText(ride.fromLocation);
              setDropoffText(ride.toLocation);
              setIsMidwayDialogOpen(true);
            }}
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
                    {selectedPassenger.gender && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/30 uppercase tracking-wider">
                        {selectedPassenger.gender}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-6 -mt-6 bg-background rounded-t-[30px] space-y-6">
                {isOwner && (
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
                )}

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
                              toast({ title: "Copied", description: "Number copied to clipboard" });
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
                      <p className="font-medium text-xs break-all">{selectedPassenger.email || "Not provided"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                   {isOwner && selectedPassenger.isOnboarded && !selectedPassenger.isCompleted && (
                     <Button 
                       className="w-full bg-primary hover:bg-primary/90 h-11"
                       onClick={() => {
                         handleConfirmCompletion(selectedPassenger._id, selectedPassenger.requesterId);
                         setIsProfileOpen(false);
                       }}
                       disabled={isConfirmingCompletion}
                     >
                       <MapPin className="h-4 w-4 mr-2" /> Complete Passenger Ride
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
                        if (selectedPassenger?.phone) {
                          const phone = selectedPassenger.phone.replace(/\D/g, '').replace(/^91/, '');
                          window.open(`https://wa.me/91${phone}`, "_blank");
                        } else {
                          toast({ title: "Not Available", description: "Phone number not provided." });
                        }
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

      <Dialog open={isMidwayDialogOpen} onOpenChange={setIsMidwayDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Join Request</DialogTitle>
            <DialogDescription>
              Adjust your pickup and drop-off points if you want to join midway. The driver will see your custom points.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div>
               <label className="text-xs font-bold text-muted-foreground uppercase opacity-80 mb-1 block">Pickup Point</label>
               <input 
                 className="w-full p-2.5 text-sm rounded-lg border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50"
                 value={pickupText}
                 onChange={(e) => setPickupText(e.target.value)}
                 placeholder="E.g., Prem Nagar"
               />
             </div>
             <div>
               <label className="text-xs font-bold text-muted-foreground uppercase opacity-80 mb-1 block">Drop-off Point</label>
               <input 
                 className="w-full p-2.5 text-sm rounded-lg border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50"
                 value={dropoffText}
                 onChange={(e) => setDropoffText(e.target.value)}
                 placeholder="E.g., UPES Bidholi"
               />
             </div>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="flex-1" onClick={() => setIsMidwayDialogOpen(false)}>Cancel</Button>
             <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleJoinRide} disabled={isJoining || !pickupText || !dropoffText}>
               {isJoining ? "Sending..." : "Send Request"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>

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
               <p className="text-xs text-muted-foreground">You are near {ride.toLocation}</p>
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

      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rate Your Experience ⭐</DialogTitle>
            <DialogDescription>
              Your feedback helps keep the community safe. For privacy, your rating won't appear on their profile for 5 days.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-4">
             <div className="flex gap-2">
               {[1, 2, 3, 4, 5].map((star) => (
                 <button
                   key={star}
                   title={`Rate ${star} stars`}
                   onClick={() => setFeedbackRating(star)}
                   className={`p-2 rounded-full transition-all ${
                     feedbackRating >= star 
                      ? 'text-warning hover:scale-110 drop-shadow-md' 
                      : 'text-muted hover:text-warning/50 hover:scale-105'
                   }`}
                 >
                   <Star className={`h-8 w-8 ${feedbackRating >= star ? 'fill-warning' : ''}`} />
                 </button>
               ))}
             </div>
             
             <div className="w-full mt-2">
               <label className="text-xs font-bold text-muted-foreground uppercase opacity-80 mb-1 block">Comment (Optional)</label>
               <textarea 
                 className="w-full min-h-[80px] p-3 text-sm rounded-xl border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                 placeholder="How was the ride?"
                 value={feedbackComment}
                 onChange={(e) => setFeedbackComment(e.target.value)}
                 maxLength={200}
               />
             </div>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="flex-1" onClick={() => setIsFeedbackDialogOpen(false)}>Skip for Now</Button>
             <Button 
               className="flex-1 bg-primary hover:bg-primary/90" 
               onClick={handleSubmitFeedback} 
               disabled={isSubmittingFeedback || feedbackRating === 0}
             >
               {isSubmittingFeedback ? "Submitting..." : "Submit Rating"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default RideDetails;
