import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Trash2, Info, ArrowLeft, BellOff } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";

const Notifications = () => {
  const { notifications, markAsRead, fetchNotifications } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case "ride_request_accepted": return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "ride_request_rejected": return <Trash2 className="h-5 w-5 text-destructive" />;
      case "ride_request_received": return <Info className="h-5 w-5 text-primary" />;
      default: return <Clock className="h-5 w-5 text-warning" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case "ride_request_accepted": return "bg-success/15";
      case "ride_request_rejected": return "bg-destructive/15";
      case "ride_request_received": return "bg-primary/15";
      default: return "bg-warning/15";
    }
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead) {
      markAsRead(notif._id);
    }
    if (notif.meta?.rideId) {
      navigate(`/ride/${notif.meta.rideId}`);
    }
  };

  return (
    <Layout userName={user?.name || "Student"} showNav={false}>
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="container flex items-center h-16 px-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-2xl bg-secondary/50 backdrop-blur-sm hover:bg-secondary transition-all active:scale-90"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="ml-4 space-y-0.5">
            <h1 className="text-xl font-black text-foreground tracking-tight">Updates</h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none">SmartPool Notifications v2.4</p>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6 pb-20">
        <div className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map((notif, index) => (
              <div 
                key={notif._id} 
                className={`flex items-start gap-4 p-5 rounded-[2rem] border transition-all cursor-pointer group hover:shadow-premium hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both ${
                  !notif.isRead 
                    ? 'bg-primary/5 border-primary/20 shadow-soft' 
                    : 'bg-card/40 backdrop-blur-sm border-border/40'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className={`mt-0.5 ${getIconBg(notif.type)} p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-110`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-black tracking-tight ${!notif.isRead ? 'text-primary' : 'text-foreground'}`}>{notif.title}</p>
                    {!notif.isRead && (
                      <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-2">{notif.message}</p>
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {timeAgo(notif.createdAt)}
                    </p>
                    <span className="text-[10px] font-black uppercase text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      View Details
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <BellOff className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No notifications yet</h3>
                <p className="text-sm text-muted-foreground">We'll notify you when something important happens.</p>
              </div>
              <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
