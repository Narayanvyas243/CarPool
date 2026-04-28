import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SearchBar from "@/components/SearchBar";
import RideCard, { RideData } from "@/components/RideCard";
import { Car, Map as MapIcon, List } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import GlobalRideMap from "@/components/GlobalRideMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getApiUrl } from "../apiConfig";


import { calculateDistance, getFairPriceEstimate } from "../utils/fareUtils";

const Search = () => {
  const [searchParams] = useSearchParams();
  const [rides, setRides] = useState<RideData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fromQuery = searchParams.get("from") || "";
  const toQuery = searchParams.get("to") || "";

  useEffect(() => {
    setIsLoading(true);
    
    const fetchUrl = (fromQuery || toQuery) 
      ? `/api/rides/search?from=${encodeURIComponent(fromQuery)}&to=${encodeURIComponent(toQuery)}`
      : `/api/rides/all`;

    fetch(getApiUrl(fetchUrl))
      .then(res => res.json())
      .then(data => {
        if (data.rides) {
          const mappedRides = data.rides.map((r: any) => {
            const dateObj = new Date(r.time);
            const driverPrice = r.price !== undefined ? r.price : 50;
            
            let priceComparison = undefined;
            if (r.fromCoords && r.toCoords) {
              const distance = calculateDistance(
                r.fromCoords.lat, r.fromCoords.lng,
                r.toCoords.lat, r.toCoords.lng
              );
              const fairPrice = getFairPriceEstimate(distance);
              priceComparison = {
                fairPrice,
                status: driverPrice < fairPrice * 0.8 ? "cheap" : driverPrice > fairPrice * 1.3 ? "premium" : "fair"
              };
            }

            return {
              id: r._id,
              driverName: r.createdBy?.name || "Unknown",
              driverRole: r.createdBy?.role || "student",
              driverGender: r.createdBy?.gender,
              isVerified: true,
              source: r.fromLocation,
              destination: r.toLocation,
              date: dateObj.toLocaleDateString(),
              time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              availableSeats: r.seatsAvailable,
              totalSeats: r.totalSeats || 4,
              pricePerSeat: driverPrice,
              priceComparison,
              driverId: r.createdBy?._id || r.createdBy || "",
              fromCoords: r.fromCoords,
              toCoords: r.toCoords,
              genderPreference: r.genderPreference,
              isPassenger: r.requests?.some((req: any) => 
                (req.requester?._id === user?.id || req.requester === user?.id) && 
                req.status === "accepted"
              )
            };
          });
          setRides(mappedRides);
        }
      })
      .finally(() => setIsLoading(false));
  }, [fromQuery, toQuery]);

  const handleJoinRide = (rideId: string) => {
    navigate(`/ride/${rideId}`);
  };

  return (
    <Layout userName={user?.name || "Guest"}>
      <div className="container px-4 py-8 space-y-8 animate-in fade-in duration-700">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-foreground tracking-tighter">Find your next ride</h1>
          <p className="text-muted-foreground font-medium">Search for verified student and faculty carpools</p>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <SearchBar />
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-20 animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-4 flex items-center justify-center">
              <Car className="h-6 w-6 text-primary animate-bounce" />
            </div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Searching available rides...</p>
          </div>
        ) : rides.length > 0 ? (
          <Tabs defaultValue="list" className="w-full space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="space-y-0.5">
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  {fromQuery || toQuery ? "Search Results" : "Available Rides"}
                </h2>
                <p className="text-xs text-muted-foreground font-medium">
                  {rides.length} {fromQuery || toQuery ? "rides found for your route" : "rides available"}
                </p>
              </div>
              <TabsList className="bg-secondary/50 p-1 rounded-2xl h-11 border border-border/50 backdrop-blur-sm">
                <TabsTrigger value="list" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg h-9 px-4 font-bold text-xs transition-all">
                  <List className="h-3.5 w-3.5 mr-1.5" />
                  List
                </TabsTrigger>
                <TabsTrigger value="map" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg h-9 px-4 font-bold text-xs transition-all">
                  <MapIcon className="h-3.5 w-3.5 mr-1.5" />
                  Map
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="list" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rides.map(ride => (
                  <RideCard key={ride.id} ride={ride} onJoinRide={handleJoinRide} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="map" className="animate-in fade-in slide-in-from-bottom-2 duration-300 m-0">
              <GlobalRideMap rides={rides} onSelectRide={handleJoinRide} />
              <div className="space-y-4 mt-6">
                <h3 className="text-sm font-medium text-muted-foreground">Nearby Rides</h3>
                {rides.map(ride => (
                  <RideCard key={ride.id} ride={ride} onJoinRide={handleJoinRide} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-16 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Car className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No rides found</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Please try searching with different locations or dates!
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Search;
