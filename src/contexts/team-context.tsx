"use client";
import { logWithTimestamp } from '@/lib/utils';
import type { Match, Player, Team } from "@/types/team";
import { Award, BarChart3, Sword, Trophy, User, Users } from "lucide-react";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";

interface TeamContextType {
  currentTeam: Team | null;
  matches: Match[];
  allMatches: Match[];
  setCurrentTeam: (team: Team | string | null) => Promise<void>;
  addStandinPlayer: (
    player: Omit<Player, "isStandin" | "addedDate">,
    standinForId?: string,
  ) => void;
  removeStandinPlayer: (playerId: string) => void;
  addMatch: (match: Omit<Match, "id">) => Promise<void>;
  removeMatch: (matchId: string) => void;
  unhideMatch: (matchId: string) => void;
  getTeamSlug: () => string;
  getExternalLinks: () => Array<{
    href: string;
    label: string;
    icon: React.ReactNode;
  }>;
  isLoaded: boolean;
  hiddenMatchIds: string[];
  setHiddenMatchIds: (ids: string[]) => void;
  // Refreshing state management
  refreshingTeamId: string | null;
  setRefreshingTeamId: (teamId: string | null) => void;
  refreshProgress: { completed: number; total: number } | null;
  setRefreshProgress: (progress: { completed: number; total: number } | null) => void;
  cancelRefresh: () => void;
  // Button state management
  spinningButton: "refresh" | "force" | null;
  setSpinningButton: (button: "refresh" | "force" | null) => void;
  // Force clear matches
  clearMatches: () => void;
  // Refresh matches from API
  refreshMatches: () => Promise<void>;
  refreshingMatches: Set<string>;
  setRefreshingMatches: (matches: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [currentTeam, setCurrentTeamState] = useState<Team | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hiddenMatchIds, setHiddenMatchIds] = useState<string[]>([]);
  const [refreshingTeamId, setRefreshingTeamId] = useState<string | null>(null);
  const [refreshProgress, setRefreshProgress] = useState<{ completed: number; total: number } | null>(null);
  const [spinningButton, setSpinningButton] = useState<"refresh" | "force" | null>(null);
  const [refreshingMatches, setRefreshingMatches] = useState<Set<string>>(new Set());

