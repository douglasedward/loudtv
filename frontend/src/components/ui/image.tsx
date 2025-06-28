import { User } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallback?: string;
}

export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 400,
  className = "",
  fallback,
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError || !src) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        {fallback ? (
          <span className="text-gray-500 text-sm">{fallback}</span>
        ) : (
          <User className="w-8 h-8 text-gray-400" />
        )}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setImageError(true)}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    />
  );
}

// Avatar-specific component
export function Avatar({
  src,
  alt,
  size = 40,
  className = "",
}: {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src || ""}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      fallback={alt.charAt(0).toUpperCase()}
    />
  );
}
