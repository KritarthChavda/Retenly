"use client"
import { createPortal } from "react-dom";
import { useState, useEffect, useRef } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setIsOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuOpen && menuRef.current && profileButtonRef.current) {
        if (
          !menuRef.current.contains(event.target as Node) &&
          !profileButtonRef.current.contains(event.target as Node)
        ) {
          setMenuOpen(false);
        }
      }

      if (isOpen && mobileMenuRef.current && mobileButtonRef.current) {
        if (
          !mobileMenuRef.current.contains(event.target as Node) &&
          !mobileButtonRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, isOpen]);

  //For calculating the settings dropdown position
  useEffect(() => {
    const updateMenuPosition = () => {
      if (menuOpen && profileButtonRef.current) {
        const r = profileButtonRef.current.getBoundingClientRect();
        setMenuPos({
          top: r.bottom + 8,   // small gap
          left: r.right - 224, // 224px = w-56
        });
      }
    };

    window.addEventListener("scroll", updateMenuPosition);
    window.addEventListener("resize", updateMenuPosition);

    // trigger once when opened
    if (menuOpen) updateMenuPosition();

    return () => {
      window.removeEventListener("scroll", updateMenuPosition);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [menuOpen]);


  const toggleProfileMenu = () => {
    setMenuOpen(prev => {
      const next = !prev;
      if (next && profileButtonRef.current) {
        const r = profileButtonRef.current.getBoundingClientRect();
        // align the right edge of a w-56 menu with the button
        setMenuPos({
          top: r.bottom + window.scrollY + 8,               // 8px gap
          left: r.right + window.scrollX - 224,              // 224px = w-56
        });
      }
      return next;
    });
  };

  // Handle clicks outside of dropdowns
  // Close menus when pathname changes (navigation occurs)
  useEffect(() => {
    setIsOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Handle clicks outside of dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Profile menu click outside
      if (menuOpen && menuRef.current && profileButtonRef.current) {
        if (!menuRef.current.contains(event.target as Node) && 
            !profileButtonRef.current.contains(event.target as Node)) {
          setMenuOpen(false);
        }
      }
      
      // Mobile menu click outside
      if (isOpen && mobileMenuRef.current && mobileButtonRef.current) {
        if (!mobileMenuRef.current.contains(event.target as Node) && 
            !mobileButtonRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen, isOpen]);


  const toggleMobileMenu = () => {
    if (!isOpen) {
      setMenuOpen(false);
    }
    setIsOpen((prev) => !prev);
  };

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
// w-full border-b border-glass sticky top-0 z-50 bg-background/80 backdrop-blur-md
  return (
  <header className="sticky top-0 z-[80] w-full border-b border-glass
                   bg-background/50 backdrop-blur-md
                   supports-[backdrop-filter:blur(0)]:bg-background/60
                   text-foreground transition-all duration-200">
      <div className="container flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        {/* Logo & Brand */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src="/retently-logo.svg"
              alt="Retenly"
              className="h-10 w-auto object-contain sm:h-10"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 ml-8">
            <NavigationItems />
          </nav>
        </div>

        {/* Restaurant Info & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative hover:bg-gradient-card border border-transparent hover:border-glass">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-negative rounded-full animate-pulse"></span>
          </Button>

          {/* Restaurant Profile */}
          <div className="relative">
            <Button
              ref={profileButtonRef}
              variant="ghost"
              className="flex items-center gap-3 px-2 sm:px-3 hover:bg-gradient-card border border-transparent hover:border-glass"
              onClick={toggleProfileMenu}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
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
            {menuOpen && menuPos && createPortal(
              <div
                ref={menuRef}
                className="
                  fixed z-[100] w-56 rounded-lg border border-glass shadow-lg
                  bg-background/50 backdrop-blur-md backdrop-saturate-150
                  supports-[backdrop-filter:blur(0)]:bg-background/60
                  text-foreground transition-none   // ← no animation on mount/position
                "
                style={{ top: menuPos.top, left: menuPos.left }}
                role="menu"
              >
                <div className="p-2">
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-md
                              hover:bg-gradient-card transition-colors"  // keep hover transitions here
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-md
                              text-destructive hover:bg-gradient-negative/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>,
              document.body
            )}
          </div>

          {/* Mobile Menu */}
          <Button 
            ref={mobileButtonRef}
            variant="ghost" 
            size="icon" 
            className="md:hidden hover:bg-gradient-card border border-transparent hover:border-glass"
            onClick={toggleMobileMenu}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div ref={mobileMenuRef} className="md:hidden border-t border-glass bg-background shadow-lg">
          <div className="flex flex-col gap-2 px-4 py-4 sm:px-6">
            <NavigationItems />
          </div>
        </div>
      )}
    </header>
  );
};
