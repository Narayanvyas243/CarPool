import { MapPin, Clock, Calendar, Users, User, BadgeCheck, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface RideData {
  id: string;
  driverName: string;
  driverAvatar?: string;
  driverRole: "student" | "faculty";
  driverGender?: string;
  isVerified: boolean;
  source: string;
  destination: string;
  date: string;
  time: string;
  availableSeats: number;
  totalSeats: number;
  pricePerSeat: number;
  priceComparison?: {
    fairPrice: number;
    status: "cheap" | "premium" | "fair";
  };
  driverId: string;
  isPassenger?: boolean;
  genderPreference?: string;
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

  const getPriceBadge = () => {
    if (!ride.priceComparison) return null;
    const { status } = ride.priceComparison;
    
    if (status === "cheap") return <span className="text-[7px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-50 px-1 rounded animate-pulse">Budget Friendly</span>;
    if (status === "premium") return <span className="text-[7px] font-black text-amber-600 uppercase tracking-tighter bg-amber-50 px-1 rounded">Premium Rate</span>;
    return <span className="text-[7px] font-black text-blue-500 uppercase tracking-tighter bg-blue-50 px-1 rounded">Fair Price</span>;
  };

  return (
    <Card 
      className="premium-card rounded-[2.5rem] overflow-hidden hover:border-primary/40 cursor-pointer active:scale-[0.98] transition-all bg-white/60 backdrop-blur-md border-white/40 flex flex-col h-full group shadow-lg hover:shadow-2xl"
      onClick={() => onJoinRide?.(ride.id)}
    >
      <CardContent className="p-7 flex flex-col h-full space-y-6">
        {/* Header: Price & Status */}
        <div className="flex justify-between items-center">
          <div className={`text-[10px] px-3.5 py-1.5 rounded-full font-black uppercase tracking-[0.15em] ${
            seatsLeft === 0 ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary border border-primary/10'
          }`}>
            {seatsLeft === 0 ? "Full" : `${seatsLeft} Seats Left`}
          </div>
          {ride.genderPreference && ride.genderPreference !== 'any' && (
            <div className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
              ride.genderPreference === 'female' ? 'bg-pink-100 text-pink-600 border border-pink-200' : 'bg-blue-100 text-blue-600 border border-blue-200'
            } animate-in zoom-in-50 duration-500`}>
              {ride.genderPreference === 'female' ? '🌸 Ladies Only' : '👤 Male Only'}
            </div>
          )}
          <div className="text-right flex flex-col items-end">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-black text-primary tracking-tighter">₹{ride.pricePerSeat}</span>
            </div>
            <div className="flex flex-col items-end -mt-0.5">
              {ride.priceComparison ? (
                <>
                  <span className="text-[10px] font-bold text-muted-foreground/70 whitespace-nowrap tracking-tight">
                    Smart Rate: ₹{ride.priceComparison.fairPrice}
                  </span>
                  {getPriceBadge()}
                </>
              ) : (
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">per person</span>
              )}
            </div>
          </div>
        </div>

        {/* Route visualization */}
        <div className="flex-1 space-y-6">
          <div className="flex gap-4">
            <div className="flex flex-col items-center pt-1.5">
              <div className="w-3 h-3 rounded-full border-[3px] border-primary bg-background shadow-[0_0_10px_rgba(var(--primary),0.3)]" />
              <div className="w-[2px] h-10 bg-gradient-to-b from-primary to-accent/30 my-1 rounded-full opacity-60" />
              <div className="w-3 h-3 rounded-full border-[3px] border-accent bg-background shadow-[0_0_10px_rgba(var(--accent),0.3)]" />
            </div>
            <div className="space-y-6 min-w-0 flex-1">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em] opacity-70">Starting From</p>
                <p className="font-bold text-base text-foreground truncate tracking-tight">{ride.source}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em] opacity-70">Destination</p>
                <p className="font-bold text-base text-foreground truncate tracking-tight">{ride.destination}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Driver & Footer */}
        <div className="pt-6 border-t border-border/40 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-primary/10 shadow-soft transition-transform group-hover:scale-110">
                <AvatarImage src={ride.driverAvatar} alt={ride.driverName} />
                <AvatarFallback className="text-xs font-black bg-primary/10 text-primary">
                  {(ride.driverName || "U")[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-success text-white p-0.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm">
                <BadgeCheck className="h-2.5 w-2.5" />
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-xs font-black text-foreground truncate tracking-tight">{ride.driverName}</p>
                {ride.driverGender && (
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                    ride.driverGender.toLowerCase() === 'male' 
                      ? 'bg-blue-100/50 text-blue-700 border border-blue-200' 
                      : 'bg-pink-100/50 text-pink-700 border border-pink-200'
                  }`}>
                    <div className={`w-1 h-1 rounded-full ${ride.driverGender.toLowerCase() === 'male' ? 'bg-blue-500' : 'bg-pink-500'}`} />
                    {ride.driverGender}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 mt-0.5">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 text-primary/60" />
                  {ride.time}
                </p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5 text-primary/60" />
                  {ride.date}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-2 px-3 rounded-2xl bg-primary/5 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Join</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


export default RideCard;
