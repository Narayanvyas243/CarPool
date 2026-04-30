import { useState, useEffect } from "react";
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
  Check,
  ArrowLeft,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../apiConfig";
import MapPicker from "@/components/MapPicker";
import { calculateDistance, getFairPriceEstimate } from "@/utils/fareUtils";

const CreateRide = () => {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [fromCoords, setFromCoords] = useState<{lat: number, lng: number} | null>(null);
  const [toCoords, setToCoords] = useState<{lat: number, lng: number} | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState("4");
  const [price, setPrice] = useState("");
  const { user } = useAuth();
  const [genderPreference, setGenderPreference] = useState("any");
  const [upiId, setUpiId] = useState(user?.upiId || "");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.upiId && !upiId) {
      setUpiId(user.upiId);
    }
  }, [user, upiId]);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const toggleDay = (day: string) => {
    setRecurringDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const suggestedPrice = fromCoords && toCoords 
    ? getFairPriceEstimate(calculateDistance(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng))
    : null;

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
    const rideDateTime = new Date(`${date}T${time}`);
    const now = new Date();

    if (rideDateTime < new Date(now.getTime() - 60000)) {
      toast({
        title: "Invalid Time",
        description: "You cannot create a ride for a past date or time.",
        variant: "destructive",
      });
      return;
    }

    // Force strict coordinate selection
    if (!fromCoords || !toCoords) {
      toast({
        title: "Exact Location Required",
        description: "Please select both locations from the map or search results to ensure accuracy.",
        variant: "destructive"
      });
      return;
    }

    const DDN_BOUNDS = { minLat: 30.15, maxLat: 30.55, minLng: 77.75, maxLng: 78.30 };
    const isInDdn = (c: {lat: number, lng: number} | null) => 
      c && c.lat >= DDN_BOUNDS.minLat && c.lat <= DDN_BOUNDS.maxLat && 
      c.lng >= DDN_BOUNDS.minLng && c.lng <= DDN_BOUNDS.maxLng;

    setIsLoading(true);

    try {
      if (!isInDdn(fromCoords) || !isInDdn(toCoords)) {
        toast({
          title: "Location Restricted",
          description: "Both pickup and drop-off must be within the Dehradun/UPES region. Please use the map picker for precision.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const dateTimeString = new Date(`${date}T${time}`).toISOString();

      const res = await fetch(getApiUrl('/api/rides/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromLocation: source,
          toLocation: destination,
          fromCoords,
          toCoords,
          time: dateTimeString,
          seatsAvailable: parseInt(seats, 10),
          totalSeats: parseInt(seats, 10),
          price: parseInt(price, 10),
          genderPreference,
          upiId: upiId || user?.upiId,
          createdBy: user.id,
          isRecurring,
          recurringDays
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

  const isFormReady = source && destination && fromCoords && toCoords && date && time && seats && price;

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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Route</label>
                  {!fromCoords || !toCoords ? (
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <MapPin className="h-3 w-3" /> Pin Locations on Map
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="h-3 w-3" /> All Locations Verified
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground ml-1">Pickup</span>
                      {fromCoords && (
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100/50 px-1.5 py-0.5 rounded">Pin Verified</span>
                      )}
                    </div>
                    <MapPicker 
                      title="Select Pickup Location" 
                      type="pickup"
                      initialLocation={fromCoords || undefined}
                      onLocationSelect={(loc) => {
                        setSource(loc.address);
                        setFromCoords({ lat: loc.lat, lng: loc.lng });
                      }} 
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    <Input
                      placeholder="Pickup location (e.g., UPES Campus)"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="pl-11 h-12 bg-secondary border-0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground ml-1">Drop-off</span>
                      {toCoords && (
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100/50 px-1.5 py-0.5 rounded">Pin Verified</span>
                      )}
                    </div>
                    <MapPicker 
                      title="Select Drop-off Location" 
                      type="dropoff"
                      initialLocation={toCoords || undefined}
                      onLocationSelect={(loc) => {
                        setDestination(loc.address);
                        setToCoords({ lat: loc.lat, lng: loc.lng });
                      }} 
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
              </div>

              {/* Date & Time */}
              {/* Rest of the form remains the same */}
              {/* ... mapping to existing lines ... */}

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
                      min={new Date().toISOString().split('T')[0]}
                      className="pl-11 h-12 bg-secondary border-0 [color-scheme:dark]"
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

              {/* Recurring Toggle */}
              <div className="space-y-3 p-3 bg-secondary/30 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-bold text-foreground">Recurring Ride?</label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Automatically create this ride every week for the next 4 weeks.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button"
                      variant={isRecurring ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsRecurring(true)}
                      className={isRecurring ? "bg-primary text-primary-foreground shadow-md" : "bg-background"}
                    >
                      Yes
                    </Button>
                    <Button 
                      type="button"
                      variant={!isRecurring ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsRecurring(false)}
                      className={!isRecurring ? "bg-secondary text-foreground border-transparent shadow-sm" : "bg-background"}
                    >
                      No
                    </Button>
                  </div>
                </div>
                
                {isRecurring && (
                  <div className="pt-2 border-t border-border/50 animate-fade-in">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Select Days</label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                            recurringDays.includes(day) 
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                              : 'bg-background text-muted-foreground border-border hover:bg-secondary'
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Price per seat</label>
                    {suggestedPrice && (
                      <span 
                        className="text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
                        onClick={() => setPrice(suggestedPrice.toString())}
                        title="Click to apply"
                      >
                        Smart Fare: ₹{suggestedPrice}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0"
                      placeholder={suggestedPrice ? suggestedPrice.toString() : "50"}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="pl-11 h-12 bg-secondary border-0"
                    />
                  </div>
                  {suggestedPrice && (
                    <p className="text-[9px] text-muted-foreground px-1 font-medium">Tap the Smart Fare badge above to apply.</p>
                  )}
                </div>
              </div>
              
              {/* Gender Preference */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Ride Preference</label>
                <div className="grid grid-cols-3 gap-3">
                  {['any', 'male', 'female'].map((pref) => (
                    <Button
                      key={pref}
                      type="button"
                      variant={genderPreference === pref ? "default" : "outline"}
                      onClick={() => setGenderPreference(pref)}
                      className={`h-11 capitalize text-[10px] font-black tracking-widest rounded-2xl transition-all ${
                        genderPreference === pref ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' : 'bg-secondary/40 border-0 hover:bg-secondary/60'
                      }`}
                    >
                      {pref === 'any' ? 'Anyone' : pref}
                    </Button>
                  ))}
                </div>
                <p className="text-[9px] text-muted-foreground/70 font-bold uppercase tracking-wider px-1">
                   {genderPreference === 'any' ? "🔓 Open to all genders" : 
                    genderPreference === 'male' ? "🛡️ Restricted to Male passengers" : 
                    "🛡️ Restricted to Female passengers"}
                </p>
              </div>

               {/* Payment UPI ID */}
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Payment UPI ID</label>
                    <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">Commission Free</span>
                 </div>
                 <div className="relative">
                   <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                   <Input
                     placeholder="yourname@okaxis"
                     value={upiId}
                     onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                     className="pl-11 h-12 bg-secondary border-0 font-medium"
                   />
                 </div>
                 <p className="text-[9px] text-muted-foreground/70 font-bold uppercase tracking-wider px-1 leading-relaxed">
                   🔒 Defaults to your profile UPI. You can change it for this specific ride if needed.
                 </p>
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
                className="w-full h-12 mt-4" 
                size="lg"
                disabled={isLoading || !isFormReady}
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
