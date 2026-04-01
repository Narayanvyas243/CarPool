import { useState } from "react";
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

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/rides/dashboard/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.dashboard) {
            setStats({
              ridesOffered: data.dashboard.createdRides.length,
              ridesTaken: data.dashboard.bookedRides.length
            });
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
                  <p className="text-sm font-medium text-foreground">Update in Settings</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
