"use client";
import { Award, Sword, Trophy, User, Users } from "lucide-react";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { logWithTimestamp } from '../lib/utils';
import type { Match, Player, Team } from '../types/team';
import { useMatchData } from './match-data-context';

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
  // Force refresh state
  isForceRefreshing: boolean;
  setIsForceRefreshing: (isForceRefreshing: boolean) => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

// Custom hook for loading teams and active team from localStorage
function useLoadTeamsFromLocalStorage(setCurrentTeamState: (team: Team | null) => void, setIsLoaded: (loaded: boolean) => void) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      setTimeout(() => {
        try {
          const teamsData = localStorage.getItem("dota-dashboard-teams");
          if (teamsData) {
            const teams: Team[] = JSON.parse(teamsData);
            if (teams.length > 0) {
              const activeTeamId = localStorage.getItem("activeTeamId");
              if (activeTeamId) {
                const foundTeam = teams.find(team => team.id === activeTeamId);
                if (foundTeam) {
                  setCurrentTeamState(foundTeam);
                } else {
                  // Active team not found, set first team as active
                  setCurrentTeamState(teams[0]);
                  localStorage.setItem("activeTeamId", teams[0].id);
                }
              } else {
                // No active team ID saved, set first team as active
                setCurrentTeamState(teams[0]);
                localStorage.setItem("activeTeamId", teams[0].id);
              }
            }
          }
        } catch (error) {
          logWithTimestamp('error', "[TeamContext] Error loading teams from localStorage:", error);
        } finally {
          setIsLoaded(true);
        }
      }, 0);
    } else {
      setIsLoaded(true);
    }
  }, [setCurrentTeamState, setIsLoaded]);
}

