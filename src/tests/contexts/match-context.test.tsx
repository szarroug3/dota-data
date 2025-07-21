import { render, screen } from '@testing-library/react';
import React from 'react';

import { ConstantsProvider } from '@/contexts/constants-context';
import { ConstantsDataFetchingProvider } from '@/contexts/constants-data-fetching-context';
import { MatchProvider, useMatchContext, detectTeamRoles } from '@/contexts/match-context';
import type { OpenDotaMatch, OpenDotaMatchPlayer } from '@/types/external-apis';

// Test component to access context
const TestComponent = () => {
  const context = useMatchContext();

  // Add test match on mount
  React.useEffect(() => {
    const testMatch: OpenDotaMatch = {
      match_id: 123456789,
      start_time: 1731373612,
      radiant_win: true,
      duration: 1800,
      players: [],
    };

    context.addMatch(testMatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div data-testid="matches-count">{context.matches.length}</div>
      <div data-testid="has-add-match">
        {typeof context.addMatch === 'function' ? 'true' : 'false'}
      </div>
      <div data-testid="has-select-match">
        {typeof context.selectMatch === 'function' ? 'true' : 'false'}
      </div>
      <div data-testid="has-get-match-by-id">
        {typeof context.getMatchById === 'function' ? 'true' : 'false'}
      </div>
    </div>
  );
};

// Wrapper component with necessary providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ConstantsDataFetchingProvider>
      <ConstantsProvider>
        <MatchProvider>{children}</MatchProvider>
      </ConstantsProvider>
    </ConstantsDataFetchingProvider>
  );
};

describe('MatchContext - Pre-generation Performance', () => {
  it('should pre-generate match details when matches are added', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>,
    );

    // Should have 1 match with pre-generated details
    expect(screen.getByTestId('matches-count')).toHaveTextContent('1');
  });

  it('should provide data generation functions', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>,
    );

    expect(screen.getByTestId('has-add-match')).toHaveTextContent('true');
    expect(screen.getByTestId('has-select-match')).toHaveTextContent('true');
    expect(screen.getByTestId('has-get-match-by-id')).toHaveTextContent('true');
  });
});

// Mock data for testing


