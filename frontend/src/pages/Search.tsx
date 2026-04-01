import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SearchBar from "@/components/SearchBar";
import RideCard, { RideData } from "@/components/RideCard";
import { Car } from "lucide-react";
import { useAuth } from "../context/AuthContext";

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
    fetch(`/api/rides/search?from=${encodeURIComponent(fromQuery)}&to=${encodeURIComponent(toQuery)}`)
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
              totalSeats: 4,
              pricePerSeat: 50
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
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Results</h2>
            {rides.map(ride => (
              <RideCard key={ride.id} ride={ride} onJoinRide={handleJoinRide} />
            ))}
          </div>
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
