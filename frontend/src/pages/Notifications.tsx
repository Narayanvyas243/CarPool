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
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold ml-2">All Notifications</h1>
        </div>
      </div>

      <div className="container px-4 py-6 pb-20">
        <div className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map((notif, index) => (
              <div 
                key={notif._id} 
                className={`flex items-start gap-4 p-4 rounded-xl border border-border animate-fade-in cursor-pointer transition-all hover:bg-muted/30 ${!notif.isRead ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-card'}`}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className={`mt-1 ${getIconBg(notif.type)} p-2 rounded-xl shrink-0`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">{notif.title}</p>
                    {!notif.isRead && (
                      <span className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                  <p className="text-[10px] text-muted-foreground font-medium pt-1 italic">{timeAgo(notif.createdAt)}</p>
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
