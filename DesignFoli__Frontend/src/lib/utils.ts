import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
};

export const getFullUrl = (url: string | unknown): string => {
  if (!url) return "";
  
  // Convert to string if not already
  const urlString = String(url);
  
  // If URL already starts with http/https, return as is
  if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
    return urlString;
  }
  
  // Handle Cloudinary URLs - if it looks like a Cloudinary public ID
  if (!urlString.startsWith('/') && !urlString.includes('://')) {
    // Check if it might be a Cloudinary public ID (contains typical Cloudinary path patterns)
    if (urlString.includes('/') || urlString.match(/^[a-zA-Z0-9_-]+\.[a-zA-Z]{3,4}$/)) {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
      if (cloudName) {
        return `https://res.cloudinary.com/${cloudName}/image/upload/${urlString}`;
      }
    }
  }
  
  // If URL starts with / (relative path), prepend API base URL
  if (urlString.startsWith('/')) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    return `${apiBaseUrl}${urlString}`;
  }
  
  // Return as is for other cases
  return urlString;
};
