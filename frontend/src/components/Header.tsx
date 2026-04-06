import { Bell, CheckCircle2, Clock, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "../context/NotificationContext";

interface HeaderProps {
  userName?: string;
  userAvatar?: string;
  showNotification?: boolean;
}

const Header = ({ userName = "Guest", userAvatar, showNotification = true }: HeaderProps) => {
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case "ride_request_accepted": return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "ride_request_rejected": return <Trash2 className="h-4 w-4 text-destructive" />;
      case "ride_request_received": return <Info className="h-4 w-4 text-primary" />;
      default: return <Clock className="h-4 w-4 text-warning" />;
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

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
            <span className="text-lg font-bold text-primary-foreground">S</span>
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-xl font-extrabold tracking-[-0.04em] leading-none mb-0.5">
              <span className="text-gradient-primary">Smart</span>
              <span className="font-medium text-foreground/80">pool</span>
            </h1>
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest pl-[1px]">Campus Rides</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {showNotification && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full animate-pulse-soft" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 mr-4">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && <span className="text-xs text-primary font-medium">{unreadCount} New</span>}
                </div>
                <div className="flex flex-col max-h-[300px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div 
                        key={notif._id} 
                        className={`flex items-start gap-3 p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-primary/5' : ''}`}
                        onClick={() => {
                          markAsRead(notif._id);
                          if (notif.meta?.rideId) {
                            navigate(`/ride/${notif.meta.rideId}`);
                          }
                        }}
                      >
                        <div className={`mt-0.5 ${getIconBg(notif.type)} p-1.5 rounded-full shrink-0`}>
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">{notif.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">{timeAgo(notif.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      No notifications yet
                    </div>
                  )}
                </div>
                <div className="p-2 border-t text-center bg-muted/20">
                  <Button 
                    variant="ghost" 
                    className="w-full text-xs h-8 font-semibold text-primary hover:text-primary hover:bg-primary/10" 
                    size="sm"
                    onClick={() => navigate("/notifications")}
                  >
                    View all notifications
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          <Link to="/profile">
            <Avatar className="h-9 w-9 ring-2 ring-primary/20 transition-shadow hover:ring-primary/40">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
