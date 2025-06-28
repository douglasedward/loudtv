"use client";

import {
  LogOut,
  Search,
  Settings,
  TrendingUp,
  User,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { MobileNavigation } from "@/components/MobileNavigation";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateAvatarUrl } from "@/lib/utils";
import { useAuthStore } from "@/store";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-3xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Video className="w-8 h-8 text-red-500" />
              <span className="text-xl font-bold">LoudTV</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/trending"
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Trending</span>
              </Link>
              <Link
                href="/categories"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Categories
              </Link>
            </nav>
          </div>

          {/* Search Bar - Hidden on small screens */}
          <form
            onSubmit={handleSearch}
            className="hidden sm:flex flex-1 max-w-md mx-8"
          >
            <div className="relative w-full">
              <Input
                type="search"
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 rounded-3xl"
              />
              <Button
                type="submit"
                variant="ghost"
                className="absolute right-0 top-0 h-full rounded-r-3xl bg-accent hover:bg-accent/90"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </form>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {/* Notifications - Hidden on mobile */}
                <div className="hidden sm:block">
                  <NotificationDropdown />
                </div>

                {/* User Avatar Menu - Hidden on mobile */}
                <div className="relative hidden sm:block">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 hover:bg-accent rounded-lg p-2 transition-colors"
                  >
                    <Image
                      src={user.avatarUrl || generateAvatarUrl(user.username)}
                      alt={user.displayName || "User Avatar"}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="hidden md:block text-sm font-medium">
                      {user.displayName}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-background border rounded-lg shadow-lg py-1 z-50">
                      <Link
                        href={`/user/${user.username}`}
                        className="flex items-center px-4 py-2 text-sm hover:bg-accent"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        My Profile
                      </Link>
                      <Link
                        href="/dashboard"
                        className="flex items-center px-4 py-2 text-sm hover:bg-accent"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center px-4 py-2 text-sm hover:bg-accent"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm hover:bg-accent text-left"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}

            {/* Mobile Navigation */}
            <MobileNavigation />
          </div>
        </div>
      </div>
    </header>
  );
}
