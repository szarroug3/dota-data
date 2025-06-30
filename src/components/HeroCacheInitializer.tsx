"use client";
import { logWithTimestamp } from '@/lib/utils';
import { useEffect } from "react";

export default function HeroCacheInitializer() {
  useEffect(() => {
    // Initialize hero cache on app start
    const initializeHeroCache = async () => {
      try {
        const response = await fetch("/api/heroes");
        if (response.ok) {
          // const data = await response.json(); // Unused
        }
      } catch (error) {
        logWithTimestamp('warn', "Failed to initialize hero cache:", error);
      }
    };

    initializeHeroCache();
  }, []);

  // This component doesn't render anything
  return null;
}
