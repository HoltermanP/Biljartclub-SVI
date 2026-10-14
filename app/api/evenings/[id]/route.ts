import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { computeEveningStandings, type EveningMatchRow } from '@/lib/evening';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();
    const eveningId = parseInt(id);

    const eveningResult = await sql`SELECT *, to_char(played_on, 'YYYY-MM-DD') as played_on FROM evenings WHERE id=${eveningId}`;
    if (eveningResult.length === 0) {
      return NextResponse.json({ error: 'Speelavond niet gevonden.' }, { status: 404 });
    }

    const [matches, liveTurns, members] = await Promise.all([
      sql`
        SELECT m.*,
          p1.name as player1_name, m.p1_moyenne as player1_moyenne,
          p2.name as player2_name, m.p2_moyenne as player2_moyenne,
          w.name as winner_name
        FROM matches m
        JOIN members p1 ON p1.id = m.player1_id
        JOIN members p2 ON p2.id = m.player2_id
        LEFT JOIN members w ON w.id = m.winner_id
        WHERE m.evening_id = ${eveningId}
        ORDER BY m.id ASC
      `,
      // Tussenstand van partijen die nog bezig zijn
      sql`
        SELECT t.match_id, t.player_id,
          SUM(t.caramboles)::int as caramboles,
          COUNT(*)::int as beurten,
          MAX(t.caramboles)::int as highest_serie
        FROM turns t
        JOIN matches m ON m.id = t.match_id
        WHERE m.evening_id = ${eveningId} AND m.status <> 'played'
        GROUP BY t.match_id, t.player_id
      `,
      // Te maken caramboles uit de laatste competitie van de speler, anders uit ledenlijst
      sql`
        SELECT mb.id, mb.name,
          COALESCE(lc.moyenne, mb.moyenne) as moyenne,
          lc.competition_name
        FROM members mb
        LEFT JOIN LATERAL (
          SELECT cm.moyenne, c.name as competition_name
          FROM competition_members cm
          JOIN competitions c ON c.id = cm.competition_id
          WHERE cm.member_id = mb.id AND cm.moyenne IS NOT NULL
          ORDER BY c.created_at DESC, c.id DESC
          LIMIT 1
        ) lc ON true
        ORDER BY mb.name ASC
      `,
    ]);

    const matchesOut = matches.map((m) => {
      const live = (playerId: number) => liveTurns.find((t) => t.match_id === m.id && t.player_id === playerId) ?? null;
      return m.status === 'played' ? m : { ...m, live_p1: live(m.player1_id), live_p2: live(m.player2_id) };
    });

    return NextResponse.json({
      evening: eveningResult[0],
      matches: matchesOut,
      standings: computeEveningStandings(matches as unknown as EveningMatchRow[]),
      members: members.map((mb) => ({
        id: mb.id,
        name: mb.name,
        moyenne: parseFloat(String(mb.moyenne)) || 0,
        competition_name: mb.competition_name,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    if (status !== 'open' && status !== 'closed') {
      return NextResponse.json({ error: 'Ongeldige status.' }, { status: 400 });
    }
    const sql = getDb();
    const eveningId = parseInt(id);

    if (status === 'closed') {
      const open = await sql`SELECT id FROM matches WHERE evening_id=${eveningId} AND status <> 'played'`;
      if (open.length > 0) {
        return NextResponse.json(
          { error: 'Er zijn nog partijen niet afgerond. Speel ze uit of verwijder ze eerst.' },
          { status: 400 }
        );
      }
    }

    const result = await sql`UPDATE evenings SET status=${status} WHERE id=${eveningId} RETURNING *`;
    if (result.length === 0) {
      return NextResponse.json({ error: 'Speelavond niet gevonden.' }, { status: 404 });
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();
    await sql`DELETE FROM evenings WHERE id=${parseInt(id)}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
