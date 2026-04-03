import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculatePoints, determineWinner } from '@/lib/points';

export async function POST() {
  try {
    const sql = getDb();

    const matches = await sql`
      SELECT
        m.*,
        COALESCE(cm1.moyenne, p1.moyenne) as player1_moyenne,
        COALESCE(cm2.moyenne, p2.moyenne) as player2_moyenne
      FROM matches m
      JOIN members p1 ON p1.id = m.player1_id
      JOIN members p2 ON p2.id = m.player2_id
      LEFT JOIN competition_members cm1 ON cm1.member_id = m.player1_id AND cm1.competition_id = m.competition_id
      LEFT JOIN competition_members cm2 ON cm2.member_id = m.player2_id AND cm2.competition_id = m.competition_id
      WHERE m.status = 'played'
    `;

    let updated = 0;

    for (const match of matches) {
      const p1Moyenne = parseFloat(match.player1_moyenne);
      const p2Moyenne = parseFloat(match.player2_moyenne);
      const p1Caramboles = match.p1_caramboles ?? 0;
      const p2Caramboles = match.p2_caramboles ?? 0;
      const p1Beurten = match.p1_beurten ?? 0;
      const p2Beurten = match.p2_beurten ?? 0;

      const { winnerId, isDraw } = determineWinner(p1Caramboles, p1Moyenne, p2Caramboles, p2Moyenne);

      const p1Result = calculatePoints({
        caramboles: p1Caramboles,
        beurten: p1Beurten,
        moyenne: p1Moyenne,
        won: winnerId === 1,
        isDraw,
      });

      const p2Result = calculatePoints({
        caramboles: p2Caramboles,
        beurten: p2Beurten,
        moyenne: p2Moyenne,
        won: winnerId === 2,
        isDraw,
      });

      const actualWinnerId = isDraw ? null : winnerId === 1 ? match.player1_id : match.player2_id;

      await sql`
        UPDATE matches SET
          winner_id = ${actualWinnerId},
          is_draw = ${isDraw},
          p1_points = ${p1Result.total},
          p1_above_moyenne = ${p1Result.aboveMoyenne},
          p2_points = ${p2Result.total},
          p2_above_moyenne = ${p2Result.aboveMoyenne}
        WHERE id = ${match.id}
      `;

      updated++;
    }

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
