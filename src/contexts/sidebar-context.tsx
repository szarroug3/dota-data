"use client";
import * as React from 'react';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { SidebarContextType, PreferredSite } from "../types/contexts";

// ============================================================================
// CONSTANTS
// ============================================================================

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";
const PREFERRED_SITE_KEY = "preferred-site";
const DEFAULT_PREFERRED_SITE: PreferredSite = "dotabuff";

// ============================================================================
// LOCAL STORAGE HELPERS
// ============================================================================

function loadSidebarState(): { collapsed: boolean; preferredSite: PreferredSite } {
  if (typeof window === "undefined") {
    return { collapsed: false, preferredSite: DEFAULT_PREFERRED_SITE };
  }

  const storedCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
  const storedSite = localStorage.getItem(PREFERRED_SITE_KEY);

  const collapsed = storedCollapsed !== null ? JSON.parse(storedCollapsed) as boolean : false;
  const preferredSite: PreferredSite = (storedSite === "dotabuff" || storedSite === "opendota") 
    ? storedSite 
    : DEFAULT_PREFERRED_SITE;

  return { collapsed, preferredSite };
}

function saveSidebarState(collapsed: boolean, preferredSite: PreferredSite): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(collapsed));
    localStorage.setItem(PREFERRED_SITE_KEY, preferredSite);
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [preferredSite, setPreferredSiteState] = useState<PreferredSite>(DEFAULT_PREFERRED_SITE);
  const [hasMounted, setHasMounted] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const { collapsed: storedCollapsed, preferredSite: storedSite } = loadSidebarState();
      setCollapsed(storedCollapsed);
      setPreferredSiteState(storedSite);
      setHasMounted(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      saveSidebarState(collapsed, preferredSite);
    }
  }, [collapsed, preferredSite]);

  if (!hasMounted) return null;

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        setCollapsed,
        preferredSite,
        setPreferredSite: setPreferredSiteState,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
