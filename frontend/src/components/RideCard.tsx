import { MapPin, Clock, Users, User, BadgeCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface RideData {
  id: string;
  driverName: string;
  driverAvatar?: string;
  driverRole: "student" | "faculty";
  isVerified: boolean;
  source: string;
  destination: string;
  date: string;
  time: string;
  availableSeats: number;
  totalSeats: number;
  pricePerSeat: number;
  driverId: string;
  isPassenger?: boolean;
  fromCoords?: { lat: number; lng: number };
  toCoords?: { lat: number; lng: number };
}

interface RideCardProps {
  ride: RideData;
  onJoinRide?: (rideId: string) => void;
}

import { useAuth } from "../context/AuthContext";

const RideCard = ({ ride, onJoinRide }: RideCardProps) => {
  const { user } = useAuth();
  const seatsLeft = ride.availableSeats;
  const seatsFilled = ride.totalSeats - ride.availableSeats;
  const isDriver = user?.id === ride.driverId;

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-premium hover:-translate-y-1 group animate-fade-in border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="p-5">
          {/* Driver Info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-primary/20 transition-transform group-hover:scale-105">
                <AvatarImage src={ride.driverAvatar} alt={ride.driverName} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {(ride.driverName || "U").split(' ').filter(Boolean).map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-foreground tracking-tight">{ride.driverName}</span>
                  {ride.isVerified && (
                    <span className="verified-badge">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  <User className="h-3 w-3" />
                  {ride.driverRole}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-primary tracking-tighter">₹{ride.pricePerSeat}</div>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">per seat</span>
            </div>
          </div>

          {/* Route & Time */}
          <div className="flex gap-4 mb-6">
            <div className="flex flex-col items-center py-1">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-primary bg-background" />
              <div className="w-[1.5px] flex-1 bg-gradient-to-b from-primary to-accent/30 my-1 rounded-full" />
              <div className="w-2.5 h-2.5 rounded-full border-2 border-accent bg-background" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none mb-1">From</span>
                <span className="font-semibold text-foreground text-sm line-clamp-1">{ride.source}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none mb-1">To</span>
                <span className="font-semibold text-foreground text-sm line-clamp-1">{ride.destination}</span>
              </div>
            </div>
            <div className="flex flex-col justify-between py-1 text-right">
              <div className="flex flex-col">
                 <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-foreground">
                   <Clock className="h-3.5 w-3.5 text-primary" />
                   {ride.time}
                 </div>
                 <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{ride.date}</div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-foreground">
                  <Users className="h-3.5 w-3.5 text-accent" />
                  {seatsLeft} / {ride.totalSeats}
                </div>
                <div className="text-[10px] text-muted-foreground font-medium mt-0.5">Seats Left</div>
              </div>
            </div>
          </div>

          {/* Seat Visualization */}
          <div className="flex gap-1.5 mb-2">
            {Array.from({ length: ride.totalSeats }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i < seatsFilled 
                    ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]' 
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Action */}
        <div className="px-5 pb-5 pt-2">
          <Button 
            className={`w-full h-11 rounded-xl font-bold transition-all active:scale-[0.98] ${
              isDriver || ride.isPassenger 
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border" 
                : "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
            }`}
            variant={isDriver || ride.isPassenger ? "ghost" : (seatsLeft === 0 ? "secondary" : "default")}
            disabled={!isDriver && !ride.isPassenger && seatsLeft === 0}
            onClick={() => onJoinRide?.(ride.id)}
          >
            {isDriver ? "Manage Ride" : (ride.isPassenger ? "View My Ride" : (seatsLeft === 0 ? "Ride Full" : "Request to Join"))}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RideCard;
