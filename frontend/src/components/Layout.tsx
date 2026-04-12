import { ReactNode } from "react";
import Header from "./Header";
import BottomNav from "./BottomNav";
import NotificationPopup from "./NotificationPopup";

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showNav?: boolean;
  userName?: string;
  userAvatar?: string;
}

const Layout = ({ 
  children, 
  showHeader = true, 
  showNav = true,
  userName,
  userAvatar 
}: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {showHeader && <Header userName={userName} userAvatar={userAvatar} />}
      <main className={`${showNav ? 'pb-24' : ''}`}>
        {children}
      </main>
      {showNav && <BottomNav />}
      <NotificationPopup />
    </div>
  );
};

export default Layout;
