//x import { writeFile } from 'fs/promises';

// const API_KEY = '6EFD142E831FF01907E739C9389D620B';
// const TEAM_ID = 9517508;
// const HISTORY_ENDPOINT = 'https://api.steampowered.com/IDOTA2Match_570/GetMatchHistoryBySequenceNum/v1';
// 
// const START_SEQ = 0;
// const BATCHES = 100;
// const DELAY_MS = 1200;
// 
// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }
// 
// async function getMatchBatch(startSeqNum) {
//   const url = new URL(HISTORY_ENDPOINT);
//   url.searchParams.set('key', API_KEY);
//   url.searchParams.set('start_at_match_seq_num', startSeqNum);
//   url.searchParams.set('matches_requested', 100);
// 
//   const res = await fetch(url);
//   if (!res.ok) {
//     throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
//   }
// 
//   const data = await res.json();
//   return data.result.matches || [];
// }
// 
// async function getTeamMatches() {
//   let seq = START_SEQ;
//   const results = [];
// 
//   for (let i = 0; i < BATCHES; i++) {
//     console.log(`Fetching batch ${i + 1}, sequence ${seq}...`);
//     let matches;
// 
//     try {
//       matches = await getMatchBatch(seq);
//     } catch (err) {
//       console.error('Error fetching matches:', err.message);
//       break;
//     }
// 
//     if (!matches.length) {
//       console.log('No more matches returned.');
//       break;
//     }
// 
//     for (const match of matches) {
//       seq = match.match_seq_num + 1;
// 
//       if (
//         match.radiant_team_id === TEAM_ID ||
//         match.dire_team_id === TEAM_ID
//       ) {
//         results.push({
//           match_id: match.match_id,
//           start_time: match.start_time,
//           radiant_team_id: match.radiant_team_id,
//           dire_team_id: match.dire_team_id,
//           radiant_win: match.radiant_win,
//         });
//       }
//     }
// 
//     await sleep(DELAY_MS);
//   }
// 
//   return results;
// }
// 
// async function main() {
//   const matches = await getTeamMatches();
//   console.log(`\n✅ Found ${matches.length} matches for team ${TEAM_ID}`);
//   matches.forEach(m => console.log(m));
// 
//   await writeFile('team_matches.json', JSON.stringify(matches, null, 2));
//   console.log('\n📝 Saved to team_matches.json');
// }
// 
// main().catch(console.error);

import { writeFile } from 'fs/promises';

const API_KEY = '6EFD142E831FF01907E739C9389D620B';
const TEAM_ID = 9517508;
const LEAGUE_ID = 16435; // Replace with the league Maple Syrup played in
const MATCH_HISTORY_URL = 'https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1';

const BATCHES = 50;
const DELAY_MS = 1000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getMatchBatch(leagueId, startMatchId = null) {
  const url = new URL(MATCH_HISTORY_URL);
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('league_id', leagueId);
  url.searchParams.set('matches_requested', 100);
  if (startMatchId) url.searchParams.set('start_at_match_id', startMatchId);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.result.matches || [];
}

async function getTeamMatchesInLeague() {
  let lastMatchId = null;
  const results = [];

  for (let i = 0; i < BATCHES; i++) {
    console.log(`Fetching batch ${i + 1}...`);
    let matches;

    try {
      matches = await getMatchBatch(LEAGUE_ID, lastMatchId);
    } catch (err) {
      console.error('Error fetching matches:', err.message);
      break;
    }

    if (!matches.length) {
      console.log('No more matches returned.');
      break;
    }

    for (const match of matches) {
      lastMatchId = match.match_id - 1; // Pagination: go backward
      if (
        match.radiant_team_id === TEAM_ID ||
        match.dire_team_id === TEAM_ID
      ) {
        results.push(match);
      }
    }

    await sleep(DELAY_MS);
  }

  return results;
}

async function main() {
  const matches = await getTeamMatchesInLeague();
  console.log(`\n✅ Found ${matches.length} matches for team ${TEAM_ID} in league ${LEAGUE_ID}`);
  matches.forEach(m => console.log(m));

  await writeFile('team_matches_league.json', JSON.stringify(matches, null, 2));
  console.log('\n📝 Saved to team_matches_league.json');
}

main().catch(console.error);
