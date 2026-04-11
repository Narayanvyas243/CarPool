import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BadgeCheck,
  Mail,
  Phone,
  Car,
  MapPin,
  Star,
  LogOut,
  Settings,
  ChevronRight,
  QrCode,
  History,
  Shield,
  Check,
  X,
  Trash2,
  Users,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../apiConfig";


const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ ridesOffered: 0, ridesTaken: 0 });
  const [dashboardData, setDashboardData] = useState<{ 
    createdRides: any[]; 
    bookedRides: any[]; 
    pastBookedRides: any[];
    pendingRequests: any[] 
  }>({ 
    createdRides: [], 
    bookedRides: [], 
    pastBookedRides: [],
    pendingRequests: [] 
  });
  const [profileData, setProfileData] = useState<any>(null);

  const fetchDashboard = () => {
    if (user?.id) {
      fetch(getApiUrl(`/api/rides/dashboard/${user.id}`))
        .then(res => res.json())
        .then(data => {
          if (data.dashboard) {
            setStats({
              ridesOffered: data.dashboard.createdRides?.length || 0,
              ridesTaken: data.dashboard.pastBookedRides?.length || 0
            });
            setDashboardData({
              createdRides: data.dashboard.createdRides || [],
              bookedRides: data.dashboard.bookedRides || [],
              pastBookedRides: data.dashboard.pastBookedRides || [],
              pendingRequests: data.dashboard.pendingRequests || []
            });
          }
        })
        .catch(err => console.error(err));
    }
  };

  useEffect(() => {
    fetchDashboard();
    if (user?.id) {
      fetch(getApiUrl(`/api/users/${user.id}`))
        .then(res => res.json())
        .then(data => {
          if (data._id) {
            setProfileData(data);
          }
        })
        .catch(err => console.error(err));
    }
  }, [user]);

  const handleRequestAction = async (rideId: string, requestId: string, action: 'accept' | 'reject') => {
    try {
      const res = await fetch(getApiUrl(`/api/rides/${rideId}/requests/${requestId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ownerId: user?.id })
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: `Request ${action}ed`, description: data.message });
        fetchDashboard();
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleCancelRide = async (rideId: string) => {
    if (!confirm("Are you sure you want to cancel this ride? This will notify all passengers.")) return;
    try {
      const res = await fetch(getApiUrl(`/api/rides/${rideId}`), { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Ride Cancelled", description: data.message });
        fetchDashboard();
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
    navigate("/login");
  };

  const menuItems = [
    { icon: History, label: "Ride History", path: "/history" },
    { icon: QrCode, label: "Payment QR Code", path: "/payment-qr" },
    { icon: Shield, label: "Safety & Privacy", path: "/safety" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <Layout showHeader={false}>
      <div className="bg-gradient-hero min-h-screen">
        {/* Profile Header */}
        <div className="pt-8 pb-6 px-4 text-center animate-fade-in">
          <Avatar className="h-24 w-24 mx-auto ring-4 ring-primary/20 shadow-elevated">
            <AvatarImage src="" alt={user?.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {(user?.name || "U").split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="mt-4">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{user?.name}</h1>
              <BadgeCheck className="h-6 w-6 text-success" />
            </div>
            <span className="verified-badge mt-2 inline-flex">
              {user?.role === "student" ? "Student" : "Faculty"}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center justify-center gap-1 mt-3">
            <Star className="h-5 w-5 fill-warning text-warning" />
            <span className="font-semibold text-foreground">5.0</span>
            <span className="text-muted-foreground text-sm">rating</span>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <Card className="border-0 shadow-soft">
            <CardContent className="p-0">
              <div className="grid grid-cols-3 divide-x divide-border">
                 <div 
                   className="p-4 text-center cursor-pointer hover:bg-secondary/50 transition-colors"
                   onClick={() => {
                     const element = document.getElementById('recent-rides');
                     if (element) element.scrollIntoView({ behavior: 'smooth' });
                   }}
                 >
                   <div className="flex items-center justify-center gap-1.5 mb-1">
                     <Car className="h-4 w-4 text-primary" />
                     <span className="text-xl font-bold text-foreground">{stats.ridesOffered}</span>
                   </div>
                   <p className="text-xs text-muted-foreground">Rides Offered</p>
                 </div>
                 <div 
                   className="p-4 text-center cursor-pointer hover:bg-secondary/50 transition-colors"
                   onClick={() => {
                     const element = document.getElementById('recent-rides');
                     if (element) element.scrollIntoView({ behavior: 'smooth' });
                   }}
                 >
                   <div className="flex items-center justify-center gap-1.5 mb-1">
                     <MapPin className="h-4 w-4 text-accent" />
                     <span className="text-xl font-bold text-foreground">{stats.ridesTaken}</span>
                   </div>
                   <p className="text-xs text-muted-foreground">Rides Taken</p>
                 </div>
                 <div className="p-4 text-center">
                   <div className="flex items-center justify-center gap-1.5 mb-1">
                     <span className="text-sm font-bold text-foreground">
                       {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : '-'}
                     </span>
                   </div>
                   <p className="text-xs text-muted-foreground">Member Since</p>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info */}
        <div className="px-4 mb-6 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <Card className="border-0 shadow-soft">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium text-foreground">{profileData?.phone || "Update in Settings"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Ride Requests (For Owners) */}
        {dashboardData.pendingRequests.length > 0 && (
          <div className="px-4 mb-6 animate-fade-in" style={{ animationDelay: "0.16s" }}>
            <h2 className="text-lg font-bold mb-3 px-1 flex items-center gap-2">
              Ride Requests 
              <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full">
                {dashboardData.pendingRequests.length}
              </span>
            </h2>
            <div className="space-y-3">
              {dashboardData.pendingRequests.map((req: any) => (
                <Card key={req.requestId} className="border-0 shadow-soft border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-bold text-foreground">{req.requester.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{req.requester.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-primary">{req.seatsRequested} Seat(s)</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {req.fromLocation} → {req.toLocation}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-success hover:bg-success/90 h-8 text-xs"
                        onClick={() => handleRequestAction(req.rideId, req.requestId, 'accept')}
                      >
                        <Check className="h-3 w-3 mr-1" /> Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground h-8 text-xs"
                        onClick={() => handleRequestAction(req.rideId, req.requestId, 'reject')}
                      >
                        <X className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Ride History Quick View */}
        <div className="px-4 mb-6 animate-fade-in" style={{ animationDelay: "0.18s" }} id="recent-rides">
          <h2 className="text-lg font-bold mb-3 px-1">Recent Rides</h2>
          <div className="space-y-3">
            {[
              ...dashboardData.bookedRides.map(r => ({ 
                ...r, 
                type: new Date(r.time) < new Date() ? 'Taken' : 'Booked' 
              })), 
              ...dashboardData.createdRides.map(r => ({ 
                ...r, 
                type: new Date(r.time) < new Date() ? 'Completed' : 'Offered' 
              }))
            ]
              .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
              .slice(0, 5)
              .map((ride: any, i) => (
              <Card 
                key={ride._id || i} 
                className="border-0 shadow-soft cursor-pointer hover:border-primary transition-colors border-l-4 border-l-transparent hover:border-l-primary"
                onClick={(e) => {
                  // Don't navigate if clicking the cancel button
                  if ((e.target as HTMLElement).closest('button')) return;
                  navigate(`/ride/${ride._id}`);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-foreground">{ride.fromLocation} → {ride.toLocation}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          ride.type === 'Booked' ? 'bg-success/10 text-success' :
                          ride.type === 'Offered' ? 'bg-primary/10 text-primary' :
                          ride.type === 'Taken' ? 'bg-accent/10 text-accent' :
                          'bg-muted text-muted-foreground' // Completed
                        }`}>
                          {ride.type}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <History className="h-3 w-3" />
                        {new Date(ride.time).toLocaleDateString()} at {new Date(ride.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {ride.type === 'Offered' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleCancelRide(ride._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <BadgeCheck className="h-5 w-5 text-success" />
                    </div>
                  </div>

                  {/* Show passengers if it's an offered ride with accepted requests */}
                  {ride.type === 'Offered' && ride.requests && ride.requests.some((r: any) => r.status === 'accepted') && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <Users className="h-3 w-3" /> Accepted Passengers
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ride.requests.filter((r: any) => r.status === 'accepted').map((req: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 bg-secondary/30 px-2 py-1 rounded-md group">
                            <span className="text-xs font-medium">{req.requester?.name}</span>
                            {req.requester?.phone && (
                              <div className="flex items-center gap-1">
                                <a href={`tel:${req.requester.phone}`} className="text-primary hover:text-primary/80">
                                  <Phone className="h-3 w-3" />
                                </a>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(req.requester.phone);
                                    toast({ title: "Copied", description: "Phone number copied!" });
                                  }}
                                >
                                  <Copy className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {dashboardData.bookedRides.length === 0 && dashboardData.createdRides.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-lg animate-fade-in">You have not traveled</p>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="px-4 mb-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Card className="border-0 shadow-soft">
            <CardContent className="p-0">
              {menuItems.map((item, index) => (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.path.startsWith('/')) {
                      navigate(item.path);
                    } else {
                      toast({ title: "Coming soon!", description: `${item.label} feature is under development` });
                    }
                  }}
                  className={`w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors ${
                    index < menuItems.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">{item.label}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Logout */}
        <div className="px-4 pb-24 animate-fade-in" style={{ animationDelay: "0.25s" }}>
          <Button 
            variant="outline" 
            className="w-full h-12 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
