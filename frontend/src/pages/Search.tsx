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


const Search = () => {
  const [searchParams] = useSearchParams();
  const [rides, setRides] = useState<RideData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fromQuery = searchParams.get("from") || "";
  const toQuery = searchParams.get("to") || "";

  useEffect(() => {
    if (!fromQuery && !toQuery) return;

    setIsLoading(true);
    fetch(getApiUrl(`/api/rides/search?from=${encodeURIComponent(fromQuery)}&to=${encodeURIComponent(toQuery)}`))
      .then(res => res.json())
      .then(data => {
        if (data.rides) {
          const mappedRides = data.rides.map((r: any) => {
            const dateObj = new Date(r.time);
            return {
              id: r._id,
              driverName: r.createdBy?.name || "Unknown",
              driverRole: r.createdBy?.role || "student",
              isVerified: true,
              source: r.fromLocation,
              destination: r.toLocation,
              date: dateObj.toLocaleDateString(),
              time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              availableSeats: r.seatsAvailable,
              totalSeats: r.totalSeats || 4,
              pricePerSeat: r.price !== undefined ? r.price : 50,
              driverId: r.createdBy?._id || r.createdBy || "",
              fromCoords: r.fromCoords,
              toCoords: r.toCoords,
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
      <div className="container px-4 py-6 space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground mb-2">Find a Ride</h1>
          <p className="text-muted-foreground">Search for rides between campus and city</p>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <SearchBar />
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <span className="animate-pulse">Searching rides...</span>
          </div>
        ) : rides.length > 0 ? (
          <Tabs defaultValue="list" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Results ({rides.length})</h2>
              <TabsList className="bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="list" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-8 px-3">
                  <List className="h-4 w-4 mr-1.5" />
                  List
                </TabsTrigger>
                <TabsTrigger value="map" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-8 px-3">
                  <MapIcon className="h-4 w-4 mr-1.5" />
                  Map
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="list" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 m-0">
              {rides.map(ride => (
                <RideCard key={ride.id} ride={ride} onJoinRide={handleJoinRide} />
              ))}
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
