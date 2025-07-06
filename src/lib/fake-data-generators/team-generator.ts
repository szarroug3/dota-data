import { writeMockData } from '@/lib/mock-data-writer';
import { randomChoice, randomInt } from './utils/fake-data-helpers';

export function generateFakeDotabuffTeamMatchesHtml(teamId: string, pageNum: number, filename: string): string {
  // Generate fake HTML for team matches page that matches real Dotabuff structure
  const teamName = `Team ${teamId}`;
  const leagues = [
    { id: '16435', name: 'RD2L Season 33' },
    { id: '12345', name: 'BTS Pro Series 15' },
    { id: '67890', name: 'ESL One' }
  ];
  const heroes = ['Mars', 'Tusk', 'Medusa', 'Mirana', 'Ember Spirit', 'Lina', 'Silencer', 'Gyrocopter', 'Winter Wyvern', 'Treant Protector'];
  const opponents = [
    { id: '9517701', name: 'SEA10KMMR', tag: 'SEA10KMMR' },
    { id: '9517703', name: 'erock void pog', tag: 'erock void pog' },
    { id: '9517705', name: 'Team Alpha', tag: 'Alpha' }
  ];
  
  const matches = Array.from({ length: 10 }, (_, index) => {
    const league = leagues[index % leagues.length];
    const opponent = opponents[index % opponents.length];
    const matchId = randomInt(1000000000, 9999999999);
    const result = randomChoice(['win', 'loss']);
    const seriesId = randomInt(1000000, 9999999);
    const duration = `${randomInt(20, 60)}:${randomInt(0, 59).toString().padStart(2, '0')}`;
    const matchHeroes = heroes.slice(0, 5);
    const date = new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000).toISOString();
    
    return {
      matchId,
      result,
      seriesId,
      duration,
      heroes: matchHeroes,
      opponent,
      date,
      league
    };
  });
  
  const html = `
<!DOCTYPE html>
<html class="esports-skin">
<head>
    <title>${teamName} - Matches - DOTABUFF - Dota 2 Stats</title>
</head>
<body>
    <div class="header-content">
        <div class="header-content-avatar">
            <span class="team-image">
                <img alt="${teamName}" class="img-team img-avatar" src="https://riki.dotabuff.com/t/l/73hBODPlMSk.png" />
            </span>
        </div>
        <div class="header-content-title">
            <h1>${teamName}<small>Matches</small></h1>
        </div>
    </div>
    <div class="content-inner">
        <section>
            <article>
                <table class="table table-striped recent-esports-matches">
                    <thead>
                        <tr>
                            <th>League</th>
                            <th>Result</th>
                            <th>Series</th>
                            <th class="r-none-mobile">Duration</th>
                            <th class="r-none-tablet">${teamName}'s Heroes</th>
                            <th>Opponent</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${matches.map(match => `
                        <tr>
                            <td>
                                <a class="esports-league esports-link league-link" href="/esports/leagues/${match.league.id}-${match.league.name.toLowerCase().replace(/\\s+/g, '-')}">
                                    <span class="league-image">
                                        <img alt="${match.league.name}" class="img-league img-avatar" src="https://riki.dotabuff.com/leagues/${match.league.id}/banner.png" />
                                    </span>
                                </a>
                            </td>
                            <td>
                                <div>
                                    <a class="${match.result === 'win' ? 'won' : 'lost'}" href="/matches/${match.matchId}">${match.result === 'win' ? 'Won' : 'Lost'} Match</a>
                                </div>
                                <span class="r-none-mobile">
                                    <time datetime="${match.date}" title="${new Date(match.date).toLocaleDateString()}" data-time-ago="${match.date}">${new Date(match.date).toLocaleDateString()}</time>
                                </span>
                            </td>
                            <td>
                                <div><a href="/esports/series/${match.seriesId}">Series ${match.seriesId}</a></div>
                                <small>US East</small>
                            </td>
                            <td class="r-none-mobile">${match.duration}
                                <div class="bar bar-default">
                                    <div class="segment segment-duration" style="width: 100.0%;"></div>
                                </div>
                            </td>
                            <td class="r-none-tablet cell-icons">
                                ${match.heroes.map(hero => `
                                <div class="image-container image-container-hero image-container-icon">
                                    <a href="/heroes/${hero.toLowerCase().replace(/\\s+/g, '-')}">
                                        <img class="image-hero image-icon" title="${hero}" src="/assets/heroes/${hero.toLowerCase().replace(/\\s+/g, '-')}.jpg" />
                                    </a>
                                </div>
                                `).join('')}
                            </td>
                            <td class="cell-icons">
                                <a class="esports-team esports-link team-link" href="/esports/teams/${match.opponent.id}-${match.opponent.name.toLowerCase().replace(/\\s+/g, '-')}">
                                    <span class="team-image">
                                        <img alt="${match.opponent.tag}" class="img-team img-avatar" src="https://riki.dotabuff.com/t/l/bcnlIq8.png" />
                                    </span>
                                </a>
                                <a class="esports-team esports-link team-link" href="/esports/teams/${match.opponent.id}-${match.opponent.name.toLowerCase().replace(/\\s+/g, '-')}">
                                    <span class="team-text team-text-full">${match.opponent.name}</span>
                                </a>
                                <div class="r-none-tablet clearfix" style="margin-top: 4px"></div>
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </article>
        </section>
    </div>
