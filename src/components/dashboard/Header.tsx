'use client'

import { useState } from "react";
import { Bell, ChevronDown, Menu, Settings, LogOut, BarChart3 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HeaderProps {
  restaurantName: string;
  restaurantLogo?: string;
}

export const Header = ({ restaurantName, restaurantLogo }: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/restaurant/logout', { method: 'POST' });
      router.push('/restaurant/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const NavigationItems = () => (
    <>
      <Link 
        href="/dashboard" 
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
          pathname === '/dashboard' 
            ? 'bg-gradient-card border border-glass hover:bg-gradient-to-r hover:from-primary/20 hover:to-accent/20' 
            : 'text-muted-foreground hover:text-foreground hover:bg-gradient-card border border-transparent hover:border-glass'
        }`}
      >
        <BarChart3 className="w-4 h-4" />
        Dashboard
      </Link>
      <Link 
        href="/dashboard/all-feedback" 
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
          pathname === '/dashboard/all-feedback' 
            ? 'bg-gradient-card border border-glass hover:bg-gradient-to-r hover:from-primary/20 hover:to-accent/20' 
            : 'text-muted-foreground hover:text-foreground hover:bg-gradient-card border border-transparent hover:border-glass'
        }`}
      >
        All Feedback
      </Link>
      <Link 
        href="/dashboard/settings" 
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
          pathname === '/dashboard/settings' 
            ? 'bg-gradient-card border border-glass hover:bg-gradient-to-r hover:from-primary/20 hover:to-accent/20' 
            : 'text-muted-foreground hover:text-foreground hover:bg-gradient-card border border-transparent hover:border-glass'
        }`}
      >
        Settings
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-glass bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
            <span className="text-xl font-bold bg-brand-gradient bg-clip-text text-transparent">
              Restaurant Feedback
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 ml-8">
            <NavigationItems />
          </nav>
        </div>

        {/* Restaurant Info & Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative hover:bg-gradient-card border border-transparent hover:border-glass">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-negative rounded-full animate-pulse"></span>
          </Button>

          {/* Restaurant Profile */}
          <div className="relative">
            <Button variant="ghost" className="flex items-center gap-3 px-3 hover:bg-gradient-card border border-transparent hover:border-glass">
              <div className="flex items-center gap-3">
                {restaurantLogo ? (
                  <img src={restaurantLogo} alt={restaurantName} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-positive flex items-center justify-center text-white font-semibold text-sm">
                    {restaurantName.charAt(0)}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">{restaurantName}</p>
                  <p className="text-xs text-muted-foreground">Restaurant Owner</p>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-56 bg-card/90 backdrop-blur-lg border border-glass rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="p-2">
                <Link href="/dashboard/settings" className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-gradient-card transition-colors">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <div className="h-px bg-border my-1"></div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-destructive hover:bg-gradient-negative/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden hover:bg-gradient-card border border-transparent hover:border-glass"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-glass">
          <div className="flex flex-col gap-2 p-4">
            <NavigationItems />
          </div>
        </div>
      )}
    </header>
  );
};