// Custom hook for loading hidden matches from localStorage
function useLoadHiddenMatches(currentTeam: Team | null, setHiddenMatchIds: (ids: string[]) => void) {
  useEffect(() => {
    if (currentTeam) {
      const key = `hiddenMatches-${currentTeam.id}`;
      const stored = typeof window !== "undefined" ? localStorage.getItem(key) : null;
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
  }, [currentTeam, setHiddenMatchIds]);
}

// Custom hook for fetching matches from API when team changes
function useFetchMatches(currentTeam: Team | null, hiddenMatchIds: string[], setAllMatches: (matches: Match[]) => void, setMatches: (matches: Match[]) => void) {
  useEffect(() => {
    logWithTimestamp('log', "[TEAM CONTEXT] ===== FETCHING MATCHES FROM API =====");
    logWithTimestamp('log', "[TEAM CONTEXT] Current team:", currentTeam);
    logWithTimestamp('log', "[TEAM CONTEXT] Current team ID:", currentTeam?.id);
    
    if (currentTeam) {
      // Check if we have matchIdsByLeague data first
      if (currentTeam.matchIdsByLeague && currentTeam.leagueId) {
        const matchIds = currentTeam.matchIdsByLeague[currentTeam.leagueId] || [];
        logWithTimestamp('log', "[TEAM CONTEXT] Using matchIdsByLeague data:", matchIds);
        
        if (matchIds.length > 0) {
          // Convert match IDs to match objects with required properties
          const matchObjects: Match[] = matchIds.map(id => ({ 
            id,
            date: '',
            opponent: '',
            result: '',
            score: '',
            league: currentTeam.leagueName || currentTeam.leagueId || ''
          }));
          logWithTimestamp('log', "[TEAM CONTEXT] Setting matches from matchIdsByLeague:", matchObjects);
          setAllMatches(matchObjects);
          setMatches(matchObjects.filter((m: Match) => !hiddenMatchIds.includes(m.id)));
          return;
        }
      }
      
      // Fallback to old matchIds property
      if (currentTeam.matchIds && currentTeam.matchIds.length > 0) {
        logWithTimestamp('log', "[TEAM CONTEXT] Using fallback matchIds data:", currentTeam.matchIds);
        
        // Convert match IDs to match objects with required properties
        const matchObjects: Match[] = currentTeam.matchIds.map(id => ({ 
          id,
          date: '',
          opponent: '',
          result: '',
          score: '',
          league: currentTeam.leagueName || currentTeam.leagueId || ''
        }));
        logWithTimestamp('log', "[TEAM CONTEXT] Setting matches from fallback matchIds:", matchObjects);
        setAllMatches(matchObjects);
        setMatches(matchObjects.filter((m: Match) => !hiddenMatchIds.includes(m.id)));
        return;
      }
      
      // Fallback to fetching by player account IDs if no matchIdsByLeague data
      logWithTimestamp('log', `[TEAM CONTEXT] No matchIdsByLeague data, falling back to player account IDs`);
      if (!currentTeam.players || currentTeam.players.length === 0) {
        setAllMatches([]);
        setMatches([]);
        return;
      }
      const accountIds = currentTeam.players.map((p) => p.id).filter(Boolean).join(',');
      if (!accountIds) {
        setAllMatches([]);
        setMatches([]);
        return;
      }
      const url = `/api/teams/${currentTeam.teamId}/match-history?accountIds=${encodeURIComponent(accountIds)}`;
      fetch(url)
        .then(async (res) => {
          logWithTimestamp('log', "[TEAM CONTEXT] API response status:", res.status);
          logWithTimestamp('log', "[TEAM CONTEXT] API response ok:", res.ok);
          let data;
          try {
            data = await res.json();
          } catch (jsonErr) {
            logWithTimestamp('error', "[TEAM CONTEXT] Error parsing JSON from matches API:", jsonErr);
            setAllMatches([]);
            setMatches([]);
            return;
          }
          logWithTimestamp('log', "[TEAM CONTEXT] API response data:", data);
          const apiMatches = data.matches || (Array.isArray(data.matchIds) ? data.matchIds.map((id: string) => ({ id })) : []);
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
  }, [currentTeam, hiddenMatchIds, setAllMatches, setMatches]);
}

// Standin player handlers
function useStandinPlayerHandlers(currentTeam: Team | null, setCurrentTeamState: (team: Team | null) => void) {
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
    setCurrentTeamState(updatedTeam);
  };

  const removeStandinPlayer = (playerId: string) => {
    if (!currentTeam) return;
    const updatedTeam = {
      ...currentTeam,
      players: currentTeam.players.filter((player) => player.id !== playerId),
    };
    setCurrentTeamState(updatedTeam);
  };

  return { addStandinPlayer, removeStandinPlayer };
}

// Match handlers
function useMatchHandlers(currentTeam: Team | null, matches: Match[], setMatches: (matches: Match[]) => void, allMatches: Match[], setAllMatches: (matches: Match[]) => void, hiddenMatchIds: string[], setHiddenMatchIds: (ids: string[]) => void) {
  const addMatch = async (match: Omit<Match, "id">) => {
    if (!currentTeam) return;
    const newMatch: Match = { ...match, id: Date.now().toString() };
    const updatedMatches = [...matches, newMatch];
    await fetch(`/api/teams/${currentTeam.teamId}/match-history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matches: updatedMatches }),
    });
    setMatches(updatedMatches);
  };

  const removeMatch = (matchId: string) => {
    if (!currentTeam) return;
    const key = `hiddenMatches-${currentTeam.id}`;
    const updatedHidden = [...hiddenMatchIds, matchId];
    setHiddenMatchIds(updatedHidden);
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(updatedHidden));
    }
  };

  const unhideMatch = (matchId: string) => {
    if (!currentTeam) return;
    const key = `hiddenMatches-${currentTeam.id}`;
    const updatedHidden = hiddenMatchIds.filter((id) => id !== matchId);
    setHiddenMatchIds(updatedHidden);
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(updatedHidden));
    }
  };

  return { addMatch, removeMatch, unhideMatch };
}

// Misc handlers
function useMiscTeamHandlers(currentTeam: Team | null, matches: Match[], setMatches: (matches: Match[]) => void, setRefreshingTeamId: (id: string | null) => void, setRefreshProgress: (progress: { completed: number; total: number } | null) => void, setSpinningButton: (button: "refresh" | "force" | null) => void) {
  const getTeamSlug = () => {
    if (!currentTeam) return "";
    return currentTeam.teamId || currentTeam.id;
  };

  const getExternalLinks = () => {
    if (!currentTeam) {
      return [
        {
          href: "https://www.dotabuff.com/esports/teams",
          label: "Teams on Dotabuff",
          icon: <Trophy className="w-5 h-5 text-red-500" />,
        },
        {
          href: "https://www.dotabuff.com/esports/leagues",
          label: "Leagues on Dotabuff",
          icon: <Award className="w-5 h-5 text-orange-500" />,
        },
      ];
    }
    const links = [];
    if (currentTeam.teamId) {
      links.push({
        href: `https://www.dotabuff.com/esports/teams/${currentTeam.teamId}`,
        label: "Team on Dotabuff",
        icon: <Trophy className="w-5 h-5 text-red-500" />,
      });
    } else if (currentTeam.dotabuffUrl) {
      links.push({
        href: currentTeam.dotabuffUrl,
        label: "Team on Dotabuff",
        icon: <Trophy className="w-5 h-5 text-red-500" />,
      });
    } else {
      const teamSlug = currentTeam.id;
      if (teamSlug) {
        links.push({
          href: `https://www.dotabuff.com/esports/teams/${teamSlug}`,
          label: "Team on Dotabuff",
          icon: <Trophy className="w-5 h-5 text-red-500" />,
        });
      }
    }
    if (currentTeam.leagueId) {
      links.push({
        href: `https://www.dotabuff.com/esports/leagues/${currentTeam.leagueId}`,
        label: "League on Dotabuff",
        icon: <Award className="w-5 h-5 text-orange-500" />,
      });
    } else if (currentTeam.leagueUrl) {
      links.push({
        href: currentTeam.leagueUrl,
        label: "League on Dotabuff",
        icon: <Award className="w-5 h-5 text-orange-500" />,
      });
    } else if (currentTeam.league) {
      if (currentTeam.league.startsWith("http")) {
        links.push({
          href: currentTeam.league,
          label: "League on Dotabuff",
          icon: <Award className="w-5 h-5 text-orange-500" />,
        });
      } else {
        const leagueSlug = currentTeam.league.toLowerCase().replace(/\s+/g, "-");
        links.push({
          href: `https://www.dotabuff.com/esports/leagues/${leagueSlug}`,
          label: "League on Dotabuff",
          icon: <Award className="w-5 h-5 text-orange-500" />,
        });
      }
    }
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

  const cancelRefresh = () => {
    setRefreshingTeamId(null);
    setRefreshProgress(null);
    setSpinningButton(null);
  };

  const clearMatches = () => {
    setMatches([]);
  };

  return { getTeamSlug, getExternalLinks, cancelRefresh, clearMatches };
}

function useRefreshMatchesHandler(currentTeam: Team | null, hiddenMatchIds: string[], setAllMatches: (matches: Match[]) => void, setMatches: (matches: Match[]) => void) {
  const refreshMatches = async () => {
    if (!currentTeam) return;
    if (!currentTeam.players || currentTeam.players.length === 0) {
      setAllMatches([]);
      setMatches([]);
      return;
    }
    const accountIds = currentTeam.players.map((p) => p.id).filter(Boolean).join(',');
    if (!accountIds) {
      setAllMatches([]);
      setMatches([]);
      return;
    }
    const url = `/api/teams/${currentTeam.teamId}/match-history?accountIds=${encodeURIComponent(accountIds)}`;
    const res = await fetch(url);
    const data = await res.json();
    const apiMatches = data.matches || [];
    setAllMatches(apiMatches);
    setMatches(apiMatches.filter((m: Match) => !hiddenMatchIds.includes(m.id)));
  };
  return refreshMatches;
}

function useSetRefreshingMatchesWrapper(setRefreshingMatches: (matches: Set<string> | ((prev: Set<string>) => Set<string>)) => void) {
  return (matches: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    setRefreshingMatches(matches);
  };
}

function getTeamContextValue(
  currentTeam: Team | null,
  matches: Match[],
  allMatches: Match[],
  setCurrentTeam: (team: Team | string | null) => Promise<void>,
  addStandinPlayer: (
    player: Omit<Player, "isStandin" | "addedDate">,
    standinForId?: string,
  ) => void,
  removeStandinPlayer: (playerId: string) => void,
  addMatch: (match: Omit<Match, "id">) => Promise<void>,
  removeMatch: (matchId: string) => void,
  unhideMatch: (matchId: string) => void,
  getTeamSlug: () => string,
  getExternalLinks: () => Array<{ href: string; label: string; icon: React.ReactNode }>,
  isLoaded: boolean,
  hiddenMatchIds: string[],
  setHiddenMatchIds: (ids: string[]) => void,
  refreshingTeamId: string | null,
  setRefreshingTeamId: (teamId: string | null) => void,
  refreshProgress: { completed: number; total: number } | null,
  setRefreshProgress: (progress: { completed: number; total: number } | null) => void,
  cancelRefresh: () => void,
  spinningButton: "refresh" | "force" | null,
  setSpinningButton: (button: "refresh" | "force" | null) => void,
  clearMatches: () => void,
  refreshMatches: () => Promise<void>,
  refreshingMatches: Set<string>,
  setRefreshingMatches: (matches: Set<string> | ((prev: Set<string>) => Set<string>)) => void,
  isForceRefreshing: boolean,
  setIsForceRefreshing: (isForceRefreshing: boolean) => void,
  children: ReactNode
) {
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
        setRefreshingMatches,
        isForceRefreshing,
        setIsForceRefreshing,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

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
  const [isForceRefreshing, setIsForceRefreshing] = useState(false);

  // Get match data context
  const { fetchTeamMatches } = useMatchData();

  useLoadTeamsFromLocalStorage(setCurrentTeamState, setIsLoaded);
  useLoadHiddenMatches(currentTeam, setHiddenMatchIds);
  useFetchMatches(currentTeam, hiddenMatchIds, setAllMatches, setMatches);

  const { addStandinPlayer, removeStandinPlayer } = useStandinPlayerHandlers(currentTeam, setCurrentTeamState);
  const { addMatch, removeMatch, unhideMatch } = useMatchHandlers(currentTeam, matches, setMatches, allMatches, setAllMatches, hiddenMatchIds, setHiddenMatchIds);
  const { getTeamSlug, getExternalLinks, cancelRefresh, clearMatches } = useMiscTeamHandlers(currentTeam, matches, setMatches, setRefreshingTeamId, setRefreshProgress, setSpinningButton);
  const refreshMatches = useRefreshMatchesHandler(currentTeam, hiddenMatchIds, setAllMatches, setMatches);
  const setRefreshingMatchesWrapper = useSetRefreshingMatchesWrapper(setRefreshingMatches);

  const setCurrentTeam: (team: Team | string | null) => Promise<void> = async (teamOrId) => {
    if (typeof teamOrId === "string") {
      // Load team by ID from localStorage
      const teamsData = localStorage.getItem("dota-dashboard-teams");
      if (teamsData) {
        const teams: Team[] = JSON.parse(teamsData);
        const foundTeam = teams.find(team => team.id === teamOrId);
        if (foundTeam) {
          setCurrentTeamState(foundTeam);
          localStorage.setItem("activeTeamId", foundTeam.id);
          
          // Trigger match data fetching for the new team
          if (foundTeam.matchIdsByLeague && foundTeam.leagueId) {
            const matchIds = foundTeam.matchIdsByLeague[foundTeam.leagueId] || [];
            if (matchIds.length > 0) {
              fetchTeamMatches(foundTeam.id, matchIds);
            }
          } else if (foundTeam.matchIds && foundTeam.matchIds.length > 0) {
            fetchTeamMatches(foundTeam.id, foundTeam.matchIds);
          }
        }
      }
    } else if (teamOrId) {
      // Direct team object
      setCurrentTeamState(teamOrId);
      localStorage.setItem("activeTeamId", teamOrId.id);
      
      // Trigger match data fetching for the new team
      if (teamOrId.matchIdsByLeague && teamOrId.leagueId) {
        const matchIds = teamOrId.matchIdsByLeague[teamOrId.leagueId] || [];
        if (matchIds.length > 0) {
          fetchTeamMatches(teamOrId.id, matchIds);
        }
      } else if (teamOrId.matchIds && teamOrId.matchIds.length > 0) {
        fetchTeamMatches(teamOrId.id, teamOrId.matchIds);
      }
    } else {
      // Clear current team
      setCurrentTeamState(null);
      localStorage.removeItem("activeTeamId");
    }
  };

  return getTeamContextValue(
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
    setRefreshingMatchesWrapper,
    isForceRefreshing,
    setIsForceRefreshing,
    children
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
}
