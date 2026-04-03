import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();
    const matchId = parseInt(id);

    const matchResult = await sql`
      SELECT
        m.*,
        p1.name as player1_name,
        COALESCE(cm1.moyenne, p1.moyenne) as player1_moyenne,
        p2.name as player2_name,
        COALESCE(cm2.moyenne, p2.moyenne) as player2_moyenne,
        w.name as winner_name
      FROM matches m
      JOIN members p1 ON p1.id = m.player1_id
      JOIN members p2 ON p2.id = m.player2_id
      LEFT JOIN competition_members cm1 ON cm1.member_id = m.player1_id AND cm1.competition_id = m.competition_id
      LEFT JOIN competition_members cm2 ON cm2.member_id = m.player2_id AND cm2.competition_id = m.competition_id
      LEFT JOIN members w ON w.id = m.winner_id
      WHERE m.id = ${matchId}
    `;

    if (matchResult.length === 0) {
      return NextResponse.json({ error: 'Partij niet gevonden.' }, { status: 404 });
    }

    const turns = await sql`
      SELECT t.*, m.name as player_name
      FROM turns t
      JOIN members m ON m.id = t.player_id
      WHERE t.match_id = ${matchId}
      ORDER BY t.turn_number ASC, t.player_id ASC
    `;

    return NextResponse.json({ match: matchResult[0], turns });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
