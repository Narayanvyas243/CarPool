import { useState } from "react";
import { Search, MapPin, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import MapPicker from "./MapPicker";

interface SearchBarProps {
  onSearch?: (query: { from: string; to: string }) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (onSearch) {
      onSearch({ from, to });
    } else {
      navigate(`/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 border-white/40 shadow-premium animate-in fade-in zoom-in-95 duration-500">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-1">Pickup Location</span>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center transition-colors group-focus-within:bg-primary/20">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <Input 
                placeholder="Where from?" 
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="pl-14 pr-12 h-14 bg-secondary/50 border-border/50 focus-visible:ring-primary/30 rounded-2xl font-medium"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <MapPicker 
                  title="Select Pickup" 
                  type="pickup"
                  onLocationSelect={(loc) => setFrom(loc.address)} 
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-1">Destination</span>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center transition-colors group-focus-within:bg-accent/20">
                <MapPin className="h-4 w-4 text-accent" />
              </div>
              <Input 
                placeholder="Where to?" 
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="pl-14 pr-12 h-14 bg-secondary/50 border-border/50 focus-visible:ring-primary/30 rounded-2xl font-medium"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <MapPicker 
                  title="Select Destination" 
                  type="dropoff"
                  onLocationSelect={(loc) => setTo(loc.address)} 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <div className="space-y-1.5 flex-1">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-1">Date</span>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-12 h-14 bg-secondary/50 border-border/50 focus-visible:ring-primary/30 rounded-2xl font-medium"
              />
            </div>
          </div>
          
          <div className="flex items-end flex-shrink-0">
            <Button 
              onClick={handleSearch} 
              size="lg" 
              className="h-14 w-full sm:w-auto px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Search className="h-5 w-5 mr-2" />
              Find Rides
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
