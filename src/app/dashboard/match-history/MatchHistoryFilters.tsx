import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, Plus, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface MatchHistoryFilters {
  opponentFilter: string;
  heroFilter: string[];
  resultFilter: string;
  sideFilter: string;
  pickFilter: string;
}

interface HeroMultiselectProps {
  selectedHeroes: string[];
  availableHeroes: string[];
  onSelectionChange: (heroes: string[]) => void;
}

function HeroDropdown({
  isOpen,
  searchTerm,
  setSearchTerm,
  filteredHeroes,
  selectedHeroes,
  handleHeroToggle,
  handleSelectAll,
  handleClearAll,
}: {
  isOpen: boolean;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  filteredHeroes: string[];
  selectedHeroes: string[];
  handleHeroToggle: (hero: string) => void;
  handleSelectAll: () => void;
  handleClearAll: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-hidden animate-in fade-in-0 zoom-in-95">
      <div className="p-2 border-b bg-popover">
        <Input
          placeholder="Search heroes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-8"
        />
      </div>
      <div className="p-2 border-b bg-popover">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-xs">Select All</Button>
          <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs">Clear All</Button>
        </div>
      </div>
      <div className="max-h-40 overflow-y-auto bg-popover">
        {filteredHeroes.map((hero) => (
          <div
            key={hero}
            className="flex items-center space-x-2 p-2 hover:bg-accent cursor-pointer"
            onClick={() => handleHeroToggle(hero)}
          >
            <Checkbox
              checked={selectedHeroes.includes(hero)}
              onChange={() => handleHeroToggle(hero)}
            />
            <span className="text-sm">{hero}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroBadgeList({ selectedHeroes }: { selectedHeroes: string[] }) {
  if (selectedHeroes.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {selectedHeroes.slice(0, 3).map((hero) => (
        <Badge key={hero} variant="secondary" className="text-xs">{hero}</Badge>
      ))}
      {selectedHeroes.length > 3 && (
        <Badge variant="secondary" className="text-xs">+{selectedHeroes.length - 3} more</Badge>
      )}
    </div>
  );
}

function HeroMultiselect({ selectedHeroes, availableHeroes, onSelectionChange }: HeroMultiselectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredHeroes, setFilteredHeroes] = useState(availableHeroes);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFilteredHeroes(
      availableHeroes.filter(hero => hero.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, availableHeroes]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHeroToggle = (hero: string) => {
    const newSelection = selectedHeroes.includes(hero)
      ? selectedHeroes.filter(h => h !== hero)
      : [...selectedHeroes, hero];
    onSelectionChange(newSelection);
  };
  const handleSelectAll = () => onSelectionChange(availableHeroes);
  const handleClearAll = () => onSelectionChange([]);
  const displayText = selectedHeroes.length === 0
    ? "Select heroes..."
    : selectedHeroes.length === 1
    ? selectedHeroes[0]
    : `${selectedHeroes.length} heroes selected`;

  return (
    <div ref={containerRef} className="relative">
      <div
        tabIndex={0}
        className={`flex items-center w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors cursor-pointer justify-between ${isOpen ? 'ring-2 ring-ring' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setIsOpen(!isOpen); }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate text-muted-foreground">{displayText}</span>
        <ChevronDown className="h-4 w-4 shrink-0 ml-2 text-muted-foreground" />
      </div>
      <HeroDropdown
        isOpen={isOpen}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredHeroes={filteredHeroes}
        selectedHeroes={selectedHeroes}
        handleHeroToggle={handleHeroToggle}
        handleSelectAll={handleSelectAll}
        handleClearAll={handleClearAll}
      />
      <HeroBadgeList selectedHeroes={selectedHeroes} />
    </div>
  );
}

interface MatchHistoryFiltersProps {
  filters: MatchHistoryFilters;
  onFilterChange: (filters: Partial<MatchHistoryFilters>) => void;
  onClearFilters: () => void;
  availableHeroes: string[];
  onAddMatch?: () => void;
}

function FilterRow({
  filters,
  onFilterChange,
  availableHeroes
}: {
  filters: MatchHistoryFilters;
  onFilterChange: (filters: Partial<MatchHistoryFilters>) => void;
  availableHeroes: string[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Opponent</label>
        <Input
          placeholder="Filter by opponent..."
          value={filters.opponentFilter}
          onChange={(e) => onFilterChange({ opponentFilter: e.target.value })}
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Heroes</label>
        <HeroMultiselect
          selectedHeroes={filters.heroFilter}
          availableHeroes={availableHeroes}
          onSelectionChange={(heroes) => onFilterChange({ heroFilter: heroes })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Result</label>
        <Select
          value={filters.resultFilter}
          onValueChange={(value) => onFilterChange({ resultFilter: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All results..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="W">Wins</SelectItem>
            <SelectItem value="L">Losses</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Side</label>
        <Select
          value={filters.sideFilter}
          onValueChange={(value) => onFilterChange({ sideFilter: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All sides..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sides</SelectItem>
            <SelectItem value="Radiant">Radiant</SelectItem>
            <SelectItem value="Dire">Dire</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Pick Order</label>
        <Select
          value={filters.pickFilter}
          onValueChange={(value) => onFilterChange({ pickFilter: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All picks..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Picks</SelectItem>
            <SelectItem value="FP">First Pick</SelectItem>
            <SelectItem value="SP">Second Pick</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function MatchHistoryFilters({
  filters,
  onFilterChange,
  onClearFilters,
  availableHeroes,
  onAddMatch
}: MatchHistoryFiltersProps) {
  const hasActiveFilters = Object.values(filters).some(filter => 
    Array.isArray(filter) ? filter.length > 0 : filter !== ""
  );

  return (
    <div className="bg-card rounded-lg p-4 mb-6 border">
      <div className="flex items-center gap-4 mb-4">
        <Search className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Filter Matches</h3>
        <div className="ml-auto flex items-center gap-2">
          {onAddMatch && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddMatch}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Match
            </Button>
          )}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
            >
              <X className="w-4 h-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>
      <FilterRow filters={filters} onFilterChange={onFilterChange} availableHeroes={availableHeroes} />
    </div>
  );
}

export function useMatchHistoryFilters() {
  const [filters, setFilters] = useState<MatchHistoryFilters>({
    opponentFilter: "",
    heroFilter: [],
    resultFilter: "all",
    sideFilter: "all",
    pickFilter: "all",
  });

  const updateFilters = (newFilters: Partial<MatchHistoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      opponentFilter: "",
      heroFilter: [],
      resultFilter: "all",
      sideFilter: "all",
      pickFilter: "all",
    });
  };

  return { filters, updateFilters, clearFilters };
} 