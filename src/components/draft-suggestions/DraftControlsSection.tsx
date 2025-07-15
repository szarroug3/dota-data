import type { Team } from '@/types/contexts/team-context-value';

interface DraftControlsSectionProps {
  activeTeam: Team | null;
  roleFilter: string;
  showMetaOnly: boolean;
  onRoleFilterChange: (filter: string) => void;
  onShowMetaOnlyChange: (show: boolean) => void;
}

export function DraftControlsSection({
  activeTeam,
  roleFilter,
  showMetaOnly,
  onRoleFilterChange,
  onShowMetaOnlyChange,
}: DraftControlsSectionProps) {
  return (
    <div className="bg-card dark:bg-card rounded-lg shadow-md p-4 mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground">
          Suggestions for {activeTeam?.name ?? 'your team'}
        </h3>
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="role-filter" className="mr-2 text-sm font-medium text-muted-foreground dark:text-muted-foreground">
              Filter by Role:
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => onRoleFilterChange(e.target.value)}
              className="p-2 border border-border dark:border-border rounded-md bg-card dark:bg-card text-foreground dark:text-foreground text-sm"
            >
              <option value="all">All Roles</option>
              <option value="carry">Carry</option>
              <option value="mid">Mid</option>
              <option value="offlane">Offlane</option>
              <option value="support">Support</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="meta-only-filter"
              checked={showMetaOnly}
              onChange={(e) => onShowMetaOnlyChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="meta-only-filter" className="ml-2 text-sm font-medium text-muted-foreground dark:text-muted-foreground">
              Show Meta Heroes Only
            </label>
          </div>
        </div>
      </div>
    </div>
  );
} 