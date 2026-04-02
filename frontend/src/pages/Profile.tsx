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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ ridesOffered: 0, ridesTaken: 0 });
  const [dashboardData, setDashboardData] = useState<{ createdRides: any[]; bookedRides: any[] }>({ createdRides: [], bookedRides: [] });
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/rides/dashboard/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.dashboard) {
            setStats({
              ridesOffered: data.dashboard.createdRides?.length || 0,
              ridesTaken: data.dashboard.bookedRides?.length || 0
            });
            setDashboardData({
              createdRides: data.dashboard.createdRides || [],
              bookedRides: data.dashboard.bookedRides || []
            });
          }
        })
        .catch(err => console.error(err));

      fetch(`/api/users/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data._id) {
            setProfileData(data);
          }
        })
        .catch(err => console.error(err));
    }
  }, [user]);

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
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Car className="h-4 w-4 text-primary" />
                    <span className="text-xl font-bold text-foreground">{stats.ridesOffered}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Rides Offered</p>
                </div>
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <MapPin className="h-4 w-4 text-accent" />
                    <span className="text-xl font-bold text-foreground">{stats.ridesTaken}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Rides Taken</p>
                </div>
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="text-xl font-bold text-foreground">-</span>
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

        {/* Ride History Quick View */}
        <div className="px-4 mb-6 animate-fade-in" style={{ animationDelay: "0.18s" }}>
          <h2 className="text-lg font-bold mb-3 px-1">Recent Rides</h2>
          <div className="space-y-3">
            {[...dashboardData.bookedRides.map(r => ({ ...r, type: 'Taken' })), ...dashboardData.createdRides.map(r => ({ ...r, type: 'Offered' }))]
              .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
              .slice(0, 5)
              .map((ride: any, i) => (
              <Card key={ride._id || i} className="border-0 shadow-soft">
                <CardContent className="p-4 flex items-center justify-between">
                   <div className="flex flex-col">
                     <div className="flex items-center gap-2 mb-1">
                       <span className="font-semibold text-sm text-foreground">{ride.fromLocation} → {ride.toLocation}</span>
                       <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ride.type === 'Offered' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                         {ride.type}
                       </span>
                     </div>
                     <span className="text-xs text-muted-foreground flex items-center gap-1">
                       <History className="h-3 w-3" />
                       {new Date(ride.time).toLocaleDateString()} at {new Date(ride.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                   </div>
                   <BadgeCheck className="h-5 w-5 text-success" />
                </CardContent>
              </Card>
            ))}
            {dashboardData.bookedRides.length === 0 && dashboardData.createdRides.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-lg">No ride history available</p>
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
                  onClick={() => toast({ title: "Coming soon!", description: `${item.label} feature is under development` })}
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
