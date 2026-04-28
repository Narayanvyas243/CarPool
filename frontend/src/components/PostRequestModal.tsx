import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Calendar, Clock, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../apiConfig";
import { useToast } from "@/hooks/use-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PostRequestModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seatsNeeded, setSeatsNeeded] = useState("1");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromLocation || !toLocation || !date || !time || !user) {
      toast({ title: "Incomplete", description: "Please fill all fields.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const dateTimeString = new Date(`${date}T${time}`).toISOString();
      const res = await fetch(getApiUrl("/api/ride-requests"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requester: user.id,
          fromLocation,
          toLocation,
          time: dateTimeString,
          seatsNeeded: parseInt(seatsNeeded)
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Failed to post request");
      
      toast({ title: "Request Posted! 📢", description: "Drivers can now see your request." });
      setFromLocation("");
      setToLocation("");
      setDate("");
      setTime("");
      setSeatsNeeded("1");
      onSuccess();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request a Ride</DialogTitle>
          <DialogDescription>Let drivers know where you need to go.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
              <Input
                placeholder="Pickup (e.g. Clock Tower)"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className="pl-11 h-12 bg-secondary/50 border-0"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-accent" />
              <Input
                placeholder="Drop-off (e.g. UPES Bidholi)"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="pl-11 h-12 bg-secondary/50 border-0"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="pl-9 h-11 bg-secondary/50 border-0 text-sm [color-scheme:dark]"
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-9 h-11 bg-secondary/50 border-0 text-sm"
                />
              </div>
            </div>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="number"
                min="1"
                max="6"
                placeholder="Seats needed"
                value={seatsNeeded}
                onChange={(e) => setSeatsNeeded(e.target.value)}
                className="pl-11 h-12 bg-secondary/50 border-0"
              />
            </div>
          </div>
          <div className="pt-2">
            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? "Posting..." : "Post Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PostRequestModal;
