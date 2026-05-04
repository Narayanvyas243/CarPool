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
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../apiConfig";


const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout, updateUser } = useAuth();
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

  const handleUpdateUpi = async (upiId: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch(getApiUrl(`/api/users/${user.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upiId })
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "UPI ID Updated", description: "Your payment details have been saved." });
        setProfileData(data.user);
        if (user) {
          updateUser({ ...user, upiId: data.user.upiId });
        }
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
    { icon: QrCode, label: "Payment UPI ID", path: "#payment-qr" },
    { icon: Shield, label: "Safety & Privacy", path: "/safety-privacy" },
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
                <Star className={`h-3.5 w-3.5 ${profileData?.currentRating > 0 ? 'fill-warning text-warning' : 'text-warning/50'}`} />
                <span className="text-[10px] font-bold text-warning uppercase">
                  {profileData?.currentRating > 0 ? `${profileData.currentRating.toFixed(1)} Rating` : 'NEW'}
                </span>
                {profileData?.reviewCount > 0 && (
                  <span className="text-[9px] text-warning/70 ml-1">({profileData.reviewCount})</span>
                )}
              </div>
            </div>
            {/* Deployment Verification Anchor */}
            <p className="text-[8px] text-muted-foreground/30 uppercase tracking-widest mt-1">SmartPool Dashboard v2.4</p>
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

        {/* Payment Details */}
        <div className="px-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-250 fill-mode-both" id="payment-qr">
          <div className="premium-card rounded-3xl p-5 bg-card/50 backdrop-blur-sm border-border/40">
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 ml-1">Payment UPI ID</h2>
            <div className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-2xl bg-success/10 flex items-center justify-center transition-colors group-hover:bg-success/20">
                <QrCode className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">UPI ID</p>
                    <p className="text-sm font-bold text-foreground truncate max-w-[150px]">{profileData?.upiId || "Not set"}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[10px] h-8 font-black uppercase text-primary hover:bg-primary/5 transition-colors"
                    onClick={() => {
                      const upi = prompt("Enter your UPI ID (e.g., name@okaxis):", profileData?.upiId || "");
                      if (upi !== null) handleUpdateUpi(upi);
                    }}
                  >
                    {profileData?.upiId ? 'Edit' : 'Add'}
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground/60 mt-4 leading-relaxed italic">
              * Direct UPI allows passengers to pay you zero commission fees. Ensure your UPI ID is correct to receive payments.
            </p>
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
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground">{req.requester.name}</p>
                          {req.requester.gender && (
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                              req.requester.gender.toLowerCase() === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                            }`}>
                              {req.requester.gender}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase">{req.requester.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-primary">{req.seatsRequested} Seat(s)</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 mb-3">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{req.pickupLocation || req.fromLocation} → {req.dropoffLocation || req.toLocation}</span>
                      </div>
                      {(req.pickupLocation !== req.fromLocation || req.dropoffLocation !== req.toLocation) && (
                        <div className="ml-4">
                          <span className="text-[9px] font-bold bg-accent/10 text-accent px-1.5 py-0.5 rounded uppercase tracking-wider">Midway Join</span>
                        </div>
                      )}
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
        <div className="px-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both" id="recent-rides">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Recent Rides</h2>
            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase text-primary" onClick={() => navigate("/history")}>View All</Button>
          </div>
          <div className="grid grid-cols-1 gap-4">
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
              .filter(r => r && r.time) // Ensure ride has a time field
              .sort((a, b) => {
                const dateA = new Date(a.time).getTime();
                const dateB = new Date(b.time).getTime();
                if (isNaN(dateA) || isNaN(dateB)) return 0;
                return dateB - dateA;
              })
              .slice(0, 4)
              .map((ride: any, i) => (
              <Card 
                key={ride._id || i} 
                className="premium-card rounded-2xl overflow-hidden hover:border-primary/30 cursor-pointer active:scale-[0.98] transition-all bg-white/40 backdrop-blur-sm border-white/40"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  navigate(`/ride/${ride._id}`);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${
                          ride.type === 'Booked' ? 'bg-success/10 text-success' :
                          ride.type === 'Offered' ? 'bg-primary/10 text-primary' :
                          ride.type === 'Taken' ? 'bg-accent/10 text-accent' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {ride.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                          <History className="h-2.5 w-2.5" />
                          {new Date(ride.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-foreground truncate tracking-tight">
                        {ride.fromLocation} → {ride.toLocation}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-primary tracking-tighter">₹{ride.price}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-primary/10">
                        <Users className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                        Ride ID: {ride._id?.slice(-4).toUpperCase()}
                      </span>
                    </div>
                    {ride.type === 'Offered' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelRide(ride._id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {dashboardData.bookedRides.length === 0 && dashboardData.createdRides.length === 0 && (
              <p className="text-[10px] font-black text-muted-foreground text-center py-8 bg-black/5 dark:bg-white/5 rounded-3xl uppercase tracking-widest col-span-full">No active history</p>
            )}
          </div>
        </div>

        {/* Menu Grid - Action Tiles */}
        <div className="px-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400 fill-mode-both">
          <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 ml-1">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                onClick={() => {
                  if (item.path.startsWith('/')) {
                    navigate(item.path);
                  } else if (item.path.startsWith('#')) {
                    const element = document.getElementById(item.path.substring(1));
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      // Add a brief highlight effect
                      element.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'rounded-3xl', 'transition-all');
                      setTimeout(() => {
                        element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
                      }, 2000);
                    }
                  } else {
                    toast({ title: "Coming soon!", description: `${item.label} feature is under development` });
                  }
                }}
                className="premium-card p-4 sm:p-5 rounded-3xl flex flex-col items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left group transition-all active:scale-[0.98] bg-card/40 backdrop-blur-sm border-border/40 h-full"
              >
                <div className={`p-2.5 sm:p-3 rounded-2xl transition-colors group-hover:bg-primary/20 ${index % 2 === 0 ? 'bg-primary/10' : 'bg-accent/10'}`}>
                  <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${index % 2 === 0 ? 'text-primary' : 'text-accent'}`} />
                </div>
                <div className="space-y-1 w-full">
                  <p className="font-black text-[11px] sm:text-xs text-foreground leading-tight uppercase tracking-wider">{item.label}</p>
                  <p className="hidden sm:flex text-[10px] text-muted-foreground font-medium items-center gap-1 group-hover:text-primary transition-colors">
                    Go <ChevronRight className="h-2.5 w-2.5" />
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* History List */}
        <div className="px-4 space-y-6">
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
