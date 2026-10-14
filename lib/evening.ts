/**
 * Stand van een speelavond
 *
 * Volgorde (speler van de avond):
 *   1. punten
 *   2. caramboles
 *   3. hoogste serie
 *   4. gemiddelde (caramboles / beurten)
 *   5. aantal overwinningen
 *
 * Alleen afgeronde partijen tellen mee.
 */

export interface EveningMatchRow {
  status: string;
  player1_id: number;
  player2_id: number;
  player1_name: string;
  player2_name: string;
  winner_id: number | null;
  is_draw: boolean;
  p1_caramboles: number;
  p1_beurten: number;
  p1_highest_serie: number;
  p1_points: number | string;
  p2_caramboles: number;
  p2_beurten: number;
  p2_highest_serie: number;
  p2_points: number | string;
}

export interface EveningStanding {
  member_id: number;
  name: string;
  played: number;
  points: number;
  caramboles: number;
  beurten: number;
  highest_serie: number;
  wins: number;
  draws: number;
  losses: number;
}

function average(s: EveningStanding) {
  return s.beurten > 0 ? s.caramboles / s.beurten : 0;
}

export function compareStandings(a: EveningStanding, b: EveningStanding) {
  return (
    b.points - a.points ||
    b.caramboles - a.caramboles ||
    b.highest_serie - a.highest_serie ||
    average(b) - average(a) ||
    b.wins - a.wins
  );
}

export function computeEveningStandings(matches: EveningMatchRow[]): EveningStanding[] {
  const standings: Record<number, EveningStanding> = {};
  const entry = (id: number, name: string) =>
    (standings[id] ??= {
      member_id: id, name, played: 0, points: 0, caramboles: 0, beurten: 0,
      highest_serie: 0, wins: 0, draws: 0, losses: 0,
    });

  for (const m of matches) {
    if (m.status !== 'played') continue;
    const sides = [
      { s: entry(m.player1_id, m.player1_name), id: m.player1_id, car: m.p1_caramboles, beurten: m.p1_beurten, serie: m.p1_highest_serie, pts: m.p1_points },
      { s: entry(m.player2_id, m.player2_name), id: m.player2_id, car: m.p2_caramboles, beurten: m.p2_beurten, serie: m.p2_highest_serie, pts: m.p2_points },
    ];
    for (const { s, id, car, beurten, serie, pts } of sides) {
      s.played++;
      s.points += parseFloat(String(pts)) || 0;
      s.caramboles += car || 0;
      s.beurten += beurten || 0;
      s.highest_serie = Math.max(s.highest_serie, serie || 0);
      if (m.is_draw) s.draws++;
      else if (m.winner_id === id) s.wins++;
      else s.losses++;
    }
  }

  return Object.values(standings).sort(compareStandings);
}

// played_on komt binnen als 'YYYY-MM-DD' of ISO-string; alleen de datum telt.
export function eveningTitle(e: { name: string | null; played_on: string }) {
  const [y, m, d] = String(e.played_on).slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1, d).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return e.name ? `${e.name} (${date})` : date.charAt(0).toUpperCase() + date.slice(1);
}
