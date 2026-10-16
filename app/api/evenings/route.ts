import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { computeEveningStandings, type EveningMatchRow } from '@/lib/evening';

export async function GET() {
  try {
    const sql = getDb();
    const [evenings, matches] = await Promise.all([
      sql`
        SELECT e.*, to_char(e.played_on, 'YYYY-MM-DD') as played_on,
          COUNT(m.id) as match_count,
          COUNT(CASE WHEN m.status='played' THEN 1 END) as played_count
        FROM evenings e
        LEFT JOIN matches m ON m.evening_id = e.id
        GROUP BY e.id
        ORDER BY e.played_on DESC, e.id DESC
      `,
      sql`
        SELECT m.*, p1.name as player1_name, p2.name as player2_name
        FROM matches m
        JOIN members p1 ON p1.id = m.player1_id
        JOIN members p2 ON p2.id = m.player2_id
        WHERE m.evening_id IS NOT NULL AND m.status = 'played'
      `,
    ]);

    // Beste speler per avond (bij een afgesloten avond: speler van de avond)
    const out = evenings.map((e) => {
      const best = computeEveningStandings(
        matches.filter((m) => m.evening_id === e.id) as unknown as EveningMatchRow[]
      )[0];
      return { ...e, best_player_name: best?.name ?? null };
    });
    // Totaalstand over alle gespeelde partijen van alle speelavonden
    const overall = computeEveningStandings(matches as unknown as EveningMatchRow[]);
    return NextResponse.json({ evenings: out, overall });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, playedOn } = await req.json();
    const sql = getDb();
    const result = await sql`
      INSERT INTO evenings (name, played_on)
      VALUES (${name?.trim() || null}, COALESCE(${playedOn || null}::date, CURRENT_DATE))
      RETURNING *
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
