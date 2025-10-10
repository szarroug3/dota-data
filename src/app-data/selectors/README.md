# Selectors

Pure derived data only, no side-effects.


## Matches selectors usage (example)

```ts
import { selectMatchIdsByArrayKeyIndex, selectRecentMatchesFromIndex } from "@/src/app-data/selectors/matches.selectors";

// Build an index by player account_id if your match.data has players[] with account_id.
const idx = selectMatchIdsByArrayKeyIndex(matchState, ["players", "account_id"]);
const recentForPlayer = selectRecentMatchesFromIndex(matchState, idx, 123456789, 20);
```

These helpers avoid on-demand compute in components by centralizing derivations.
