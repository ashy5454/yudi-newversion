import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to safely convert Firestore timestamps to Date objects
export function toDate(date: unknown): Date | null {
  if (date == null) return null;

  if (date instanceof Date) return date;

  if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as { toDate: unknown }).toDate === 'function') {
    return (date as { toDate: () => Date }).toDate();
  }

  if (typeof date === 'string') {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof date === 'number') {
    return new Date(date);
  }

  return null;
}

// Utility function to format time safely
export function formatTime(date: unknown): string {
  const dateObj = toDate(date);
  if (!dateObj) return '';
  
  return dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Utility function to format date safely
export function formatDate(date: unknown): string {
  const dateObj = toDate(date);
  if (!dateObj) return '';
  
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

// Utility function to format relative time
export function formatRelativeTime(date: unknown): string {
  const dateObj = toDate(date);
  if (!dateObj) return '';
  
  const now = new Date();
  const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return formatTime(dateObj);
  } else {
    return formatDate(dateObj);
  }
}
