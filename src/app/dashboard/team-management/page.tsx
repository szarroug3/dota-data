"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useTeam } from "@/contexts/team-context";
import { fetchDotabuffTeamMatches, getQueueStatsFromAPI, importTeamFromDotabuff } from "@/lib/api";
import { cacheService } from "@/lib/cache-service";
import { logWithTimestamp } from '@/lib/utils';
import type { Match, Team } from "@/types/team";
import {
    FileText,
    Loader2,
    RefreshCw,
    Trash2,
    Zap
} from "lucide-react";
import { useEffect, useState } from "react";

export default function TeamManagementPage() {
  const { currentTeam, setCurrentTeam, refreshingTeamId, setRefreshingTeamId, refreshProgress, setRefreshProgress, cancelRefresh, spinningButton, setSpinningButton, clearMatches, isLoaded, removeStandinPlayer, refreshMatches, refreshingMatches, setRefreshingMatches, setHiddenMatchIds } = useTeam();
  const { toast } = useToast();

  // Default teams for initial state (empty - no teams by default)
  const defaultTeams: Team[] = [];

  // Always start with default teams to avoid hydration mismatch
  const [teams, setTeamsState] = useState<Team[]>(defaultTeams);
  const [isLoadedState, setIsLoadedState] = useState(false);
  const [hasReset, setHasReset] = useState(false);

  // Load from localStorage after component mounts (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined" && !hasReset) {
      const stored = localStorage.getItem("dota-dashboard-teams");
      if (stored) {
        try {
          const parsedTeams = JSON.parse(stored);
          setTeamsState(parsedTeams);
        } catch (e) {}
      }
      setIsLoadedState(true);
    } else if (hasReset) {
      setIsLoadedState(true);
    }
  }, [hasReset]);

  // Restore active team from localStorage after teams are loaded
  useEffect(() => {
    if (isLoaded && teams.length > 0 && !currentTeam) {
      const savedTeamId = localStorage.getItem("activeTeamId");
      if (savedTeamId) {
        const found = teams.find((t) => t.id === savedTeamId);
        if (found) {
          setCurrentTeam(found);
        }
      }
    }
  }, [isLoaded, teams, currentTeam, setCurrentTeam]);

  // Sync current team with teams list if there's a mismatch
  useEffect(() => {
    if (isLoaded && currentTeam && teams.length > 0) {
      const teamExists = teams.some((team) => team.id === currentTeam.id);
      if (!teamExists) {
        const updatedTeams = [...teams, currentTeam];
        setTeamsState(updatedTeams);
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "dota-dashboard-teams",
            JSON.stringify(updatedTeams),
          );
        }
      }
    }
  }, [isLoaded, currentTeam, teams]);

  // Wrapper function to update both state and localStorage
  const setTeams = (newTeams: Team[]) => {
    setTeamsState(newTeams);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("dota-dashboard-teams", JSON.stringify(newTeams));
      } catch (e) {}
    }
  };

  // Function to reset teams to default state
  const resetTeams = () => {
    // Set reset flag to prevent useEffect from loading localStorage
    setHasReset(true);

    // Clear all localStorage data
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("dota-dashboard-teams");
        localStorage.removeItem("dota-dashboard-current-team");
      } catch (e) {}
    }

    // Clear all teams completely
    setTeams([]);

    // Set current team to null (no team selected)
    setCurrentTeam(null);
  };

  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [dotabuffUrl, setDotabuffUrl] = useState("");
  const [leagueUrl, setLeagueUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [queueStats, setQueueStats] = useState<Record<string, { length: number; processing: boolean }>>({});
  const [detailedStats, setDetailedStats] = useState<any>(null);

  // Update queue stats periodically
  useEffect(() => {
    const updateStats = async () => {
      try {
        const stats = await getQueueStatsFromAPI();
        setQueueStats(stats.queueStats || {});
      } catch (error) {
        logWithTimestamp('error', '[TeamManagement] Error updating queue stats:', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const handleSwitchTeam = (team: Team) => {
    setCurrentTeam(team);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
  };

  const handleDeleteTeam = (teamId: string) => {
    const updatedTeams = teams.filter((team) => team.id !== teamId);

    setTeams(updatedTeams);

    // If the deleted team was the current team, update currentTeam
    if (currentTeam?.id === teamId) {
      // If there are remaining teams, switch to the first one
      // Otherwise, set currentTeam to null
      const newCurrentTeam = updatedTeams.length > 0 ? updatedTeams[0] : null;
      setCurrentTeam(newCurrentTeam);
    }
  };

  const handleSaveEdit = () => {
    if (editingTeam) {
      setTeams(
        teams.map((team) => (team.id === editingTeam.id ? editingTeam : team)),
      );
      if (currentTeam?.id === editingTeam.id) {
        setCurrentTeam(editingTeam);
      }
      setEditingTeam(null);
    }
  };

  // Only allow team creation via Dotabuff import
  const handleImportDotabuff = async () => {
    logWithTimestamp('log', "[Import] handleImportDotabuff called");
    setImportError(null);
    setImporting(true);
    logWithTimestamp('log', "[Import] Starting import for", dotabuffUrl, leagueUrl);
    try {
      if (!dotabuffUrl || !leagueUrl) {
        setImportError("Both Dotabuff team URL and league URL are required.");
        setImporting(false);
        return;
      }
      const imported = await importTeamFromDotabuff(dotabuffUrl);
      
      // Extract league name from URL using the improved function
      const leagueName = extractLeagueName(leagueUrl);
      
      const team = {
        ...imported,
        league: leagueName,
        leagueUrl: leagueUrl, // Store the league URL for quick links
        players: [],
        manualMatches: [],
      };
      // Add to teams array and save to localStorage
      const updatedTeams = [...teams, team];
      setTeams(updatedTeams);
      // Set as current team
      await setCurrentTeam(team);

      // Extract seasonId from leagueUrl
      const seasonIdMatch = leagueUrl.match(/leagues\/(\d+)/);
      const seasonId = seasonIdMatch ? seasonIdMatch[1] : null;
      if (!seasonId) {
        setImportError("Could not extract season ID from league URL.");
        setImporting(false);
        return;
      }
      // Fetch match IDs for this team and season
      const response = await fetchDotabuffTeamMatches(team.id, seasonId);
      const newMatchIds = response.matchIds || [];

      // Get existing match IDs to avoid duplicates
      const existingMatchIds = new Set(
        (team.manualMatches || []).map((match: Match) => match.id),
      );

      // Filter out matches we already have
      const newMatches = newMatchIds.filter(
        (matchId: string) => !existingMatchIds.has(matchId),
      );

      if (newMatches.length > 0) {
        // Enrich new matches with OpenDota data
        const newMatchObjects = await Promise.all(
          newMatches.map((matchId: string) =>
            enrichMatchViaApi(matchId, team),
          ),
        );
        // Add new matches to the team
        const updatedTeam = {
          ...team,
          manualMatches: [...(team.manualMatches || []), ...newMatchObjects],
        };

        // Update the team in the teams list
        const finalTeams = updatedTeams.map((t) =>
          t.id === team.id ? updatedTeam : t,
        );
        setTeams(finalTeams);
        // Update the current team if it's the same team
        await setCurrentTeam(updatedTeam);
        setDotabuffUrl("");
        setLeagueUrl("");
        logWithTimestamp('log', "[Import] Import successful:", team);
      }
    } catch (e: any) {
      logWithTimestamp('error', "[Import] Error:", e);
      setImportError(e.message || "Failed to import from Dotabuff");
    } finally {
      setImporting(false);
      logWithTimestamp('log', "[Import] Import finished");
    }
  };

  const handleRefreshTeam = async (team: Team) => {
    logWithTimestamp('log', "[Refresh] handleRefreshTeam called for team:", team);
    setRefreshingTeamId(team.id);
    setSpinningButton("refresh");
    logWithTimestamp('log', "[Refresh] Starting refresh for team:", team);
    try {
      logWithTimestamp('log', "🔄 [Refresh Debug] Starting refresh for team:", team.name);
      logWithTimestamp('log', "🔄 [Refresh Debug] Team has dotabuffUrl:", !!team.dotabuffUrl);
      logWithTimestamp('log', "🔄 [Refresh Debug] Team has leagueUrl:", !!team.leagueUrl);
      logWithTimestamp('log', "🔄 [Refresh Debug] Team has league field:", !!team.league);
      logWithTimestamp('log', "🔄 [Refresh Debug] Current manualMatches count:", team.manualMatches?.length || 0);

      // For amateur teams, we only fetch matches from Dotabuff (OpenDota doesn't have amateur team data)
      let updatedTeam = { ...team };

      // If team has a Dotabuff URL and league URL, fetch new matches
      if (team.dotabuffUrl && (team.leagueUrl || team.league)) {
        try {
          // Use leagueUrl if available, otherwise fall back to league field
          const leagueUrlToUse = team.leagueUrl || team.league;

          if (!leagueUrlToUse) {
            logWithTimestamp('log', "🔄 [Refresh Debug] No league URL available");
            return;
          }

          // Extract season ID from league URL
          const seasonMatch = leagueUrlToUse.match(/leagues\/(\d+)/);
          const seasonId = seasonMatch ? seasonMatch[1] : null;

          logWithTimestamp('log', "🔄 [Refresh Debug] Using league URL:", leagueUrlToUse);
          logWithTimestamp('log', "🔄 [Refresh Debug] Extracted seasonId:", seasonId);

          if (seasonId) {
            // Extract team ID from dotabuffUrl
            const teamIdMatch = team.dotabuffUrl.match(/teams\/(\d+)/);
            const teamId = teamIdMatch ? teamIdMatch[1] : null;

            if (!teamId) {
              logWithTimestamp('log', "🔄 [Refresh Debug] Could not extract team ID from dotabuffUrl");
              return;
            }

            // Fetch new match IDs from Dotabuff
            logWithTimestamp('log', "🔄 [Refresh Debug] Fetching matches from Dotabuff...");
            logWithTimestamp('log', "🔄 [Refresh Debug] Calling fetchDotabuffTeamMatches with teamId:", teamId, "seasonId:", seasonId);

            const response = await fetchDotabuffTeamMatches(teamId, seasonId);
            logWithTimestamp('log', "🔄 [Refresh Debug] Dotabuff response received:", response);

            const newMatchIds = response.matchIds || [];

            logWithTimestamp('log', "🔄 [Refresh Debug] Total match IDs from Dotabuff:", newMatchIds.length);
            logWithTimestamp('log', "🔄 [Refresh Debug] Match IDs:", newMatchIds);

            // Get existing match IDs to avoid duplicates
            const existingMatchIds = new Set(
              (team.manualMatches || []).map((match: Match) => match.id),
            );
            logWithTimestamp('log', "🔄 [Refresh Debug] Existing match IDs:", Array.from(existingMatchIds));

            // Filter out matches we already have
            const newMatches = newMatchIds.filter(
              (matchId: string) => !existingMatchIds.has(matchId),
            );
            logWithTimestamp('log', "🔄 [Refresh Debug] New matches (not in existing):", newMatches);

            if (newMatches.length > 0) {
              // Invalidate cache for new matches before enriching
              logWithTimestamp('log', "🔄 [Refresh Debug] Invalidating cache for new matches");
              await Promise.all(
                newMatches.map((matchId: string) =>
                  cacheService.invalidate("match", matchId)
                )
              );

              // Set all new matches as loading
              logWithTimestamp('log', "🔄 [Refresh Debug] Setting new matches as loading:", newMatches);
              const newLoadingSet = new Set(refreshingMatches);
              newMatches.forEach(matchId => newLoadingSet.add(matchId));
              setRefreshingMatches(newLoadingSet);
              logWithTimestamp('log', `🔄 [Refresh Debug] Updated refreshingMatches set, added ${newMatches.length} matches, total:`, Array.from(newLoadingSet));

              // Enrich new matches with OpenDota data, updating loading state as each finishes
              const newMatchObjects: Match[] = [];
              for (const matchId of newMatches) {
                try {
                  logWithTimestamp('log', `🔄 [Refresh Debug] Processing match ${matchId}`);
                  const enriched = await enrichMatchViaApi(matchId, team);
                  newMatchObjects.push(enriched);
                  logWithTimestamp('log', `🔄 [Refresh Debug] Match ${matchId} completed, removing from loading set`);
                } catch (error) {
                  logWithTimestamp('error', `🔄 [Refresh Debug] Error processing match ${matchId}:`, error);
                } finally {
                  setRefreshingMatches(prev => {
                    const next = new Set(prev);
                    next.delete(matchId);
                    logWithTimestamp('log', `🔄 [Refresh Debug] Updated refreshingMatches set, removed ${matchId}, remaining:`, Array.from(next));
                    return next;
                  });
                }
              }
              // Add new matches to the team
              updatedTeam = {
                ...updatedTeam,
                manualMatches: [
                  ...(team.manualMatches || []),
                  ...newMatchObjects,
                ],
              };

              logWithTimestamp('log', "🔄 [Refresh Debug] Updated team manualMatches count:", updatedTeam.manualMatches?.length);

              toast({
                title: "New Matches Found",
                description: `Found ${newMatches.length} new matches for ${team.name}`,
              });
            } else {
              logWithTimestamp('log', "🔄 [Refresh Debug] No new matches found");
              toast({
                title: "Team Up to Date",
                description: `${team.name} already has all available matches`,
              });
            }
          } else {
            logWithTimestamp('log', "🔄 [Refresh Debug] No seasonId found in leagueUrl");
          }
        } catch (matchError: any) {
          logWithTimestamp('error', "🔄 [Refresh Debug] Error fetching matches:", matchError);
          logWithTimestamp('error', "🔄 [Refresh Debug] Error details:", {
            message: matchError.message,
            stack: matchError.stack,
          });
          toast({
            title: "Error",
            description: "Failed to fetch new matches from Dotabuff",
            variant: "destructive",
          });
        }
      } else {
        logWithTimestamp('log', "🔄 [Refresh Debug] Missing dotabuffUrl or leagueUrl/league");
        logWithTimestamp('log', "🔄 [Refresh Debug] dotabuffUrl:", team.dotabuffUrl);
        logWithTimestamp('log', "🔄 [Refresh Debug] leagueUrl:", team.leagueUrl);
        logWithTimestamp('log', "🔄 [Refresh Debug] league:", team.league);
      }

      logWithTimestamp('log', "🔄 [Refresh Debug] Final updatedTeam manualMatches count:", updatedTeam.manualMatches?.length);

      setTeams(teams.map((t) => (t.id === team.id ? updatedTeam : t)));
      if (currentTeam?.id === team.id) {
        setCurrentTeam(updatedTeam);
      }

      toast({
        title: "Team Refreshed",
        description: `Successfully refreshed ${team.name}`,
      });
      logWithTimestamp('log', "[Refresh] Refresh successful:", team);
    } catch (error: any) {
      logWithTimestamp('error', "[Refresh] Error:", error);
      toast({
        title: "Error",
        description: "Failed to refresh team data",
        variant: "destructive",
      });
    } finally {
      setRefreshingTeamId(null);
      setSpinningButton(null);
      setRefreshingMatches(new Set());
      logWithTimestamp('log', "[Refresh] Refresh finished");
    }
  };

  const handleForceRefreshTeam = async (team: Team) => {
    logWithTimestamp('log', "[FORCE REFRESH] ===== STARTING FORCE REFRESH PROCESS =====");
    logWithTimestamp('log', "[FORCE REFRESH] Button clicked for team:", team.name, "ID:", team.id);
    logWithTimestamp('log', "[FORCE REFRESH] Team data:", {
      dotabuffUrl: team.dotabuffUrl,
      leagueUrl: team.leagueUrl,
      league: team.league,
      currentMatchesCount: team.manualMatches?.length || 0
    });
    
    setSpinningButton("force");
    setRefreshingTeamId(team.id);
    logWithTimestamp('log', "[FORCE REFRESH] Set spinning button and refreshing team ID");
    
    try {
      // Immediately clear all team data to show it's being refreshed
      logWithTimestamp('log', "[FORCE REFRESH] Clearing team data immediately");
      const clearedTeam = {
        ...team,
        manualMatches: [],
        players: [],
        // Keep basic team info but clear all data
      };
      
      // Update the team immediately with cleared data
      logWithTimestamp('log', "[FORCE REFRESH] Updating team state with cleared data");
      setTeams(teams.map((t) => (t.id === team.id ? clearedTeam : t)));
      if (currentTeam?.id === team.id) {
        logWithTimestamp('log', "[FORCE REFRESH] Updating current team with cleared data");
        setCurrentTeam(clearedTeam);
      }
      
      // Force clear matches state in the context
      logWithTimestamp('log', "[FORCE REFRESH] Clearing matches state in context");
      clearMatches();

      // Reset hidden matches for this team
      logWithTimestamp('log', "[FORCE REFRESH] Resetting hidden matches for team");
      setHiddenMatchIds([]);
      if (typeof window !== "undefined") {
        localStorage.removeItem(`hiddenMatches-${team.id}`);
      }
      
      logWithTimestamp('log', "[FORCE REFRESH] Team data cleared, starting fresh fetch");

      // For amateur teams, we only fetch matches from Dotabuff (OpenDota doesn't have amateur team data)
      let updatedTeam = { ...team };

      // If team has a Dotabuff URL and league URL, fetch ALL matches from scratch
      if (team.dotabuffUrl && (team.leagueUrl || team.league)) {
        logWithTimestamp('log', "[FORCE REFRESH] Team has required URLs, proceeding with fetch");
        try {
          // Use leagueUrl if available, otherwise fall back to league field
          const leagueUrlToUse = team.leagueUrl || team.league;

          if (!leagueUrlToUse) {
            logWithTimestamp('log', "[FORCE REFRESH] ERROR: No league URL available");
            toast({
              title: "Error",
              description: "No league URL available for force refresh",
              variant: "destructive",
            });
            return;
          }

          // Extract season ID from league URL
          logWithTimestamp('log', "[FORCE REFRESH] Extracting season ID from league URL:", leagueUrlToUse);
          const seasonMatch = leagueUrlToUse.match(/leagues\/(\d+)/);
          const seasonId = seasonMatch ? seasonMatch[1] : null;
          logWithTimestamp('log', "[FORCE REFRESH] Extracted seasonId:", seasonId);

          if (seasonId) {
            // Extract team ID from dotabuffUrl
            logWithTimestamp('log', "[FORCE REFRESH] Extracting team ID from dotabuffUrl:", team.dotabuffUrl);
            const teamIdMatch = team.dotabuffUrl.match(/teams\/(\d+)/);
            const teamId = teamIdMatch ? teamIdMatch[1] : null;
            logWithTimestamp('log', "[FORCE REFRESH] Extracted teamId:", teamId);

            if (!teamId) {
              logWithTimestamp('log', "[FORCE REFRESH] ERROR: Could not extract team ID from dotabuffUrl");
              toast({
                title: "Error",
                description: "Could not extract team ID from Dotabuff URL",
                variant: "destructive",
              });
              return;
            }

            // Invalidate dotabuff-matches cache before fetching fresh data
            const dotabuffCacheKey = `${teamId}-${seasonId}`;
            logWithTimestamp('log', "[FORCE REFRESH] Invalidating dotabuff-matches cache with key:", dotabuffCacheKey);
            await cacheService.invalidate("dotabuff-matches", dotabuffCacheKey);

            // Fetch ALL match IDs from Dotabuff (force refresh from scratch)
            logWithTimestamp('log', "[FORCE REFRESH] Calling fetchDotabuffTeamMatches with teamId:", teamId, "seasonId:", seasonId);
            const response = await fetchDotabuffTeamMatches(teamId, seasonId);
            logWithTimestamp('log', "[FORCE REFRESH] fetchDotabuffTeamMatches response:", response);
            
            const allMatchIds = response.matchIds || [];
            logWithTimestamp('log', "[FORCE REFRESH] Total match IDs received:", allMatchIds.length);
            logWithTimestamp('log', "[FORCE REFRESH] Match IDs:", allMatchIds);

            if (allMatchIds.length > 0) {
              logWithTimestamp('log', "[FORCE REFRESH] Found matches, proceeding with enrichment");
              
              // Invalidate cache for all matches before force refreshing
              logWithTimestamp('log', "[FORCE REFRESH] Invalidating cache for all matches");
              await Promise.all(
                allMatchIds.map((matchId: string) =>
                  cacheService.invalidate("match", matchId)
                )
              );

              // Set all matches as loading
              logWithTimestamp('log', "[FORCE REFRESH] Setting all matches as loading:", allMatchIds);
              const allLoadingSet = new Set(refreshingMatches);
              allMatchIds.forEach(matchId => allLoadingSet.add(matchId));
              setRefreshingMatches(allLoadingSet);
              logWithTimestamp('log', `🔄 [Refresh Debug] Updated refreshingMatches set, added ${allMatchIds.length} matches, total:`, Array.from(allLoadingSet));

              // Process matches individually to track loading state per match
              logWithTimestamp('log', "[FORCE REFRESH] Processing matches individually for loading state tracking");
              const allMatchObjects: Match[] = [];
              
              for (const matchId of allMatchIds) {
                try {
                  logWithTimestamp('log', `[FORCE REFRESH] Processing match ${matchId}`);
                  const enriched = await enrichMatchViaApi(matchId, team);
                  allMatchObjects.push(enriched);
                  logWithTimestamp('log', `[FORCE REFRESH] Match ${matchId} completed, removing from loading set`);
                } catch (error) {
                  logWithTimestamp('error', `[FORCE REFRESH] Error processing match ${matchId}:`, error);
                } finally {
                  // Remove this match from loading set as it's done (success or error)
                  setRefreshingMatches(prev => {
                    const next = new Set(prev);
                    next.delete(matchId);
                    logWithTimestamp('log', `🔄 [Refresh Debug] Updated refreshingMatches set, removed ${matchId}, remaining:`, Array.from(next));
                    return next;
                  });
                }
              }

              logWithTimestamp('log', "[FORCE REFRESH] All matches processed, count:", allMatchObjects.length);

              // Replace ALL matches (force refresh from scratch)
              updatedTeam = {
                ...updatedTeam,
                manualMatches: allMatchObjects,
              };
              logWithTimestamp('log', "[FORCE REFRESH] Updated team with new matches, count:", updatedTeam.manualMatches?.length);

              // Save matches to Redis API so they appear in match history
              logWithTimestamp('log', "[FORCE REFRESH] Saving matches to Redis API...");
              const saveResponse = await fetch(`/api/teams/${team.id}/match-history`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matches: allMatchObjects }),
              });
              
              logWithTimestamp('log', "[FORCE REFRESH] Save to Redis API response status:", saveResponse.status);
              logWithTimestamp('log', "[FORCE REFRESH] Save to Redis API response ok:", saveResponse.ok);
              
              if (!saveResponse.ok) {
                const errorText = await saveResponse.text();
                logWithTimestamp('error', "[FORCE REFRESH] Failed to save matches to Redis API:", errorText);
                // Don't throw error here, just log it - the matches are still updated in the team object
              } else {
                logWithTimestamp('log', "[FORCE REFRESH] Successfully saved matches to Redis API");
              }

              // Add a small delay to ensure Redis API has processed the data
              logWithTimestamp('log', "[FORCE REFRESH] Waiting 1 second for Redis API to process data...");
              await new Promise(resolve => setTimeout(resolve, 1000));

              // Refresh matches from API to update the context
              logWithTimestamp('log', "[FORCE REFRESH] Refreshing matches from API to update context...");
              await refreshMatches();
              logWithTimestamp('log', "[FORCE REFRESH] Matches refreshed from API");

              toast({
                title: "Force Refresh Complete",
                description: `Refreshed ${allMatchIds.length} matches for ${team.name}`,
              });
            } else {
              logWithTimestamp('log', "[FORCE REFRESH] No matches found, keeping team cleared");
              // No matches found, keep team cleared
              updatedTeam = {
                ...updatedTeam,
                manualMatches: [],
              };

              toast({
                title: "Force Refresh Complete",
                description: `No matches found for ${team.name}`,
              });
            }
          } else {
            logWithTimestamp('log', "[FORCE REFRESH] ERROR: No seasonId found in leagueUrl");
            toast({
              title: "Error",
              description: "Could not extract season ID from league URL",
              variant: "destructive",
            });
          }
        } catch (matchError: any) {
          logWithTimestamp('error', "[FORCE REFRESH] Error during match fetching/enrichment:", matchError);
          logWithTimestamp('error', "[FORCE REFRESH] Error details:", {
            message: matchError.message,
            stack: matchError.stack,
            name: matchError.name
          });
          toast({
            title: "Warning",
            description: "Failed to fetch matches from Dotabuff",
            variant: "destructive",
          });
        }
      } else {
        logWithTimestamp('log', "[FORCE REFRESH] Team missing required URLs:");
        logWithTimestamp('log', "[FORCE REFRESH] dotabuffUrl:", team.dotabuffUrl);
        logWithTimestamp('log', "[FORCE REFRESH] leagueUrl:", team.leagueUrl);
        logWithTimestamp('log', "[FORCE REFRESH] league:", team.league);
        toast({
          title: "Error",
          description: "Team missing Dotabuff URL or league URL",
          variant: "destructive",
        });
      }

      logWithTimestamp('log', "[FORCE REFRESH] Final team update - matches count:", updatedTeam.manualMatches?.length);
      setTeams(teams.map((t) => (t.id === team.id ? updatedTeam : t)));
      if (currentTeam?.id === team.id) {
        logWithTimestamp('log', "[FORCE REFRESH] Updating current team with final data");
        setCurrentTeam(updatedTeam);
      }

      toast({
        title: "Team Force Refreshed",
        description: `Successfully force refreshed ${team.name}`,
      });
      logWithTimestamp('log', "[FORCE REFRESH] ===== FORCE REFRESH COMPLETED SUCCESSFULLY =====");
    } catch (error: any) {
      logWithTimestamp('error', "[FORCE REFRESH] ===== FORCE REFRESH FAILED =====");
      logWithTimestamp('error', "[FORCE REFRESH] Error:", error);
      logWithTimestamp('error', "[FORCE REFRESH] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast({
        title: "Error",
        description: "Failed to force refresh team data",
        variant: "destructive",
      });
    } finally {
      logWithTimestamp('log', "[FORCE REFRESH] Cleaning up state");
      setRefreshingTeamId(null);
      setSpinningButton(null);
      setRefreshingMatches(new Set());
      logWithTimestamp('log', "[FORCE REFRESH] ===== FORCE REFRESH PROCESS ENDED =====");
    }
  };

  // Function to extract league name from URL
  const extractLeagueName = (url: string): string => {
    if (!url) return "Unknown League";
    
    // Handle full URLs
    const fullUrlMatch = url.match(/leagues\/\d+-(.+)/);
    if (fullUrlMatch) {
      return fullUrlMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    // Handle just the league slug
    const slugMatch = url.match(/^(\d+)-(.+)$/);
    if (slugMatch) {
      return slugMatch[2].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    // If it's already a readable name, return as is
    if (!url.includes('http') && !url.includes('/')) {
      return url;
    }
    
    return "Unknown League";
  };

  // Function to fix existing teams with URL in league field
  const fixExistingTeams = () => {
    const updatedTeams = teams.map(team => {
      let updatedTeam = team;
      
      // Fix league names if they contain URLs
      if (team.league && team.league.includes('http')) {
        const leagueName = extractLeagueName(team.league);
        updatedTeam = {
          ...updatedTeam,
          league: leagueName,
          leagueUrl: team.league // Store the original URL
        };
      }
      
      // Fix team names that have "Matches" appended
      if (team.name && team.name.endsWith('Matches')) {
        updatedTeam = {
          ...updatedTeam,
          name: team.name.slice(0, -7) // Remove "Matches" (7 characters)
        };
      }
      
      return updatedTeam;
    });
    setTeams(updatedTeams);
    
    // Also fix current team if it has the same issue
    if (currentTeam) {
      let updatedCurrentTeam = currentTeam;
      let needsUpdate = false;
      
      if (currentTeam.league && currentTeam.league.includes('http')) {
        const leagueName = extractLeagueName(currentTeam.league);
        updatedCurrentTeam = {
          ...updatedCurrentTeam,
          league: leagueName,
          leagueUrl: currentTeam.league
        };
        needsUpdate = true;
      }
      
      if (currentTeam.name && currentTeam.name.endsWith('Matches')) {
        updatedCurrentTeam = {
          ...updatedCurrentTeam,
          name: currentTeam.name.slice(0, -7)
        };
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        setCurrentTeam(updatedCurrentTeam);
      }
    }
  };

  // Fix existing teams on component mount
  useEffect(() => {
    if (isLoaded && teams.length > 0) {
      fixExistingTeams();
    }
  }, [isLoaded, teams.length]);

  // Replace enrichMatchWithOpenDota(matchId, team) with API call
  const enrichMatchViaApi = async (matchId: string, team: any) => {
    const response = await fetch('/api/refresh-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, team }),
    });
    if (!response.ok) throw new Error('Failed to enrich match');
    return response.json();
  };

  // Show loading state while team context is initializing
  if (!isLoaded) {
    return null; // Let Next.js Suspense handle the loading UI
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Team Management</h1>
      </div>

      {/* Queue Status Display */}
      {Object.values(queueStats).some(stats => stats.length > 0 || stats.processing) && (
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Request Queue Status</h3>
          </div>
          <div className="flex gap-4 text-xs">
            {Object.entries(queueStats).map(([service, stats]) => (
              <div key={service} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${stats.processing ? 'bg-green-500' : stats.length > 0 ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                <span className="font-medium capitalize">{service}:</span>
                <span>{stats.length} queued</span>
                {stats.processing && <span className="text-green-600">• processing</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {importError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          <div className="font-medium">Import Error</div>
          <div className="text-sm">{importError}</div>
        </div>
      )}

      {/* Show loading state during hydration */}
      {!isLoadedState && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Loading team data...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Management */}
      {isLoadedState && (
        <Card>
          <CardHeader>
            <CardDescription>
              Manage your amateur league teams and switch between them for
              analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Team Display */}
            {currentTeam && (
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">Current Team</h3>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Team</p>
                    {currentTeam.dotabuffUrl ? (
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium text-left"
                        onClick={() => window.open(currentTeam.dotabuffUrl, '_blank')}
                      >
                        {currentTeam.name}
                      </Button>
                    ) : (
                      <p className="font-medium">{currentTeam.name}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">League</p>
                    {currentTeam.leagueUrl ? (
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium text-left"
                        onClick={() => window.open(currentTeam.leagueUrl, '_blank')}
                      >
                        {currentTeam.league}
                      </Button>
                    ) : (
                      <p className="font-medium">{currentTeam.league}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Team List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">All Teams</h3>
              </div>
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-lg gap-2"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{team.name}</h4>
                      {currentTeam?.id === team.id && (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {team.league && (
                        <span>{team.league}</span>
                      )}
                      {team.record && <span>{team.record} W/L</span>}
                      {team.winRate && <span>{team.winRate} win rate</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentTeam?.id !== team.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSwitchTeam(team)}
                      >
                        Switch
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRefreshTeam(team)}
                      disabled={refreshingTeamId === team.id}
                      title={
                        !team.dotabuffUrl
                          ? "No Dotabuff URL available for refresh"
                          : "Refresh team data and matches"
                      }
                    >
                      {refreshingTeamId === team.id &&
                      spinningButton === "refresh" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleForceRefreshTeam(team)}
                      disabled={refreshingTeamId === team.id}
                      title={
                        !team.dotabuffUrl
                          ? "No Dotabuff URL available for force refresh"
                          : "Force refresh all team data and matches"
                      }
                    >
                      {refreshingTeamId === team.id &&
                      spinningButton === "force" ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTeam(team.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* All Players Section */}
            <Card>
              <CardHeader>
                <CardTitle>All Players</CardTitle>
                <CardDescription>
                  All players associated with your team, including standins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentTeam?.players && currentTeam.players.length > 0 ? (
                    currentTeam.players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{player.name}</span>
                              {player.isStandin && (
                                <Badge variant="secondary" className="text-xs">
                                  Standin
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {player.role} • {player.mmr ? `${player.mmr} MMR` : 'No MMR'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {player.isStandin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeStandinPlayer(player.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      No players added yet. Add players in the Player Stats page.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dotabuff Import Section */}
            <Card>
              <CardHeader>
                <CardTitle>Import Team from Dotabuff</CardTitle>
                <CardDescription>
                  Import a team and all their matches from Dotabuff
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="dotabuff-url">Dotabuff Team URL</Label>
                  <Input
                    id="dotabuff-url"
                    placeholder="Dotabuff team URL (e.g. https://www.dotabuff.com/esports/teams/9517508-maple-syrup)"
                    value={dotabuffUrl}
                    onChange={(e) => setDotabuffUrl(e.target.value)}
                    disabled={importing}
                  />
                </div>
                <div>
                  <Label htmlFor="league-url">League Page URL</Label>
                  <Input
                    id="league-url"
                    placeholder="Dotabuff league page URL (e.g. https://www.dotabuff.com/esports/leagues/16435-rd2l-season-33)"
                    value={leagueUrl}
                    onChange={(e) => setLeagueUrl(e.target.value)}
                    disabled={importing}
                  />
                </div>
                <Button onClick={handleImportDotabuff} disabled={importing} size="sm">
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Add Team
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
