import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertToDirectLink(url: string, type: 'video' | 'thumbnail' = 'video'): string {
  if (!url) return '';

  // Google Drive
  const driveMatch = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    if (type === 'thumbnail') {
      // Use the lh3.googleusercontent.com/d/ID format which is often more reliable for direct embedding
      return `https://lh3.googleusercontent.com/d/${driveMatch[1]}=w1000`;
    }
    // Return the direct download link
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }

  // Google Photos (Direct image links)
  if (url.includes('lh3.googleusercontent.com')) {
    return url;
  }

  return url;
}

export async function resolveLink(url: string, type: 'video' | 'thumbnail' = 'video'): Promise<string> {
  if (!url) return '';

  // Check if it's already a direct link or handled by simple regex
  const direct = convertToDirectLink(url, type);
  if (direct !== url) return direct;

  // If it's a Google Photos link, try to resolve it via our API
  if (url.includes('photos.app.goo.gl') || url.includes('photos.google.com') || url.includes('goo.gl')) {
    try {
      const response = await fetch(`/api/resolve-link?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error('Failed to resolve');
      const data = await response.json();
      
      // Prefer ogImage for thumbnails, or the resolved URL for videos
      if (type === 'thumbnail' && data.ogImage) return data.ogImage;
      if (type === 'video' && data.ogVideo) return data.ogVideo;
      if (data.ogImage) return data.ogImage;
      if (data.finalUrl) return data.finalUrl;
    } catch (error) {
      console.error('Error resolving link:', error);
    }
  }

  return url;
}
