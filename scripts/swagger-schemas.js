export const schemas = {
  OpenDotaHero: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      localized_name: { type: 'string' },
      primary_attr: { type: 'string' },
      attack_type: { type: 'string' },
      roles: { type: 'array', items: { type: 'string' } },
      img: { type: 'string' },
      icon: { type: 'string' },
      base_health: { type: 'integer' },
      base_mana: { type: 'integer' },
      base_armor: { type: 'number' },
      base_attack_min: { type: 'integer' },
      base_attack_max: { type: 'integer' },
      move_speed: { type: 'integer' },
      base_attack_time: { type: 'number' },
      attack_point: { type: 'number' },
      attack_range: { type: 'integer' },
      projectile_speed: { type: 'integer' },
      turn_rate: { type: 'number' },
      cm_enabled: { type: 'boolean' },
      legs: { type: 'integer' },
      day_vision: { type: 'integer' },
      night_vision: { type: 'integer' },
      hero_id: { type: 'integer' },
      turbo_picks: { type: 'integer' },
      turbo_wins: { type: 'integer' },
      pro_ban: { type: 'integer' },
      pro_win: { type: 'integer' },
      pro_pick: { type: 'integer' },
      '1_pick': { type: 'integer' },
      '1_win': { type: 'integer' },
      '2_pick': { type: 'integer' },
      '2_win': { type: 'integer' },
      '3_pick': { type: 'integer' },
      '3_win': { type: 'integer' },
      '4_pick': { type: 'integer' },
      '4_win': { type: 'integer' },
      '5_pick': { type: 'integer' },
      '5_win': { type: 'integer' },
      '6_pick': { type: 'integer' },
      '6_win': { type: 'integer' },
      '7_pick': { type: 'integer' },
      '7_win': { type: 'integer' },
      '8_pick': { type: 'integer' },
      '8_win': { type: 'integer' },
      null_pick: { type: 'integer' },
      null_win: { type: 'integer' },
    },
  },
  OpenDotaPlayer: {
    type: 'object',
    properties: {
      account_id: { type: 'integer' },
      personaname: { type: 'string' },
      name: { type: 'string' },
      avatar: { type: 'string' },
      avatarfull: { type: 'string' },
      profileurl: { type: 'string' },
      last_login: { type: 'string' },
      loccountrycode: { type: 'string' },
      is_contributor: { type: 'boolean' },
      is_subscriber: { type: 'boolean' },
      rank_tier: { type: 'integer' },
      leaderboard_rank: { type: 'integer' },
      solo_competitive_rank: { type: 'integer' },
      competitive_rank: { type: 'integer' },
      mmr_estimate: {
        type: 'object',
        properties: {
          estimate: { type: 'integer' },
          stdDev: { type: 'number' },
          n: { type: 'integer' },
        },
      },
    },
  },
  PlayerStats: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      role: { type: 'string' },
      overallStats: {
        type: 'object',
        properties: {
          matches: { type: 'integer' },
          winRate: { type: 'number' },
          avgKDA: { type: 'number' },
          avgGPM: { type: 'number' },
          avgXPM: { type: 'number' },
          avgGameLength: { type: 'string' },
        },
      },
      recentPerformance: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            date: { type: 'string' },
            hero: { type: 'string' },
            result: { type: 'string' },
            KDA: { type: 'string' },
            GPM: { type: 'number' },
          },
        },
      },
      topHeroes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            hero: { type: 'string' },
            games: { type: 'integer' },
            winRate: { type: 'number' },
            avgKDA: { type: 'number' },
            avgGPM: { type: 'number' },
          },
        },
      },
      trends: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            metric: { type: 'string' },
            value: { oneOf: [{ type: 'number' }, { type: 'string' }] },
            trend: { type: 'string' },
            direction: { type: 'string', enum: ['up', 'down', 'neutral'] },
          },
        },
      },
      rank: { type: 'string' },
      stars: { type: 'integer' },
      immortalRank: { type: 'integer' },
      rankImage: { type: 'string' },
      recentlyPlayed: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            hero: { type: 'string' },
            heroImage: { type: 'string' },
            games: { type: 'integer' },
            winRate: { type: 'number' },
          },
        },
      },
    },
  },
  MatchHistory: {
    type: 'object',
    properties: {
      summary: {
        type: 'object',
        properties: {
          totalMatches: { type: 'integer' },
          wins: { type: 'integer' },
          losses: { type: 'integer' },
          winRate: { type: 'number' },
          avgGameLength: { type: 'string' },
          longestWinStreak: { type: 'integer' },
          currentStreak: { type: 'integer' },
        },
      },
      matches: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            date: { type: 'string' },
            opponent: { type: 'string' },
            result: { type: 'string' },
            score: { type: 'string' },
            duration: { type: 'string' },
            league: { type: 'string' },
            map: { type: 'string' },
            picks: { type: 'array', items: { type: 'string' } },
            bans: { type: 'array', items: { type: 'string' } },
            opponentPicks: { type: 'array', items: { type: 'string' } },
            opponentBans: { type: 'array', items: { type: 'string' } },
            draftOrder: { type: 'array', items: {} },
            highlights: { type: 'array', items: { type: 'string' } },
            playerStats: { type: 'object', additionalProperties: true },
            games: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  picks: { type: 'array', items: { type: 'string' } },
                  bans: { type: 'array', items: { type: 'string' } },
                  opponentPicks: { type: 'array', items: { type: 'string' } },
                  opponentBans: { type: 'array', items: { type: 'string' } },
                  draftOrder: { type: 'array', items: {} },
                  highlights: { type: 'array', items: { type: 'string' } },
                  playerStats: { type: 'object', additionalProperties: true },
                  duration: { type: 'string' },
                  score: { type: 'string' },
                },
              },
            },
          },
        },
      },
      trends: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            metric: { type: 'string' },
            value: { oneOf: [{ type: 'number' }, { type: 'string' }] },
            trend: { type: 'string' },
            direction: { type: 'string', enum: ['up', 'down', 'neutral'] },
          },
        },
      },
    },
  },
  DraftSuggestions: {
    type: 'object',
    properties: {
      teamStrengths: {
        type: 'object',
        properties: {
          carry: { type: 'string' },
          mid: { type: 'string' },
          support: { type: 'string' },
          offlane: { type: 'string' },
        },
      },
      teamWeaknesses: { type: 'array', items: { type: 'string' } },
      phaseRecommendations: {
        type: 'object',
        properties: {
          first: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              heroes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    role: { type: 'string' },
                    reason: { type: 'string' },
                    synergy: { type: 'array', items: { type: 'string' } },
                    counters: { type: 'array', items: { type: 'string' } },
                    pickPriority: { type: 'string' },
                    winRate: { type: 'number' },
                    games: { type: 'number' },
                  },
                },
              },
            },
          },
          second: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              heroes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    role: { type: 'string' },
                    reason: { type: 'string' },
                    synergy: { type: 'array', items: { type: 'string' } },
                    counters: { type: 'array', items: { type: 'string' } },
                    pickPriority: { type: 'string' },
                    winRate: { type: 'number' },
                    games: { type: 'number' },
                  },
                },
              },
            },
          },
          third: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              heroes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    role: { type: 'string' },
                    reason: { type: 'string' },
                    synergy: { type: 'array', items: { type: 'string' } },
                    counters: { type: 'array', items: { type: 'string' } },
                    pickPriority: { type: 'string' },
                    winRate: { type: 'number' },
                    games: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
      metaCounters: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            hero: { type: 'string' },
            counter: { type: 'string' },
            reason: { type: 'string' },
            effectiveness: { type: 'string' },
          },
        },
      },
      recentDrafts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            date: { type: 'string' },
            opponent: { type: 'string' },
            result: { type: 'string' },
            picks: { type: 'array', items: { type: 'string' } },
            bans: { type: 'array', items: { type: 'string' } },
            notes: { type: 'string' },
          },
        },
      },
    },
  },
  TeamAnalysis: {
    type: 'object',
    properties: {
      overallStats: {
        type: 'object',
        properties: {
          totalMatches: { type: 'integer' },
          winRate: { type: 'number' },
          avgGameLength: { type: 'string' },
          avgKDA: { type: 'number' },
          avgGPM: { type: 'number' },
          avgXPM: { type: 'number' },
        },
      },
      rolePerformance: {
        type: 'object',
        properties: {
          carry: {
            type: 'object',
            properties: {
              winRate: { type: 'number' },
              avgKDA: { type: 'number' },
              avgGPM: { type: 'number' },
            },
          },
          mid: {
            type: 'object',
            properties: {
              winRate: { type: 'number' },
              avgKDA: { type: 'number' },
              avgGPM: { type: 'number' },
            },
          },
          offlane: {
            type: 'object',
            properties: {
              winRate: { type: 'number' },
              avgKDA: { type: 'number' },
              avgGPM: { type: 'number' },
            },
          },
          support: {
            type: 'object',
            properties: {
              winRate: { type: 'number' },
              avgKDA: { type: 'number' },
              avgGPM: { type: 'number' },
            },
          },
        },
      },
      gamePhaseStats: {
        type: 'object',
        properties: {
          earlyGame: {
            type: 'object',
            properties: {
              winRate: { type: 'number' },
              avgDuration: { type: 'string' },
            },
          },
          midGame: {
            type: 'object',
            properties: {
              winRate: { type: 'number' },
              avgDuration: { type: 'string' },
            },
          },
          lateGame: {
            type: 'object',
            properties: {
              winRate: { type: 'number' },
              avgDuration: { type: 'string' },
            },
          },
        },
      },
      heroPool: {
        type: 'object',
        properties: {
          mostPicked: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                hero: { type: 'string' },
                games: { type: 'integer' },
                winRate: { type: 'number' },
              },
            },
          },
          mostBanned: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                hero: { type: 'string' },
                bans: { type: 'integer' },
                banRate: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
}; 