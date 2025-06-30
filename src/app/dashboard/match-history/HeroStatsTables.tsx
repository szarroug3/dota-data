import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { getHeroImageUrl, logWithTimestamp } from "@/lib/utils";
import { Info, Search, Target } from "lucide-react";
import { useEffect, useState } from "react";

export default function HeroStatsTables({
  heroStats,
  currentTeam,
  getHighlightStyle,
  error,
}: any) {
  // Independent sorting state for each section
  const [ourPicksSortBy, setOurPicksSortBy] = useState("default");
  const [ourPicksSortOrder, setOurPicksSortOrder] = useState("desc");
  const [ourBansSortBy, setOurBansSortBy] = useState("default");
  const [ourBansSortOrder, setOurBansSortOrder] = useState("desc");
  const [opponentPicksSortBy, setOpponentPicksSortBy] = useState("default");
  const [opponentPicksSortOrder, setOpponentPicksSortOrder] = useState("desc");
  const [opponentBansSortBy, setOpponentBansSortBy] = useState("default");
  const [opponentBansSortOrder, setOpponentBansSortOrder] = useState("desc");

  // Filter state - managed internally
  const [heroFilter, setHeroFilter] = useState("");
  const [countFilter, setCountFilter] = useState("");
  const [winsFilter, setWinsFilter] = useState("");
  const [winRateFilter, setWinRateFilter] = useState("");
  const [isLoadingFromStorage, setIsLoadingFromStorage] = useState(true);

  // Load filters from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("heroStatsFilters");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.heroFilter !== undefined) setHeroFilter(parsed.heroFilter);
          if (parsed.countFilter !== undefined)
            setCountFilter(parsed.countFilter);
          if (parsed.winsFilter !== undefined) setWinsFilter(parsed.winsFilter);
          if (parsed.winRateFilter !== undefined)
            setWinRateFilter(parsed.winRateFilter);
          // Load sorting state
          if (parsed.ourPicksSortBy !== undefined)
            setOurPicksSortBy(parsed.ourPicksSortBy);
          if (parsed.ourPicksSortOrder !== undefined)
            setOurPicksSortOrder(parsed.ourPicksSortOrder);
          if (parsed.ourBansSortBy !== undefined)
            setOurBansSortBy(parsed.ourBansSortBy);
          if (parsed.ourBansSortOrder !== undefined)
            setOurBansSortOrder(parsed.ourBansSortOrder);
          if (parsed.opponentPicksSortBy !== undefined)
            setOpponentPicksSortBy(parsed.opponentPicksSortBy);
          if (parsed.opponentPicksSortOrder !== undefined)
            setOpponentPicksSortOrder(parsed.opponentPicksSortOrder);
          if (parsed.opponentBansSortBy !== undefined)
            setOpponentBansSortBy(parsed.opponentBansSortBy);
          if (parsed.opponentBansSortOrder !== undefined)
            setOpponentBansSortOrder(parsed.opponentBansSortOrder);
        } catch (e) {
          logWithTimestamp('log', "🔍 [HeroStatsTables] Error parsing localStorage:", e);
        }
      }
      setIsLoadingFromStorage(false);
    }
  }, []);

  // Save filters and sorting to localStorage whenever they change (but not during initial load)
  useEffect(() => {
    if (!isLoadingFromStorage) {
      const filterState = {
        heroFilter,
        countFilter,
        winsFilter,
        winRateFilter,
        // Save sorting state
        ourPicksSortBy,
        ourPicksSortOrder,
        ourBansSortBy,
        ourBansSortOrder,
        opponentPicksSortBy,
        opponentPicksSortOrder,
        opponentBansSortBy,
        opponentBansSortOrder,
      };
      localStorage.setItem("heroStatsFilters", JSON.stringify(filterState));
    }
  }, [
    isLoadingFromStorage,
    heroFilter,
    countFilter,
    winsFilter,
    winRateFilter,
    ourPicksSortBy,
    ourPicksSortOrder,
    ourBansSortBy,
    ourBansSortOrder,
    opponentPicksSortBy,
    opponentPicksSortOrder,
    opponentBansSortBy,
    opponentBansSortOrder,
  ]);

  function clearFilters() {
    setHeroFilter("");
    setCountFilter("");
    setWinsFilter("");
    setWinRateFilter("");
    // Reset sorting to defaults
    setOurPicksSortBy("default");
    setOurPicksSortOrder("desc");
    setOurBansSortBy("default");
    setOurBansSortOrder("desc");
    setOpponentPicksSortBy("default");
    setOpponentPicksSortOrder("desc");
    setOpponentBansSortBy("default");
    setOpponentBansSortOrder("desc");
  }

  // Sorting helpers
  function sortRows(rows: [string, any][], sortBy: string, sortOrder: string) {
    return rows.slice().sort(([heroA, a], [heroB, b]) => {
      if (sortBy !== "default") {
        let valA, valB;
        if (sortBy === "name") {
          valA = heroA.toLowerCase();
          valB = heroB.toLowerCase();
        } else {
          valA = a[sortBy];
          valB = b[sortBy];
          if (typeof valA === "string") valA = valA.toLowerCase();
          if (typeof valB === "string") valB = valB.toLowerCase();
        }
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }
      // Default: win rate desc, picks/games desc, wins desc, name asc
      if (a.winRate !== b.winRate) return b.winRate - a.winRate;
      if (a.count !== b.count) return b.count - a.count;
      if (a.wins !== b.wins) return b.wins - a.wins;
      return heroA.toLowerCase().localeCompare(heroB.toLowerCase());
    });
  }

  // Helper to parse filter string (e.g., '>5', '=3', '<10')
  function parseNumberFilter(filter: string) {
    if (!filter) return null;
    const match = filter.match(/([><=]=?|)(\d+)/);
    if (!match) return null;
    const op = match[1] || "=";
    const num = parseInt(match[2], 10);
    return { op, num };
  }

  // Helper to apply all filters to a hero stats row
  function filterHeroRows(rows: [string, any][]) {
    return rows.filter(([hero, stats]) => {
      if (heroFilter && !hero.toLowerCase().includes(heroFilter.toLowerCase()))
        return false;
      if (countFilter) {
        const f = parseNumberFilter(countFilter);
        if (f) {
          if (f.op === ">" && !(stats.count > f.num)) return false;
          if (f.op === ">=" && !(stats.count >= f.num)) return false;
          if (f.op === "<" && !(stats.count < f.num)) return false;
          if (f.op === "<=" && !(stats.count <= f.num)) return false;
          if ((f.op === "=" || f.op === "") && !(stats.count === f.num))
            return false;
        }
      }
      if (winsFilter) {
        const f = parseNumberFilter(winsFilter);
        if (f) {
          if (f.op === ">" && !(stats.wins > f.num)) return false;
          if (f.op === ">=" && !(stats.wins >= f.num)) return false;
          if (f.op === "<" && !(stats.wins < f.num)) return false;
          if (f.op === "<=" && !(stats.wins <= f.num)) return false;
          if ((f.op === "=" || f.op === "") && !(stats.wins === f.num))
            return false;
        }
      }
      if (winRateFilter) {
        const f = parseNumberFilter(winRateFilter);
        if (f) {
          if (f.op === ">" && !(stats.winRate > f.num)) return false;
          if (f.op === ">=" && !(stats.winRate >= f.num)) return false;
          if (f.op === "<" && !(stats.winRate < f.num)) return false;
          if (f.op === "<=" && !(stats.winRate <= f.num)) return false;
          if ((f.op === "=" || f.op === "") && !(stats.winRate === f.num))
            return false;
        }
      }
      return true;
    });
  }

  // Prepare hero stats rows for each table
  const ourPicksRows = Object.entries(heroStats.ourPicks).map(
    ([hero, stats]: [string, any]) => [
      hero,
      {
        ...stats,
        count: stats.games,
        wins: stats.wins,
        winRate: stats.winRate,
      },
    ],
  ) as [string, any][];
  const ourBansRows = Object.entries(heroStats.ourBans).map(
    ([hero, stats]: [string, any]) => [
      hero,
      { ...stats, count: stats.bans, wins: 0, winRate: stats.banRate },
    ],
  ) as [string, any][];
  const opponentPicksRows = Object.entries(heroStats.opponentPicks).map(
    ([hero, stats]: [string, any]) => [
      hero,
      {
        ...stats,
        count: stats.games,
        wins: stats.wins,
        winRate: stats.winRate,
      },
    ],
  ) as [string, any][];
  const opponentBansRows = Object.entries(heroStats.opponentBans).map(
    ([hero, stats]: [string, any]) => [
      hero,
      { ...stats, count: stats.bans, wins: 0, winRate: stats.banRate },
    ],
  ) as [string, any][];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Hero Statistics
          <div className="relative ml-1 group/infotip">
            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 group-hover/infotip:opacity-100 transition-opacity whitespace-nowrap z-10 min-w-max pointer-events-none">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-yellow-50 dark:bg-yellow-950/20 border-l-2 border-l-yellow-500"></div>
                <span className="font-medium">Highlighted Heroes:</span>
              </div>
              <ul className="text-xs space-y-1">
                <li>• 8+ games with 70%+ win rate</li>
                <li>• 5+ games with 80%+ win rate</li>
              </ul>
            </div>
          </div>
        </CardTitle>
        <CardDescription>
          Pick and ban statistics across all matches
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-red-500 text-sm font-semibold p-4">{error}</p>
        ) : (
          <>
            {/* Filter and Sort Controls */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Filter heroes..."
                      value={heroFilter}
                      onChange={(e) => setHeroFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Number Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Count Filter
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., >5, =3, <10"
                    value={countFilter}
                    onChange={(e) => setCountFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Wins Filter
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., >2, =1, <5"
                    value={winsFilter}
                    onChange={(e) => setWinsFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Win Rate Filter
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., >80, =50, <30"
                    value={winRateFilter}
                    onChange={(e) => setWinRateFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                  />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Our Team (renamed to team name) Statistics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {currentTeam?.name
                    ? currentTeam.name.length > 20
                      ? currentTeam.name.slice(0, 20) + "..."
                      : currentTeam.name
                    : "Our Team"}
                </h3>

                {/* Our Picks */}
                <div>
                  <h4 className="font-medium mb-2">Most Picked</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 w-1/4">
                            <button
                              onClick={() => {
                                const newSortBy = "name";
                                const newSortOrder =
                                  ourPicksSortBy === "name" &&
                                  ourPicksSortOrder === "desc"
                                    ? "asc"
                                    : "desc";
                                setOurPicksSortBy(newSortBy);
                                setOurPicksSortOrder(newSortOrder);
                              }}
                              className="flex items-center gap-1 hover:bg-muted/50 px-1 py-1 rounded w-full"
                            >
                              Hero
                              {ourPicksSortBy === "name" &&
                                (ourPicksSortOrder === "desc" ? "↓" : "↑")}
                            </button>
                          </th>
                          <th className="text-left p-2 w-1/6">
                            <button
                              onClick={() => {
                                setOurPicksSortBy("count");
                                setOurPicksSortOrder(
                                  ourPicksSortBy === "count" &&
                                    ourPicksSortOrder === "desc"
                                    ? "asc"
                                    : "desc",
                                );
                              }}
                              className="flex items-center gap-1 hover:bg-muted/50 px-1 py-1 rounded w-full"
                            >
                              Picks
                              {ourPicksSortBy === "count" &&
                                (ourPicksSortOrder === "desc" ? "↓" : "↑")}
                            </button>
                          </th>
                          <th className="text-left p-2 w-1/6">
                            <button
                              onClick={() => {
                                setOurPicksSortBy("wins");
                                setOurPicksSortOrder(
                                  ourPicksSortBy === "wins" &&
                                    ourPicksSortOrder === "desc"
                                    ? "asc"
                                    : "desc",
                                );
                              }}
                              className="flex items-center gap-1 hover:bg-muted/50 px-1 py-1 rounded w-full"
                            >
                              Wins
                              {ourPicksSortBy === "wins" &&
                                (ourPicksSortOrder === "desc" ? "↓" : "↑")}
                            </button>
                          </th>
                          <th className="text-left p-2 w-1/4">
                            <button
                              onClick={() => {
                                setOurPicksSortBy("winRate");
                                setOurPicksSortOrder(
                                  ourPicksSortBy === "winRate" &&
                                    ourPicksSortOrder === "desc"
                                    ? "asc"
                                    : "desc",
                                );
                              }}
                              className="flex items-center gap-1 hover:bg-muted/50 px-1 py-1 rounded w-full"
                            >
                              Win Rate
                              {ourPicksSortBy === "winRate" &&
                                (ourPicksSortOrder === "desc" ? "↓" : "↑")}
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          return sortRows(
                            filterHeroRows(ourPicksRows),
                            ourPicksSortBy,
                            ourPicksSortOrder,
                          ).map(([hero, stats]: any) => (
                            <tr
                              key={hero}
                              className={`border-b hover:bg-muted/30 ${getHighlightStyle(hero, "pick")}`}
                            >
                              <td className="p-2 font-medium flex items-center gap-2">
                                <img
                                  src={getHeroImageUrl(hero)}
                                  alt={hero}
                                  className="w-6 h-6 rounded object-cover bg-gray-200 dark:bg-gray-700"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = "/window.svg";
                                  }}
                                />
                                {hero}
                              </td>
                              <td className="p-2">{stats.count}</td>
                              <td className="p-2">{stats.wins}</td>
                              <td className="p-2">
                                <Badge
                                  variant={
                                    stats.winRate >= 90
                                      ? "default"
                                      : stats.winRate >= 60
                                        ? "default"
                                        : stats.winRate >= 50
                                          ? "secondary"
                                          : "destructive"
                                  }
                                  className={`text-xs ${stats.winRate >= 90 ? "bg-green-600 hover:bg-green-700" : ""}`}
                                >
                                  {stats.winRate.toFixed(1)}%
                                </Badge>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Our Bans and Opponent Bans side by side */}
                <div className="flex flex-row gap-6 w-full">
                  {/* Our Bans */}
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">Most Banned</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 w-1/4">Hero</th>
                            <th className="text-left p-2 w-1/6">Bans</th>
                            <th className="text-left p-2 w-1/6">Wins</th>
                            <th className="text-left p-2 w-1/4">Win Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const rows = sortRows(
                              filterHeroRows(ourBansRows),
                              ourBansSortBy,
                              ourBansSortOrder,
                            );
                            const maxRows = Math.max(rows.length, opponentBansRows.length);
                            return Array.from({ length: maxRows }).map((_, i) => {
                              const row = rows[i];
                              if (!row) {
                                return (
                                  <tr key={i} className="border-b h-10">
                                    <td className="p-2" colSpan={4}></td>
                                  </tr>
                                );
                              }
                              const [hero, stats] = row;
                              return (
                                <tr key={hero} className="border-b hover:bg-muted/30">
                                  <td className="p-2 font-medium flex items-center gap-2">
                                    <img
                                      src={getHeroImageUrl(hero)}
                                      alt={hero}
                                      className="w-6 h-6 rounded object-cover bg-gray-200 dark:bg-gray-700"
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = "/window.svg";
                                      }}
                                    />
                                    {hero}
                                  </td>
                                  <td className="p-2">{stats.count}</td>
                                  <td className="p-2">{stats.wins}</td>
                                  <td className="p-2">
                                    <Badge
                                      variant={
                                        stats.winRate >= 90
                                          ? "default"
                                          : stats.winRate >= 60
                                            ? "default"
                                            : stats.winRate >= 50
                                              ? "secondary"
                                              : "destructive"
                                      }
                                      className={`text-xs ${stats.winRate >= 90 ? "bg-green-600 hover:bg-green-700" : ""}`}
                                    >
                                      {stats.winRate.toFixed(1)}%
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Opponent Bans */}
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">Most Banned</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 w-1/4">Hero</th>
                            <th className="text-left p-2 w-1/6">Bans</th>
                            <th className="text-left p-2 w-1/6">Wins</th>
                            <th className="text-left p-2 w-1/4">Win Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const rows = sortRows(
                              filterHeroRows(opponentBansRows),
                              opponentBansSortBy,
                              opponentBansSortOrder,
                            );
                            const maxRows = Math.max(rows.length, ourBansRows.length);
                            return Array.from({ length: maxRows }).map((_, i) => {
                              const row = rows[i];
                              if (!row) {
                                return (
                                  <tr key={i} className="border-b h-10">
                                    <td className="p-2" colSpan={4}></td>
                                  </tr>
                                );
                              }
                              const [hero, stats] = row;
                              return (
                                <tr key={hero} className="border-b hover:bg-muted/30">
                                  <td className="p-2 font-medium flex items-center gap-2">
                                    <img
                                      src={getHeroImageUrl(hero)}
                                      alt={hero}
                                      className="w-6 h-6 rounded object-cover bg-gray-200 dark:bg-gray-700"
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = "/window.svg";
                                      }}
                                    />
                                    {hero}
                                  </td>
                                  <td className="p-2">{stats.count}</td>
                                  <td className="p-2">{stats.wins}</td>
                                  <td className="p-2">
                                    <Badge
                                      variant={
                                        stats.winRate >= 90
                                          ? "default"
                                          : stats.winRate >= 60
                                            ? "default"
                                            : stats.winRate >= 50
                                              ? "secondary"
                                              : "destructive"
                                      }
                                      className={`text-xs ${stats.winRate >= 90 ? "bg-green-600 hover:bg-green-700" : ""}`}
                                    >
                                      {stats.winRate.toFixed(1)}%
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opponent Team Statistics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Opponents</h3>

                {/* Opponent Picks */}
                <div>
                  <h4 className="font-medium mb-2">Most Picked</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 w-1/4">
                            <button
                              onClick={() => {
                                setOpponentPicksSortBy("name");
                                setOpponentPicksSortOrder(
                                  opponentPicksSortBy === "name" &&
                                    opponentPicksSortOrder === "desc"
                                    ? "asc"
                                    : "desc",
                                );
                              }}
                              className="flex items-center gap-1 hover:bg-muted/50 px-1 py-1 rounded w-full"
                            >
                              Hero
                              {opponentPicksSortBy === "name" &&
                                (opponentPicksSortOrder === "desc" ? "↓" : "↑")}
                            </button>
                          </th>
                          <th className="text-left p-2 w-1/6">
                            <button
                              onClick={() => {
                                setOpponentPicksSortBy("count");
                                setOpponentPicksSortOrder(
                                  opponentPicksSortBy === "count" &&
                                    opponentPicksSortOrder === "desc"
                                    ? "asc"
                                    : "desc",
                                );
                              }}
                              className="flex items-center gap-1 hover:bg-muted/50 px-1 py-1 rounded w-full"
                            >
                              Picks
                              {opponentPicksSortBy === "count" &&
                                (opponentPicksSortOrder === "desc" ? "↓" : "↑")}
                            </button>
                          </th>
                          <th className="text-left p-2 w-1/6">
                            <button
                              onClick={() => {
                                setOpponentPicksSortBy("wins");
                                setOpponentPicksSortOrder(
                                  opponentPicksSortBy === "wins" &&
                                    opponentPicksSortOrder === "desc"
                                    ? "asc"
                                    : "desc",
                                );
                              }}
                              className="flex items-center gap-1 hover:bg-muted/50 px-1 py-1 rounded w-full"
                            >
                              Wins
                              {opponentPicksSortBy === "wins" &&
                                (opponentPicksSortOrder === "desc" ? "↓" : "↑")}
                            </button>
                          </th>
                          <th className="text-left p-2 w-1/4">
                            <button
                              onClick={() => {
                                setOpponentPicksSortBy("winRate");
                                setOpponentPicksSortOrder(
                                  opponentPicksSortBy === "winRate" &&
                                    opponentPicksSortOrder === "desc"
                                    ? "asc"
                                    : "desc",
                                );
                              }}
                              className="flex items-center gap-1 hover:bg-muted/50 px-1 py-1 rounded w-full"
                            >
                              Win Rate
                              {opponentPicksSortBy === "winRate" &&
                                (opponentPicksSortOrder === "desc" ? "↓" : "↑")}
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortRows(
                          filterHeroRows(opponentPicksRows),
                          opponentPicksSortBy,
                          opponentPicksSortOrder,
                        ).map(([hero, stats]: any) => (
                          <tr key={hero} className="border-b hover:bg-muted/30">
                            <td className="p-2 font-medium flex items-center gap-2">
                              <img
                                src={getHeroImageUrl(hero)}
                                alt={hero}
                                className="w-6 h-6 rounded object-cover bg-gray-200 dark:bg-gray-700"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = "/window.svg";
                                }}
                              />
                              {hero}
                            </td>
                            <td className="p-2">{stats.count}</td>
                            <td className="p-2">{stats.wins}</td>
                            <td className="p-2">
                              <Badge
                                variant={
                                  stats.winRate >= 90
                                    ? "default"
                                    : stats.winRate >= 60
                                      ? "default"
                                      : stats.winRate >= 50
                                        ? "secondary"
                                        : "destructive"
                                }
                                className={`text-xs ${stats.winRate >= 90 ? "bg-green-600 hover:bg-green-700" : ""}`}
                              >
                                {stats.winRate.toFixed(1)}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
