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
}

interface RideCardProps {
  ride: RideData;
  onJoinRide?: (rideId: string) => void;
}

const RideCard = ({ ride, onJoinRide }: RideCardProps) => {
  const seatsLeft = ride.availableSeats;
  const seatsFilled = ride.totalSeats - ride.availableSeats;

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-elevated group animate-fade-in">
      <CardContent className="p-0">
        <div className="p-5">
          {/* Driver Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 ring-2 ring-primary/10">
                <AvatarImage src={ride.driverAvatar} alt={ride.driverName} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {ride.driverName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{ride.driverName}</span>
                  {ride.isVerified && (
                    <span className="verified-badge">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground capitalize">
                  {ride.driverRole}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-primary">₹{ride.pricePerSeat}</div>
              <span className="text-xs text-muted-foreground">per seat</span>
            </div>
          </div>

          {/* Route */}
          <div className="space-y-1 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
              <span className="font-medium text-foreground">{ride.source}</span>
            </div>
            <div className="route-line ml-[5px]" />
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-accent flex-shrink-0" />
              <span className="font-medium text-foreground">{ride.destination}</span>
            </div>
          </div>

          {/* Time & Seats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{ride.date} • {ride.time}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span className={seatsLeft <= 1 ? "text-accent font-medium" : ""}>
                {seatsLeft} seat{seatsLeft !== 1 ? 's' : ''} left
              </span>
            </div>
          </div>

          {/* Seat Visualization */}
          <div className="flex gap-1.5 mb-4">
            {Array.from({ length: ride.totalSeats }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i < seatsFilled 
                    ? 'bg-primary' 
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Action */}
        <div className="border-t border-border p-4 bg-secondary/30">
          <Button 
            className="w-full" 
            variant={seatsLeft === 0 ? "secondary" : "default"}
            disabled={seatsLeft === 0}
            onClick={() => onJoinRide?.(ride.id)}
          >
            {seatsLeft === 0 ? "Fully Booked" : "Join Ride"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RideCard;
