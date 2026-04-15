import { MapPin, Clock, Users, User, BadgeCheck, ChevronRight } from "lucide-react";
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
  const isDriver = user?.id === ride.driverId;

  return (
    <Card className="premium-card rounded-[2.5rem] overflow-hidden hover:border-primary/30 cursor-pointer active:scale-[0.98] transition-all bg-white/40 backdrop-blur-sm border-white/30 flex flex-col h-full group" onClick={() => onJoinRide?.(ride.id)}>
      <CardContent className="p-5 flex flex-col h-full">
        {/* Header: Price & Status */}
        <div className="flex justify-between items-start mb-4">
          <div className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${
            seatsLeft === 0 ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
          }`}>
            {seatsLeft === 0 ? "Full" : `${seatsLeft} Seats`}
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-primary tracking-tighter">₹{ride.pricePerSeat}</span>
          </div>
        </div>

        {/* Route visualization */}
        <div className="flex-1 space-y-4 mb-6">
          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-1">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-primary bg-background" />
              <div className="w-[1.5px] h-6 bg-gradient-to-b from-primary to-accent/30 my-0.5 rounded-full" />
              <div className="w-2.5 h-2.5 rounded-full border-2 border-accent bg-background" />
            </div>
            <div className="space-y-3 min-w-0">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">From</p>
                <p className="font-bold text-xs text-foreground truncate">{ride.source}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">To</p>
                <p className="font-bold text-xs text-foreground truncate">{ride.destination}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Driver & Footer */}
        <div className="pt-4 border-t border-border/40 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-7 w-7 ring-2 ring-primary/10">
              <AvatarImage src={ride.driverAvatar} alt={ride.driverName} />
              <AvatarFallback className="text-[10px] font-black bg-primary/10 text-primary">
                {(ride.driverName || "U")[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <p className="text-[10px] font-black text-foreground truncate">{ride.driverName}</p>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{ride.time}</p>
            </div>
          </div>
          <div className="p-1.5 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


export default RideCard;