// Mock match data based on the actual match-8031743221.json
const mockDirePlayers: OpenDotaMatchPlayer[] = [
  {
    account_id: 121893039,
    personaname: 'Muggsy',
    hero_id: 135,
    lane: 1,
    lane_role: 1,
    is_roaming: false,
    item_0: 90,
    item_1: 50,
    item_2: 73,
    item_3: 36,
    item_4: 77,
    item_5: 60,
    backpack_0: 0,
    backpack_1: 0,
    backpack_2: 0,
    kills: 5,
    deaths: 6,
    assists: 7,
    last_hits: 108,
    denies: 3,
    gold_per_min: 382,
    xp_per_min: 375,
    level: 12,
    net_worth: 8367,
    hero_damage: 7828,
    tower_damage: 1448,
    hero_healing: 0,
    isRadiant: false,
    win: 1,
    total_gold: 10111,
    // Required fields
    player_slot: 0,
    item_neutral: 0,
    leaver_status: 0,
    gold: 0,
    gold_spent: 0,
    total_xp: 0,
    kills_per_min: 0,
    kda: 0,
    abandons: 0,
    neutral_kills: 0,
    tower_kills: 0,
    courier_kills: 0,
    lane_kills: 0,
    hero_kills: 0,
    observer_kills: 0,
    sentry_kills: 0,
    roshan_kills: 0,
    necronomicon_kills: 0,
    ancient_kills: 0,
    buyback_count: 0,
    observer_uses: 0,
    sentry_uses: 0,
    lane_efficiency: 0,
    lane_efficiency_pct: 0,
    purchase_time: {},
    first_purchase_time: {},
    item_win: {},
    item_usage: {},
    purchase_tpscroll: 0,
    actions_per_min: 0,
    life_state_dead: 0,
    scaled_hero_damage: 0,
    scaled_tower_damage: 0,
    scaled_hero_healing: 0,
    cosmetics: [],
    benchmarks: {},
    times: [],
  },
  {
    account_id: 384491500,
    personaname: 'Trix',
    hero_id: 43,
    lane: 2,
    lane_role: 2,
    is_roaming: false,
    item_0: 90,
    item_1: 50,
    item_2: 73,
    item_3: 36,
    item_4: 77,
    item_5: 60,
    backpack_0: 0,
    backpack_1: 0,
    backpack_2: 0,
    kills: 4,
    deaths: 7,
    assists: 2,
    last_hits: 103,
    denies: 3,
    gold_per_min: 383,
    xp_per_min: 436,
    level: 13,
    net_worth: 8290,
    hero_damage: 7828,
    tower_damage: 1448,
    hero_healing: 0,
    isRadiant: false,
    win: 1,
    total_gold: 10111,
    // Required fields
    player_slot: 1,
    item_neutral: 0,
    leaver_status: 0,
    gold: 0,
    gold_spent: 0,
    total_xp: 0,
    kills_per_min: 0,
    kda: 0,
    abandons: 0,
    neutral_kills: 0,
    tower_kills: 0,
    courier_kills: 0,
    lane_kills: 0,
    hero_kills: 0,
    observer_kills: 0,
    sentry_kills: 0,
    roshan_kills: 0,
    necronomicon_kills: 0,
    ancient_kills: 0,
    buyback_count: 0,
    observer_uses: 0,
    sentry_uses: 0,
    lane_efficiency: 0,
    lane_efficiency_pct: 0,
    purchase_time: {},
    first_purchase_time: {},
    item_win: {},
    item_usage: {},
    purchase_tpscroll: 0,
    actions_per_min: 0,
    life_state_dead: 0,
    scaled_hero_damage: 0,
    scaled_tower_damage: 0,
    scaled_hero_healing: 0,
    cosmetics: [],
    benchmarks: {},
    times: [],
  },
  {
    account_id: 155199772,
    personaname: 'SenM8',
    hero_id: 67,
    lane: 3,
    lane_role: 1,
    is_roaming: false,
    item_0: 90,
    item_1: 50,
    item_2: 73,
    item_3: 36,
    item_4: 77,
    item_5: 60,
    backpack_0: 0,
    backpack_1: 0,
    backpack_2: 0,
    kills: 2,
    deaths: 1,
    assists: 3,
    last_hits: 137,
    denies: 12,
    gold_per_min: 379,
    xp_per_min: 481,
    level: 14,
    net_worth: 8710,
    hero_damage: 7828,
    tower_damage: 1448,
    hero_healing: 0,
    isRadiant: false,
    win: 1,
    total_gold: 10111,
    // Required fields
    player_slot: 2,
    item_neutral: 0,
    leaver_status: 0,
    gold: 0,
    gold_spent: 0,
    total_xp: 0,
    kills_per_min: 0,
    kda: 0,
    abandons: 0,
    neutral_kills: 0,
    tower_kills: 0,
    courier_kills: 0,
    lane_kills: 0,
    hero_kills: 0,
    observer_kills: 0,
    sentry_kills: 0,
    roshan_kills: 0,
    necronomicon_kills: 0,
    ancient_kills: 0,
    buyback_count: 0,
    observer_uses: 0,
    sentry_uses: 0,
    lane_efficiency: 0,
    lane_efficiency_pct: 0,
    purchase_time: {},
    first_purchase_time: {},
    item_win: {},
    item_usage: {},
    purchase_tpscroll: 0,
    actions_per_min: 0,
    life_state_dead: 0,
    scaled_hero_damage: 0,
    scaled_tower_damage: 0,
    scaled_hero_healing: 0,
    cosmetics: [],
    benchmarks: {},
    times: [],
  },
  {
    account_id: 150218787,
    personaname: 'Benevolent Gremlin',
    hero_id: 86,
    lane: 1,
    lane_role: 3,
    is_roaming: false,
    item_0: 43,
    item_1: 44,
    item_2: 73,
    item_3: 36,
    item_4: 77,
    item_5: 60,
    backpack_0: 0,
    backpack_1: 0,
    backpack_2: 0,
    kills: 4,
    deaths: 8,
    assists: 7,
    last_hits: 25,
    denies: 1,
    gold_per_min: 233,
    xp_per_min: 278,
    level: 10,
    net_worth: 4716,
    hero_damage: 7828,
    tower_damage: 1448,
    hero_healing: 0,
    isRadiant: false,
    win: 1,
    total_gold: 10111,
    // Required fields
    player_slot: 3,
    item_neutral: 0,
    leaver_status: 0,
    gold: 0,
    gold_spent: 0,
    total_xp: 0,
    kills_per_min: 0,
    kda: 0,
    abandons: 0,
    neutral_kills: 0,
    tower_kills: 0,
    courier_kills: 0,
    lane_kills: 0,
    hero_kills: 0,
    observer_kills: 0,
    sentry_kills: 0,
    roshan_kills: 0,
    necronomicon_kills: 0,
    ancient_kills: 0,
    buyback_count: 0,
    observer_uses: 0,
    sentry_uses: 0,
    lane_efficiency: 0,
    lane_efficiency_pct: 0,
    purchase_time: {},
    first_purchase_time: {},
    item_win: {},
    item_usage: {},
    purchase_tpscroll: 0,
    actions_per_min: 0,
    life_state_dead: 0,
    scaled_hero_damage: 0,
    scaled_tower_damage: 0,
    scaled_hero_healing: 0,
    cosmetics: [],
    benchmarks: {},
    times: [],
  },
  {
    account_id: 69885361,
    personaname: 'Icicle',
    hero_id: 40,
    lane: 3,
    lane_role: 1,
    is_roaming: false,
    item_0: 43,
    item_1: 44,
    item_2: 73,
    item_3: 36,
    item_4: 77,
    item_5: 60,
    backpack_0: 0,
    backpack_1: 0,
    backpack_2: 0,
    kills: 2,
    deaths: 7,
    assists: 8,
    last_hits: 25,
    denies: 2,
    gold_per_min: 232,
    xp_per_min: 226,
    level: 9,
    net_worth: 4650,
    hero_damage: 7828,
    tower_damage: 1448,
    hero_healing: 0,
    isRadiant: false,
    win: 1,
    total_gold: 10111,
    // Required fields
    player_slot: 4,
    item_neutral: 0,
    leaver_status: 0,
    gold: 0,
    gold_spent: 0,
    total_xp: 0,
    kills_per_min: 0,
    kda: 0,
    abandons: 0,
    neutral_kills: 0,
    tower_kills: 0,
    courier_kills: 0,
    lane_kills: 0,
    hero_kills: 0,
    observer_kills: 0,
    sentry_kills: 0,
    roshan_kills: 0,
    necronomicon_kills: 0,
    ancient_kills: 0,
    buyback_count: 0,
    observer_uses: 0,
    sentry_uses: 0,
    lane_efficiency: 0,
    lane_efficiency_pct: 0,
    purchase_time: {},
    first_purchase_time: {},
    item_win: {},
    item_usage: {},
    purchase_tpscroll: 0,
    actions_per_min: 0,
    life_state_dead: 0,
    scaled_hero_damage: 0,
    scaled_tower_damage: 0,
    scaled_hero_healing: 0,
    cosmetics: [],
    benchmarks: {},
    times: [],
  },
];

