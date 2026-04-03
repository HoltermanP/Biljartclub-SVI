import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculatePoints, determineWinner } from '@/lib/points';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();
    const matchId = parseInt(id);

    const matchResult = await sql`
      SELECT m.*,
        COALESCE(cm1.moyenne, p1.moyenne) as player1_moyenne,
        COALESCE(cm2.moyenne, p2.moyenne) as player2_moyenne
      FROM matches m
      JOIN members p1 ON p1.id = m.player1_id
      JOIN members p2 ON p2.id = m.player2_id
      LEFT JOIN competition_members cm1 ON cm1.member_id = m.player1_id AND cm1.competition_id = m.competition_id
      LEFT JOIN competition_members cm2 ON cm2.member_id = m.player2_id AND cm2.competition_id = m.competition_id
      WHERE m.id = ${matchId}
    `;

    if (matchResult.length === 0) {
      return NextResponse.json({ error: 'Partij niet gevonden.' }, { status: 404 });
    }

    const match = matchResult[0];

    const turns = await sql`
      SELECT * FROM turns WHERE match_id=${matchId} ORDER BY turn_number ASC
    `;

    type TurnRow = { player_id: number; caramboles: number };
    const allTurns = turns as TurnRow[];
    const p1Turns = allTurns.filter((t) => t.player_id === match.player1_id);
    const p2Turns = allTurns.filter((t) => t.player_id === match.player2_id);

    const p1Caramboles = p1Turns.reduce((sum, t) => sum + t.caramboles, 0);
    const p2Caramboles = p2Turns.reduce((sum, t) => sum + t.caramboles, 0);

    const p1Beurten = p1Turns.length;
    const p2Beurten = p2Turns.length;

    const p1HighestSerie = p1Turns.length > 0 ? Math.max(...p1Turns.map((t) => t.caramboles)) : 0;
    const p2HighestSerie = p2Turns.length > 0 ? Math.max(...p2Turns.map((t) => t.caramboles)) : 0;

    const p1Moyenne = parseFloat(match.player1_moyenne);
    const p2Moyenne = parseFloat(match.player2_moyenne);
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

    const actualWinnerId = isDraw
      ? null
      : winnerId === 1
      ? match.player1_id
      : match.player2_id;

    await sql`
      UPDATE matches SET
        status='played',
        winner_id=${actualWinnerId},
        is_draw=${isDraw},
        played_at=NOW(),
        p1_caramboles=${p1Caramboles},
        p1_beurten=${p1Beurten},
        p1_highest_serie=${p1HighestSerie},
        p1_points=${p1Result.total},
        p1_above_moyenne=${p1Result.aboveMoyenne},
        p2_caramboles=${p2Caramboles},
        p2_beurten=${p2Beurten},
        p2_highest_serie=${p2HighestSerie},
        p2_points=${p2Result.total},
        p2_above_moyenne=${p2Result.aboveMoyenne}
      WHERE id=${matchId}
    `;

    return NextResponse.json({
      success: true,
      p1: { ...p1Result, caramboles: p1Caramboles, beurten: p1Beurten, highestSerie: p1HighestSerie },
      p2: { ...p2Result, caramboles: p2Caramboles, beurten: p2Beurten, highestSerie: p2HighestSerie },
      winnerId: actualWinnerId,
      isDraw,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
