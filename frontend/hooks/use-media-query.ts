// hooks/use-media-query.ts
"use client";

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Pastikan code ini hanya berjalan di client side
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    
    // Handler untuk perubahan media query
    const handler = () => setMatches(media.matches);
    
    // Set initial value
    setMatches(media.matches);
    
    // Add listener
    media.addEventListener('change', handler);
    
    // Cleanup
    return () => media.removeEventListener('change', handler);
  }, [query]);

  return matches;
}