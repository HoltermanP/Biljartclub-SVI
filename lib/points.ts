/**
 * Puntensysteem Carambolebiljarten
 *
 * Basispunten: min(10, (C / N) × 10 ), afgerond op geheel getal
 *   C = aantal gemaakte caramboles
 *   N = te maken caramboles (= moyenne, zoals ingevoerd per speler)
 *
 * Bonussen (na afronding basispunten):
 *   + 2 punten bij winst
 *   + 1 punt  bij remise (beide spelers)
 *   + 3 punten als partijgemiddelde > persoonlijk gemiddelde
 *
 * Partijgemiddelde = totaal caramboles / 30 beurten
 */

export interface MatchResult {
  caramboles: number;
  beurten: number;
  moyenne: number; // te maken caramboles (N)
  won: boolean;
  isDraw: boolean;
}

export interface PointBreakdown {
  basePoints: number;
  winBonus: number;
  drawBonus: number;
  aboveMoyenneBonus: number;
  total: number;
  matchAverage: number;
  aboveMoyenne: boolean;
}

const BEURTEN_PER_MATCH = 30;

export function calculatePoints(result: MatchResult): PointBreakdown {
  const { caramboles, moyenne, won, isDraw } = result;

  // Partijgemiddelde = caramboles / 30 beurten
  const matchAverage = caramboles / BEURTEN_PER_MATCH;

  // Basispunten: (C / N) × 10, cap op 10, daarna afronden op geheel getal
  const rawBase = moyenne > 0 ? Math.min(10, (caramboles / moyenne) * 10) : 0;
  const basePoints = Math.round(rawBase);

  // Bonussen na afronding
  const winBonus = won ? 2 : 0;
  const drawBonus = isDraw ? 1 : 0;
  const aboveMoyenne = matchAverage > moyenne;
  const aboveMoyenneBonus = aboveMoyenne ? 3 : 0;

  const total = basePoints + winBonus + drawBonus + aboveMoyenneBonus;

  return {
    basePoints,
    winBonus,
    drawBonus,
    aboveMoyenneBonus,
    total,
    matchAverage: Math.round(matchAverage * 1000) / 1000,
    aboveMoyenne,
  };
}

export function determineWinner(
  p1Caramboles: number,
  p1Moyenne: number,
  p2Caramboles: number,
  p2Moyenne: number,
): { winnerId: 1 | 2 | null; isDraw: boolean } {
  const p1Ratio = p1Moyenne > 0 ? p1Caramboles / p1Moyenne : 0;
  const p2Ratio = p2Moyenne > 0 ? p2Caramboles / p2Moyenne : 0;
  if (p1Ratio === p2Ratio) {
    return { winnerId: null, isDraw: true };
  }
  return {
    winnerId: p1Ratio > p2Ratio ? 1 : 2,
    isDraw: false,
  };
}
