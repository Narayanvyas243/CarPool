import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { toast } from "@/hooks/use-toast";
import { getApiUrl } from "../apiConfig";


interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  meta?: {
    rideId?: string;
    requestId?: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  socket: Socket | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(getApiUrl(`/api/notifications/${user.id}`));
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/notifications/${id}/read`), {
        method: "PATCH",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();

      const newSocket = io(getApiUrl("/"));
      setSocket(newSocket);

      newSocket.on("connect", () => {
        newSocket.emit("register", user.id);
      });

      newSocket.on("notification:new", (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
        
        // Show real-time popup (toast)
        toast({
          title: notification.type === "ride_request_received" 
            ? "New Ride Request! 🚗" 
            : notification.title,
          description: notification.message,
          variant: "default",
        });
      });

      return () => {
        newSocket.disconnect();
      };
    } else {
      setNotifications([]);
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user?.id]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, fetchNotifications, markAsRead, socket }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
