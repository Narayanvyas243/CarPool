import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  IndianRupee,
  Car,
  QrCode,
  ArrowLeft,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";

const CreateRide = () => {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState("4");
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCreateRide = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!source || !destination || !date || !time || !seats || !price) {
      toast({
        title: "Missing Information",
        description: "Please fill all the fields",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({ title: "Unauthorized", description: "You must log in to create a ride."});
      navigate("/login");
      return;
    }

    setIsLoading(true);

    try {
      const dateTimeString = new Date(`${date}T${time}`).toISOString();

      const res = await fetch('/api/rides/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromLocation: source,
          toLocation: destination,
          time: dateTimeString,
          seatsAvailable: parseInt(seats, 10),
          totalSeats: parseInt(seats, 10),
          price: parseInt(price, 10),
          createdBy: user.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create ride');

      toast({
        title: "Ride Created! 🚗",
        description: "Your ride is now visible to other students",
      });
      navigate("/");
    } catch (err: any) {
      toast({
        title: "Error creating ride",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout userName={user?.name || "Student"} showNav={false}>
      {/* Custom Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold ml-2">Create Ride</h1>
        </div>
      </div>

      <div className="container px-4 py-6 pb-8">
        <Card className="border-0 shadow-elevated animate-fade-in">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Offer a Ride</CardTitle>
                <CardDescription>Share your journey with fellow students</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRide} className="space-y-5">
              {/* Route */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Route</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  <Input
                    placeholder="Pickup location (e.g., UPES Campus)"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="pl-11 h-12 bg-secondary border-0"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-accent" />
                  <Input
                    placeholder="Drop-off location (e.g., Clock Tower)"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="pl-11 h-12 bg-secondary border-0"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="pl-11 h-12 bg-secondary border-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="pl-11 h-12 bg-secondary border-0"
                    />
                  </div>
                </div>
              </div>

              {/* Seats & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Available Seats</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="number"
                      min="1"
                      max="6"
                      value={seats}
                      onChange={(e) => setSeats(e.target.value)}
                      className="pl-11 h-12 bg-secondary border-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Price per seat</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0"
                      placeholder="50"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="pl-11 h-12 bg-secondary border-0"
                    />
                  </div>
                </div>
              </div>

              {/* QR Payment Info */}
              <div className="bg-secondary/50 rounded-xl p-4 flex items-start gap-3">
                <QrCode className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Payment QR Code</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Your UPI QR code from your profile will be shown to passengers for payment
                  </p>
                </div>
              </div>

              {/* Info */}
              <div className="bg-primary/5 rounded-xl p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p>Once created, your ride will be visible to all verified UPES students and faculty. You'll receive notifications when someone joins.</p>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="animate-pulse">Creating ride...</span>
                ) : (
                  <>
                    <Car className="h-5 w-5 mr-2" />
                    Create Ride
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateRide;
