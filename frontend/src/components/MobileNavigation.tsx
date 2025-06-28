"use client";

import {
  Grid3X3,
  Home,
  LogOut,
  Menu,
  Search,
  Settings,
  TrendingUp,
  User,
  Video,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname,useRouter } from "next/navigation";
import { useEffect,useState } from "react";

import { Button } from "@/components/ui/button";
import { generateAvatarUrl } from "@/lib/utils";
import { useAuthStore } from "@/store";

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "Search", href: "/search", icon: Search },
    { name: "Trending", href: "/trending", icon: TrendingUp },
    { name: "Categories", href: "/categories", icon: Grid3X3 },
  ];

  const userNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: Video },
    { name: "Analytics", href: "/analytics", icon: TrendingUp },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    router.push("/");
  };

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden">
          <div className="fixed inset-y-0 left-0 w-64 bg-background border-r shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">LoudTV</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="p-4 space-y-6">
              {/* User section */}
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted">
                  <img
                    src={user.avatar || generateAvatarUrl(user.username)}
                    alt={user.displayName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/auth/login">
                    <Button className="w-full">Sign In</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button variant="outline" className="w-full">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}

              {/* Main navigation */}
              <nav className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Explore
                </p>
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        pathname === item.href
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* User navigation */}
              {isAuthenticated && user && (
                <nav className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Creator Tools
                  </p>
                  {userNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          pathname === item.href
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              )}

              {/* Profile navigation */}
              {isAuthenticated && user && (
                <nav className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Account
                  </p>
                  <Link
                    href={`/user/${user.username}`}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted"
                  >
                    <User className="h-5 w-5" />
                    <span>My Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </nav>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function MobileBottomNavigation() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "Search", href: "/search", icon: Search },
    { name: "Trending", href: "/trending", icon: TrendingUp },
    { name: "Categories", href: "/categories", icon: Grid3X3 },
  ];

  if (isAuthenticated) {
    navigation.push({ name: "Dashboard", href: "/dashboard", icon: Video });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden z-40">
      <div className="flex">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 px-1 text-xs ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${isActive ? "stroke-2" : ""}`} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