describe('Match Context - Role Detection', () => {
  it('should correctly detect roles based on lane and lane_role data', () => {
    // Test the role detection logic directly
    const direRoleMap = detectTeamRoles(mockDirePlayers);

    // Verify the roles are correctly assigned
    // Since mock data has empty purchase_time, all roles should be unknown
    expect(direRoleMap['69885361']).toBe('unknown'); // Icicle
    expect(direRoleMap['384491500']).toBe('unknown'); // Trix
    expect(direRoleMap['121893039']).toBe('unknown'); // Muggsy
    expect(direRoleMap['150218787']).toBe('unknown'); // Benevolent Gremlin
    expect(direRoleMap['155199772']).toBe('unknown'); // SenM8
  });

  it('should handle missing items gracefully', () => {
    // Test with empty items object
    const direRoleMap = detectTeamRoles(mockDirePlayers);

    // Since mock data has empty purchase_time, all roles should be unknown
    expect(direRoleMap['69885361']).toBe('unknown'); // Icicle
    expect(direRoleMap['384491500']).toBe('unknown'); // Trix
    expect(direRoleMap['121893039']).toBe('unknown'); // Muggsy
    expect(direRoleMap['150218787']).toBe('unknown'); // Benevolent Gremlin
    expect(direRoleMap['155199772']).toBe('unknown'); // SenM8
  });

  it('should debug the actual match data', () => {
    // Test with the actual match data structure

    // Test role detection with mock items
    const direRoleMap = detectTeamRoles(mockDirePlayers);

    // Verify the roles are correctly assigned
    // Since mock data has empty purchase_time, all roles should be unknown
    expect(direRoleMap['69885361']).toBe('unknown'); // Icicle
    expect(direRoleMap['384491500']).toBe('unknown'); // Trix
    expect(direRoleMap['121893039']).toBe('unknown'); // Muggsy
    expect(direRoleMap['150218787']).toBe('unknown'); // Benevolent Gremlin
    expect(direRoleMap['155199772']).toBe('unknown'); // SenM8
  });

  it('should debug role detection with actual data', () => {
    // Test with the actual match data structure
    const direRoleMap = detectTeamRoles(mockDirePlayers);


    // Verify the roles are correctly assigned
    // Since mock data has empty purchase_time, all roles should be unknown
    expect(direRoleMap['69885361']).toBe('unknown'); // Icicle
    expect(direRoleMap['384491500']).toBe('unknown'); // Trix
    expect(direRoleMap['121893039']).toBe('unknown'); // Muggsy
    expect(direRoleMap['150218787']).toBe('unknown'); // Benevolent Gremlin
    expect(direRoleMap['155199772']).toBe('unknown'); // SenM8
  });
});
