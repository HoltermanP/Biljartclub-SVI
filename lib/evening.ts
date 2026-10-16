/**
 * Stand van een speelavond, of van alle speelavonden samen
 *
 * Volgorde (speler van de avond / totaalstand):
 *   1. gemiddeld aantal punten per partij (zo telt het aantal partijen niet mee)
 *   2. gemiddelde (caramboles / beurten)
 *   3. hoogste serie
 *   4. aantal gespeelde partijen
 *
 * Alleen afgeronde partijen tellen mee.
 */

export interface EveningMatchRow {
  evening_id?: number | null;
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
  evenings: number;
  points: number;
  avg_points: number;
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
    b.avg_points - a.avg_points ||
    average(b) - average(a) ||
    b.highest_serie - a.highest_serie ||
    b.played - a.played
  );
}

export function computeEveningStandings(matches: EveningMatchRow[]): EveningStanding[] {
  const standings: Record<number, EveningStanding> = {};
  const eveningsPlayed: Record<number, Set<number>> = {};
  const entry = (id: number, name: string) =>
    (standings[id] ??= {
      member_id: id, name, played: 0, evenings: 0, points: 0, avg_points: 0,
      caramboles: 0, beurten: 0, highest_serie: 0, wins: 0, draws: 0, losses: 0,
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
      if (m.evening_id != null) (eveningsPlayed[id] ??= new Set()).add(m.evening_id);
    }
  }

  const out = Object.values(standings);
  for (const s of out) {
    s.avg_points = s.played > 0 ? s.points / s.played : 0;
    s.evenings = eveningsPlayed[s.member_id]?.size ?? 0;
  }
  return out.sort(compareStandings);
}

// played_on komt binnen als 'YYYY-MM-DD' of ISO-string; alleen de datum telt.
export function eveningTitle(e: { name: string | null; played_on: string }) {
  const [y, m, d] = String(e.played_on).slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1, d).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return e.name ? `${e.name} (${date})` : date.charAt(0).toUpperCase() + date.slice(1);
}
