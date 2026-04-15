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
        <div className="pt-10 pb-8 px-4 text-center animate-in fade-in slide-in-from-top-6 duration-700 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-64 bg-gradient-to-b from-primary/20 to-transparent blur-3xl -z-10" />
          
          <div className="relative inline-block group">
            <Avatar className="h-28 w-28 mx-auto ring-4 ring-white/50 dark:ring-slate-800/50 shadow-premium transition-transform group-hover:scale-105 duration-500">
              <AvatarImage src="" alt={user?.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-3xl font-black">
                {(user?.name || "U").split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-success text-white p-1.5 rounded-full border-4 border-white dark:border-slate-900 shadow-lg">
              <BadgeCheck className="h-4 w-4" />
            </div>
          </div>
          
          <div className="mt-5 space-y-2">
            <h1 className="text-3xl font-black text-foreground tracking-tight">{user?.name}</h1>
            <div className="flex items-center justify-center gap-2">
              <div className="verified-badge bg-primary/10 text-primary border-primary/20">
                {user?.role === "student" ? "Student" : "Faculty"}
              </div>
              <div className="flex items-center gap-1 bg-warning/10 px-2.5 py-1 rounded-full border border-warning/20">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                <span className="text-[10px] font-bold text-warning uppercase">5.0 Rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          <div className="glass-card rounded-3xl overflow-hidden border-white/20">
            <div className="grid grid-cols-3 divide-x divide-border/50">
               <div 
                 className="py-5 px-2 text-center cursor-pointer hover:bg-white/50 dark:hover:bg-white/5 transition-colors group"
                 onClick={() => {
                   const element = document.getElementById('recent-rides');
                   if (element) element.scrollIntoView({ behavior: 'smooth' });
                 }}
               >
                 <Car className="h-5 w-5 text-primary mx-auto mb-2 transition-transform group-hover:scale-110" />
                 <p className="text-2xl font-black text-foreground tracking-tighter">{stats.ridesOffered}</p>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">Offered</p>
               </div>
               <div 
                 className="py-5 px-2 text-center cursor-pointer hover:bg-white/50 dark:hover:bg-white/5 transition-colors group"
                 onClick={() => {
                   const element = document.getElementById('recent-rides');
                   if (element) element.scrollIntoView({ behavior: 'smooth' });
                 }}
               >
                 <MapPin className="h-5 w-5 text-accent mx-auto mb-2 transition-transform group-hover:scale-110" />
                 <p className="text-2xl font-black text-foreground tracking-tighter">{stats.ridesTaken}</p>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">Taken</p>
               </div>
               <div className="py-5 px-2 text-center">
                 <Calendar className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                 <p className="text-sm font-black text-foreground tracking-tighter truncate px-1">
                   {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'}
                 </p>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">Member</p>
               </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="px-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
          <div className="premium-card rounded-3xl p-5 bg-card/50 backdrop-blur-sm border-border/40">
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 ml-1">Account Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Email Address</p>
                  <p className="text-sm font-bold text-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center transition-colors group-hover:bg-accent/20">
                  <Phone className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Phone Number</p>
                  <p className="text-sm font-bold text-foreground">{profileData?.phone || "Update in Settings"}</p>
                </div>
              </div>
            </div>
          </div>
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

        {/* Menu Grid - Action Tiles */}
        <div className="px-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400 fill-mode-both">
          <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 ml-1">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
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
                className="premium-card p-5 rounded-3xl flex flex-col items-start gap-4 text-left group transition-all active:scale-[0.98] bg-card/40 backdrop-blur-sm border-border/40"
              >
                <div className={`p-3 rounded-2xl transition-colors group-hover:bg-primary/20 ${index % 2 === 0 ? 'bg-primary/10' : 'bg-accent/10'}`}>
                  <item.icon className={`h-6 w-6 ${index % 2 === 0 ? 'text-primary' : 'text-accent'}`} />
                </div>
                <div className="space-y-1">
                  <p className="font-black text-sm text-foreground leading-tight">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 group-hover:text-primary transition-colors">
                    View more <ChevronRight className="h-2.5 w-2.5" />
                  </p>
                </div>
              </button>
            ))}
          </div>
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
