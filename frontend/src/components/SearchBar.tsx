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
    <div className="bg-card rounded-2xl p-4 shadow-soft border border-border">
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            <Input 
              placeholder="From (e.g., UPES Campus)" 
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="pl-11 pr-12 h-12 bg-secondary border-0 focus-visible:ring-primary/30"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <MapPicker 
                title="Select Pickup" 
                onLocationSelect={(loc) => setFrom(loc.address)} 
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-accent" />
            <Input 
              placeholder="To (e.g., Dehradun City)" 
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="pl-11 pr-12 h-12 bg-secondary border-0 focus-visible:ring-primary/30"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <MapPicker 
                title="Select Destination" 
                onLocationSelect={(loc) => setTo(loc.address)} 
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-11 h-12 bg-secondary border-0 focus-visible:ring-primary/30"
            />
          </div>
          
          <Button onClick={handleSearch} size="lg" className="h-12 px-6">
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
