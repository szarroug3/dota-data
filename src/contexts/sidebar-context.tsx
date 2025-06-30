"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  preferredSite: "dotabuff" | "opendota";
  setPreferredSite: (site: "dotabuff" | "opendota") => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [preferredSite, setPreferredSiteState] = useState<
    "dotabuff" | "opendota"
  >("dotabuff");
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sidebar-collapsed");
      if (stored !== null) {
        setCollapsed(JSON.parse(stored));
      }
      const storedSite = localStorage.getItem("preferred-site");
      if (storedSite === "dotabuff" || storedSite === "opendota") {
        setPreferredSiteState(storedSite);
      }
      setHasMounted(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
    }
  }, [collapsed]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred-site", preferredSite);
    }
  }, [preferredSite]);

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
