"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn(
        "animate-spin",
        {
          "w-4 h-4": size === "sm",
          "w-6 h-6": size === "md",
          "w-8 h-8": size === "lg",
        },
        className
      )}
    />
  );
}

interface LoadingCardProps {
  className?: string;
}

export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  );
}

interface LoadingGridProps {
  count?: number;
  columns?: 2 | 3 | 4;
}

export function LoadingGrid({ count = 8, columns = 4 }: LoadingGridProps) {
  return (
    <div
      className={cn("grid gap-4", {
        "grid-cols-1 md:grid-cols-2": columns === 2,
        "grid-cols-1 md:grid-cols-2 lg:grid-cols-3": columns === 3,
        "grid-cols-1 md:grid-cols-2 lg:grid-cols-4": columns === 4,
      })}
    >
      {[...Array(count)].map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}

interface LoadingPageProps {
  title?: string;
}

export function LoadingPage({ title }: LoadingPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse space-y-8">
        {title && <div className="h-8 bg-gray-200 rounded w-1/4"></div>}
        <LoadingGrid />
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function LoadingOverlay({ isVisible, message }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-4">
        <LoadingSpinner size="lg" />
        {message && <span className="text-lg font-medium">{message}</span>}
      </div>
    </div>
  );
}
