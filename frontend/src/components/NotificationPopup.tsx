import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle2, Car, ArrowRight } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

const NotificationPopup = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead } = useNotifications();
  const [activeNotification, setActiveNotification] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Find the first unread "action-required" notification
    // types: ride_request_received, ride_request_accepted
    const actionable = notifications.find(n => 
      !n.isRead && 
      (n.type === "ride_request_received" || n.type === "ride_request_accepted")
    );

    if (actionable) {
      // Check if we've already shown this notification in this session
      const shownKey = `shown_notif_${actionable._id}`;
      if (!sessionStorage.getItem(shownKey)) {
        setActiveNotification(actionable);
        setIsOpen(true);
        sessionStorage.setItem(shownKey, "true");
      }
    }
  }, [notifications]);

  const handleViewDetails = () => {
    if (activeNotification?.meta?.rideId) {
      setIsOpen(false);
      navigate(`/ride/${activeNotification.meta.rideId}`);
      // Optional: Mark as read when clicking? 
      // User might want it to stay in notification list though.
    }
  };

  if (!activeNotification) return null;

  const isRequest = activeNotification.type === "ride_request_received";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[400px] border-none shadow-elevated animate-in fade-in zoom-in duration-300">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isRequest ? "bg-primary/10" : "bg-success/10"
          }`}>
            {isRequest ? (
              <Car className="h-8 w-8 text-primary animate-bounce-slow" />
            ) : (
              <CheckCircle2 className="h-8 w-8 text-success animate-pulse" />
            )}
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            {isRequest ? "New Ride Request!" : "Ride Request Accepted!"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2 px-4">
            {activeNotification.message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:justify-center">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="flex-1 sm:flex-none border-border"
          >
            Later
          </Button>
          <Button 
            onClick={handleViewDetails}
            className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground group"
          >
            View Details
            <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationPopup;
