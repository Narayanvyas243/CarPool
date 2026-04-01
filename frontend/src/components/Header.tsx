import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

interface HeaderProps {
  userName?: string;
  userAvatar?: string;
  showNotification?: boolean;
}

const Header = ({ userName = "Guest", userAvatar, showNotification = true }: HeaderProps) => {
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
            <span className="text-lg font-bold text-primary-foreground">U</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">UPES BlaBla</h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Campus Rides</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {showNotification && (
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full animate-pulse-soft" />
            </Button>
          )}
          
          <Link to="/profile">
            <Avatar className="h-9 w-9 ring-2 ring-primary/20 transition-shadow hover:ring-primary/40">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
