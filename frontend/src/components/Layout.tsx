import { ReactNode } from "react";
import Header from "./Header";
import BottomNav from "./BottomNav";

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
      <main className={`${showNav ? 'pb-20' : ''}`}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
};

export default Layout;
