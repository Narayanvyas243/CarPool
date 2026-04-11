import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../apiConfig";
import { 
  User, 
  Lock, 
  Bell, 
  Palette, 
  Trash2, 
  ArrowLeft, 
  ChevronRight,
  LogOut,
  ShieldCheck,
  Smartphone,
  UserCircle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTheme } from "next-themes";

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Profile State
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    gender: user?.gender || "male",
  });
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);

  // Security State
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);

  // Preferences State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Modal State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name,
        phone: user.phone || "",
        gender: user.gender || "male",
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsProfileUpdating(true);
    try {
      const res = await fetch(getApiUrl(`/api/users/${user.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      updateUser(data.user);
      toast({ title: "Success", description: "Profile updated successfully! ✨" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProfileUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }

    setIsPasswordUpdating(true);
    try {
      const res = await fetch(getApiUrl(`/api/users/${user.id}/password`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update password");

      toast({ title: "Success", description: "Password updated successfully! 🔐" });
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete account");

      toast({ title: "Account Deleted", description: "Your account has been permanently removed." });
      logout();
      navigate("/signup");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Layout userName={user?.name || "User"}>
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold ml-2">Settings</h1>
        </div>
      </div>

      <div className="container px-4 py-8 space-y-8 pb-24 max-w-2xl mx-auto">
        
        {/* Profile Card */}
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 px-1">
            <UserCircle className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Profile</h2>
          </div>
          <Card className="border-0 shadow-soft overflow-hidden">
            <CardContent className="p-6">
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="name" 
                      value={profileData.name} 
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="pl-10"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="phone" 
                      value={profileData.phone} 
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="pl-10"
                      placeholder="e.g. +91 1234567890"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" className="w-full" disabled={isProfileUpdating}>
                    {isProfileUpdating ? "Saving..." : "Update Profile"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* Security Card */}
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
          <div className="flex items-center gap-2 px-1">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Security</h2>
          </div>
          <Card className="border-0 shadow-soft overflow-hidden">
            <CardHeader>
              <CardDescription>Change your password to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="oldPassword" 
                      type="password"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="newPassword" 
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="confirmPassword" 
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <Button type="submit" variant="outline" className="w-full border-primary text-primary hover:bg-primary/5" disabled={isPasswordUpdating}>
                    {isPasswordUpdating ? "Updating..." : "Change Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* Preferences Card */}
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
          <div className="flex items-center gap-2 px-1">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Preferences</h2>
          </div>
          <Card className="border-0 shadow-soft overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between p-6">
                  <div className="space-y-0.5">
                    <Label className="text-base">Dark Mode</Label>
                    <p className="text-xs text-muted-foreground">Sync your appearance with your device</p>
                  </div>
                  <Switch 
                    checked={resolvedTheme === "dark"} 
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
                  />
                </div>
                
                <div className="flex items-center justify-between p-6">
                  <div className="space-y-0.5">
                    <Label className="text-base">Real-time Notifications</Label>
                    <p className="text-xs text-muted-foreground">Get updates about your ride requests</p>
                  </div>
                  <Switch 
                    checked={notificationsEnabled} 
                    onCheckedChange={setNotificationsEnabled} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Support & Logout */}
        <section className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-300">
           <Button 
            variant="outline" 
            className="w-full h-14 justify-between px-6 border-0 shadow-soft bg-card hover:bg-muted/50"
            onClick={() => toast({ title: "Coming Soon", description: "Help center is currently under development." })}
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-accent/10">
                <Bell className="h-4 w-4 text-accent" />
              </div>
              <span className="font-medium">Feedback & Support</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-14 justify-between px-6 border-0 shadow-soft bg-card text-destructive hover:bg-destructive/5 hover:text-destructive"
            onClick={logout}
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-destructive/10">
                <LogOut className="h-4 w-4 text-destructive" />
              </div>
              <span className="font-medium">Logout</span>
            </div>
          </Button>
        </section>

        {/* Danger Zone */}
        <section className="pt-8 border-t border-border animate-in fade-in slide-in-from-bottom-2 duration-300 delay-[350ms]">
          <div className="bg-destructive/5 rounded-2xl p-6 border border-destructive/10 space-y-4">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              <h2 className="text-lg font-bold text-destructive">Danger Zone</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button 
              variant="destructive" 
              className="w-full sm:w-auto"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete My Account
            </Button>
          </div>
        </section>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="border-none shadow-elevated">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account across the SmartPool platform.
              All your active ride requests and ride history will be lost forever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
              Yes, Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Settings;