  // Load teams from localStorage and restore active team
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Use setTimeout to make this non-blocking
      setTimeout(() => {
        try {
          // Load teams from localStorage
          const teamsData = localStorage.getItem("dota-dashboard-teams");
          if (teamsData) {
            const teams: Team[] = JSON.parse(teamsData);
            
            // Load active team ID from localStorage
            const activeTeamId = localStorage.getItem("activeTeamId");
            if (activeTeamId && teams.length > 0) {
              const foundTeam = teams.find(team => team.id === activeTeamId);
              if (foundTeam) {
                setCurrentTeamState(foundTeam);
              }
            }
          }
        } catch (error) {
          logWithTimestamp('error', "[TeamContext] Error loading teams from localStorage:", error);
        } finally {
          setIsLoaded(true);
        }
      }, 0); // Use 0ms timeout to make it async but immediate
    } else {
      setIsLoaded(true);
    }
  }, []);

  // Load hidden matches from localStorage when team changes
  useEffect(() => {
    if (currentTeam) {
      const key = `hiddenMatches-${currentTeam.id}`;
      const stored =
        typeof window !== "undefined" ? localStorage.getItem(key) : null;
      if (stored) {
        try {
          setHiddenMatchIds(JSON.parse(stored));
        } catch {
          setHiddenMatchIds([]);
        }
      } else {
        setHiddenMatchIds([]);
      }
    } else {
      setHiddenMatchIds([]);
    }
  }, [currentTeam]);

  // Fetch matches from API when team changes
  useEffect(() => {
    logWithTimestamp('log', "[TEAM CONTEXT] ===== FETCHING MATCHES FROM API =====");
    logWithTimestamp('log', "[TEAM CONTEXT] Current team:", currentTeam);
    logWithTimestamp('log', "[TEAM CONTEXT] Current team ID:", currentTeam?.id);
    
    if (currentTeam) {
      logWithTimestamp('log', "[TEAM CONTEXT] Making API call to /api/teams/${currentTeam.id}/match-history");
      fetch(`/api/teams/${currentTeam.id}/match-history`)
        .then((res) => {
          logWithTimestamp('log', "[TEAM CONTEXT] API response status:", res.status);
          logWithTimestamp('log', "[TEAM CONTEXT] API response ok:", res.ok);
          return res.json();
        })
        .then((data) => {
          logWithTimestamp('log', "[TEAM CONTEXT] API response data:", data);
          const apiMatches = data.matches || [];
          logWithTimestamp('log', "[TEAM CONTEXT] Setting matches from API:", apiMatches);
          logWithTimestamp('log', "[TEAM CONTEXT] API matches count:", apiMatches.length);
          setAllMatches(apiMatches);
          setMatches(apiMatches.filter((m: Match) => !hiddenMatchIds.includes(m.id)));
        })
        .catch((error) => {
          logWithTimestamp('error', "[TEAM CONTEXT] Error fetching matches:", error);
          logWithTimestamp('log', "[TEAM CONTEXT] Setting empty matches array due to error");
          setAllMatches([]);
          setMatches([]);
        });
    } else {
      logWithTimestamp('log', "[TEAM CONTEXT] No current team, setting empty matches array");
      setAllMatches([]);
      setMatches([]);
    }
  }, [currentTeam, hiddenMatchIds]);

  // Update setCurrentTeam to persist to localStorage
  const setCurrentTeam = async (teamOrId: Team | string | null) => {
    if (typeof window !== "undefined") {
      if (typeof teamOrId === "string" || teamOrId === null) {
        localStorage.removeItem("activeTeamId");
      } else if (teamOrId && teamOrId.id) {
        localStorage.setItem("activeTeamId", teamOrId.id);
        
        // Also update the teams list in localStorage to include this team
        try {
          const existingTeamsData = localStorage.getItem("dota-dashboard-teams");
          const existingTeams: Team[] = existingTeamsData ? JSON.parse(existingTeamsData) : [];
          
          // Check if team already exists in the list
          const teamExists = existingTeams.some(team => team.id === teamOrId.id);
          
          if (!teamExists) {
            // Add the team to the list
            const updatedTeams = [...existingTeams, teamOrId];
            localStorage.setItem("dota-dashboard-teams", JSON.stringify(updatedTeams));
          } else {
            // Update the existing team in the list
            const updatedTeams = existingTeams.map(team => 
              team.id === teamOrId.id ? teamOrId : team
            );
            localStorage.setItem("dota-dashboard-teams", JSON.stringify(updatedTeams));
          }
        } catch (error) {
          logWithTimestamp('error', "[TeamContext] Error updating teams list in localStorage:", error);
        }
      }
    }
    if (typeof teamOrId === "string") {
      setCurrentTeamState(null);
      setMatches([]);
    } else {
      setCurrentTeamState(teamOrId);
    }
  };

  const addStandinPlayer = (
    player: Omit<Player, "isStandin" | "addedDate">,
    standinForId?: string,
  ) => {
    if (!currentTeam) return;
    const standinPlayer: Player = {
      ...player,
      isStandin: true,
      standinFor: standinForId,
      addedDate: new Date().toISOString().split("T")[0],
    };
    const updatedTeam = {
      ...currentTeam,
      players: [...currentTeam.players, standinPlayer],
    };
    setCurrentTeam(updatedTeam);
  };

  const removeStandinPlayer = (playerId: string) => {
    if (!currentTeam) return;
    const updatedTeam = {
      ...currentTeam,
      players: currentTeam.players.filter((player) => player.id !== playerId),
    };
    setCurrentTeam(updatedTeam);
  };

  // Add a match via API
  const addMatch = async (match: Omit<Match, "id">) => {
    if (!currentTeam) return;
    const newMatch: Match = { ...match, id: Date.now().toString() };
    const updatedMatches = [...matches, newMatch];
    await fetch(`/api/teams/${currentTeam.id}/match-history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matches: updatedMatches }),
    });
    setMatches(updatedMatches);
  };

  // Remove a match (hide it locally)
  const removeMatch = (matchId: string) => {
    if (!currentTeam) return;
    const key = `hiddenMatches-${currentTeam.id}`;
    const updatedHidden = [...hiddenMatchIds, matchId];
    setHiddenMatchIds(updatedHidden);
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(updatedHidden));
    }
  };

  // Unhide a match
  const unhideMatch = (matchId: string) => {
    if (!currentTeam) return;
    const key = `hiddenMatches-${currentTeam.id}`;
    const updatedHidden = hiddenMatchIds.filter((id) => id !== matchId);
    setHiddenMatchIds(updatedHidden);
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(updatedHidden));
    }
  };

  // Only show matches not hidden
  const visibleMatches = matches.filter((m) => !hiddenMatchIds.includes(m.id));

  const getTeamSlug = () => {
    if (!currentTeam) return "";
    return currentTeam.tag.toLowerCase();
  };

  const getExternalLinks = () => {
    if (!currentTeam) {
      // Return generic links if no team is selected
      return [
        {
          href: "https://www.dotabuff.com/esports/teams",
          label: "Teams on Dotabuff",
          icon: <Trophy className="w-5 h-5 text-red-500" />,
        },
        {
          href: "https://www.opendota.com/teams",
          label: "Teams on OpenDota",
          icon: <BarChart3 className="w-5 h-5 text-green-500" />,
        },
        {
          href: "https://www.dotabuff.com/esports/leagues",
          label: "Leagues on Dotabuff",
          icon: <Award className="w-5 h-5 text-orange-500" />,
        },
      ];
    }

    const links = [];

    // Team on Dotabuff - use original URL if available, otherwise construct from tag
    if (currentTeam.dotabuffUrl) {
      links.push({
        href: currentTeam.dotabuffUrl,
        label: "Team on Dotabuff",
        icon: <Trophy className="w-5 h-5 text-red-500" />,
      });
    } else {
      // Fallback to constructed URL
      const teamSlug = currentTeam.tag.toLowerCase();
      if (teamSlug) {
        links.push({
          href: `https://www.dotabuff.com/esports/teams/${teamSlug}`,
          label: "Team on Dotabuff",
          icon: <Trophy className="w-5 h-5 text-red-500" />,
        });
      }
    }

    // Team on OpenDota
    const teamSlug = currentTeam.tag.toLowerCase();
    if (teamSlug) {
      links.push({
        href: `https://www.opendota.com/teams/${teamSlug}`,
        label: "Team on OpenDota",
        icon: <BarChart3 className="w-5 h-5 text-green-500" />,
      });
    }

    // League link - use stored URL if available
    if (currentTeam.leagueUrl) {
      links.push({
        href: currentTeam.leagueUrl,
        label: "League on Dotabuff",
        icon: <Award className="w-5 h-5 text-orange-500" />,
      });
    } else if (currentTeam.league) {
      // Check if league is already a full URL
      if (currentTeam.league.startsWith("http")) {
        links.push({
          href: currentTeam.league,
          label: "League on Dotabuff",
          icon: <Award className="w-5 h-5 text-orange-500" />,
        });
      } else {
        // Try to construct league URL from league name
        const leagueSlug = currentTeam.league
          .toLowerCase()
          .replace(/\s+/g, "-");
        links.push({
          href: `https://www.dotabuff.com/esports/leagues/${leagueSlug}`,
          label: "League on Dotabuff",
          icon: <Award className="w-5 h-5 text-orange-500" />,
        });
      }
    }

    // Additional useful links
    links.push(
      {
        href: "https://www.dotabuff.com/players",
        label: "Player Search",
        icon: <User className="w-5 h-5 text-blue-500" />,
      },
      {
        href: "https://www.opendota.com/players",
        label: "Player Database",
        icon: <Users className="w-5 h-5 text-purple-500" />,
      },
      {
        href: "https://www.dotabuff.com/heroes",
        label: "Hero Statistics",
        icon: <Sword className="w-5 h-5 text-gray-600" />,
      },
    );

    return links;
  };

  // Cancel refresh function
  const cancelRefresh = () => {
    setRefreshingTeamId(null);
    setRefreshProgress(null);
    setSpinningButton(null);
  };

  // Force clear matches
  const clearMatches = () => {
    logWithTimestamp('log', "[TEAM CONTEXT] ===== CLEARING MATCHES =====");
    logWithTimestamp('log', "[TEAM CONTEXT] Current matches before clearing:", matches);
    logWithTimestamp('log', "[TEAM CONTEXT] Current matches count before clearing:", matches.length);
    setMatches([]);
    logWithTimestamp('log', "[TEAM CONTEXT] Matches cleared, setting to empty array");
  };

  // Refresh matches from API
  const refreshMatches = async () => {
    if (!currentTeam) return;
    logWithTimestamp('log', "[TEAM CONTEXT] ===== REFRESHING MATCHES FROM API =====");
    logWithTimestamp('log', "[TEAM CONTEXT] Current team:", currentTeam);
    logWithTimestamp('log', "[TEAM CONTEXT] Current team ID:", currentTeam?.id);
    
    try {
      logWithTimestamp('log', "[TEAM CONTEXT] Making API call to /api/teams/${currentTeam.id}/match-history");
      const res = await fetch(`/api/teams/${currentTeam.id}/match-history`);
      logWithTimestamp('log', "[TEAM CONTEXT] API response status:", res.status);
      logWithTimestamp('log', "[TEAM CONTEXT] API response ok:", res.ok);
      const data = await res.json();
      logWithTimestamp('log', "[TEAM CONTEXT] API response data:", data);
      const apiMatches = data.matches || [];
      logWithTimestamp('log', "[TEAM CONTEXT] Setting matches from API:", apiMatches);
      logWithTimestamp('log', "[TEAM CONTEXT] API matches count:", apiMatches.length);
      setAllMatches(apiMatches);
      setMatches(apiMatches.filter((m: Match) => !hiddenMatchIds.includes(m.id)));
    } catch (error) {
      logWithTimestamp('error', "[TEAM CONTEXT] Error refreshing matches:", error);
      logWithTimestamp('log', "[TEAM CONTEXT] Setting empty matches array due to error");
      setAllMatches([]);
      setMatches([]);
    }
  };

  // Wrapper function for setRefreshingMatches that handles both Set and function cases
  const setRefreshingMatchesWrapper = (matches: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    if (typeof matches === 'function') {
      setRefreshingMatches(matches);
    } else {
      setRefreshingMatches(matches);
    }
  };

  return (
    <TeamContext.Provider
      value={{
        currentTeam,
        matches,
        allMatches,
        setCurrentTeam,
        addStandinPlayer,
        removeStandinPlayer,
        addMatch,
        removeMatch,
        unhideMatch,
        getTeamSlug,
        getExternalLinks,
        isLoaded,
        hiddenMatchIds,
        setHiddenMatchIds,
        refreshingTeamId,
        setRefreshingTeamId,
        refreshProgress,
        setRefreshProgress,
        cancelRefresh,
        spinningButton,
        setSpinningButton,
        clearMatches,
        refreshMatches,
        refreshingMatches,
        setRefreshingMatches: setRefreshingMatchesWrapper,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
}