</body>
</html>`;
  
  writeMockData(filename, html, '/teams');
  return html;
}

export function generateFakeMatchDetails(matchId: number, filename: string): any {
  // Generate fake match details that match the OpenDota API structure
  const matchDetails = {
    match_id: matchId,
    start_time: Math.floor(Date.now() / 1000) - randomInt(0, 86400),
    duration: randomInt(1200, 3600),
    radiant_win: randomChoice([true, false]),
    players: Array.from({ length: 10 }, (_, i) => ({
      account_id: randomInt(1000000, 9999999),
      player_slot: i < 5 ? i : 128 + (i - 5),
      hero_id: randomInt(1, 50),
      kills: randomInt(0, 20),
      deaths: randomInt(0, 15),
      assists: randomInt(0, 25),
      leaver_status: 0,
      last_hits: randomInt(0, 300),
      denies: randomInt(0, 50),
      gold_per_min: randomInt(200, 800),
      xp_per_min: randomInt(300, 1000),
      level: randomInt(1, 25),
      net_worth: randomInt(1000, 50000),
      personaname: `Player${i + 1}`,
      name: `Player${i + 1}`,
      radiant_win: false, // Will be set by match
      win: 0, // Will be set by match
      lose: 0, // Will be set by match
      total_gold: randomInt(10000, 100000),
      total_xp: randomInt(5000, 50000),
      kills_per_min: randomInt(0, 200) / 100,
      kda: randomInt(0, 1000) / 100,
      abandons: 0
    })),
    radiant_name: 'Radiant',
    dire_name: 'Dire',
    radiant_team_id: randomInt(1000, 9999),
    dire_team_id: randomInt(1000, 9999),
    radiant_score: randomInt(0, 50),
    dire_score: randomInt(0, 50),
    leagueid: randomInt(1000, 9999),
    picks_bans: Array.from({ length: randomInt(10, 20) }, (_, i) => ({
      is_pick: randomChoice([true, false]),
      hero_id: randomInt(1, 50),
      team: randomChoice([0, 1]),
      order: i
    }))
  };
  
  // Set win/lose values based on radiant_win
  matchDetails.players.forEach(player => {
    player.radiant_win = matchDetails.radiant_win;
    player.win = matchDetails.radiant_win === (player.player_slot < 128) ? 1 : 0;
    player.lose = matchDetails.radiant_win === (player.player_slot < 128) ? 0 : 1;
  });
  
  writeMockData(filename, matchDetails, '/matches');
  return matchDetails;
} 