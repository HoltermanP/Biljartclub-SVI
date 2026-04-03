import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();
    const compId = parseInt(id);

    const compResult = await sql`SELECT * FROM competitions WHERE id=${compId}`;
    if (compResult.length === 0) {
      return NextResponse.json({ error: 'Competitie niet gevonden.' }, { status: 404 });
    }
    const competition = compResult[0];

    // Haal leden op met competitie-moyenne (fallback naar globale membre-moyenne)
    const members = await sql`
      SELECT m.*, COALESCE(cm.moyenne, m.moyenne) as comp_moyenne
      FROM members m
      JOIN competition_members cm ON cm.member_id = m.id
      WHERE cm.competition_id = ${compId}
      ORDER BY m.name ASC
    `;

    const matches = await sql`
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
      WHERE m.competition_id = ${compId}
      ORDER BY m.leg ASC, m.id ASC
    `;

    // Ranglijst berekenen
    const standings: Record<number, {
      member_id: number;
      name: string;
      played: number;
      points: number;
      caramboles: number;
      beurten: number;
      wins: number;
      draws: number;
      losses: number;
      highest_serie: number;
    }> = {};

    for (const member of members) {
      standings[member.id] = {
        member_id: member.id,
        name: member.name,
        played: 0,
        points: 0,
        caramboles: 0,
        beurten: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        highest_serie: 0,
      };
    }

    for (const match of matches) {
      if (match.status !== 'played') continue;

      const p1 = standings[match.player1_id];
      const p2 = standings[match.player2_id];
      if (!p1 || !p2) continue;

      p1.played++;
      p2.played++;

      p1.points += parseFloat(match.p1_points) || 0;
      p2.points += parseFloat(match.p2_points) || 0;

      p1.caramboles += match.p1_caramboles || 0;
      p2.caramboles += match.p2_caramboles || 0;

      p1.beurten += match.p1_beurten || 0;
      p2.beurten += match.p2_beurten || 0;

      if (match.p1_highest_serie > p1.highest_serie) p1.highest_serie = match.p1_highest_serie;
      if (match.p2_highest_serie > p2.highest_serie) p2.highest_serie = match.p2_highest_serie;

      if (match.is_draw) {
        p1.draws++;
        p2.draws++;
      } else if (match.winner_id === match.player1_id) {
        p1.wins++;
        p2.losses++;
      } else if (match.winner_id === match.player2_id) {
        p2.wins++;
        p1.losses++;
      }
    }

    const standingsList = Object.values(standings).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aAvg = a.beurten > 0 ? a.caramboles / a.beurten : 0;
      const bAvg = b.beurten > 0 ? b.caramboles / b.beurten : 0;
      return bAvg - aAvg;
    });

    return NextResponse.json({ competition, members, matches, standings: standingsList });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();
    await sql`DELETE FROM competitions WHERE id=${parseInt(id)}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
