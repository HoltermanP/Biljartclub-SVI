import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();
    const competitions = await sql`
      SELECT c.*,
        COUNT(DISTINCT cm.member_id) as member_count,
        COUNT(DISTINCT CASE WHEN m.status='played' THEN m.id END) as played_count,
        COUNT(DISTINCT m.id) as total_matches
      FROM competitions c
      LEFT JOIN competition_members cm ON cm.competition_id = c.id
      LEFT JOIN matches m ON m.competition_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    return NextResponse.json(competitions);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // memberMoyennes: { memberId: number, moyenne: number }[]
    const { name, type, memberMoyennes } = await req.json();
    if (!name || !type || !memberMoyennes || memberMoyennes.length < 2) {
      return NextResponse.json(
        { error: 'Naam, type en minimaal 2 deelnemers zijn verplicht.' },
        { status: 400 }
      );
    }

    const sql = getDb();

    const compResult = await sql`
      INSERT INTO competitions (name, type) VALUES (${name.trim()}, ${type}) RETURNING *
    `;
    const competition = compResult[0];

    for (const { memberId, moyenne } of memberMoyennes) {
      await sql`
        INSERT INTO competition_members (competition_id, member_id, moyenne)
        VALUES (${competition.id}, ${memberId}, ${parseFloat(moyenne)})
      `;
    }

    const memberIds = memberMoyennes.map((m: { memberId: number }) => m.memberId);
    const legs = type === 'double' ? 2 : 1;
    for (let leg = 1; leg <= legs; leg++) {
      for (let i = 0; i < memberIds.length; i++) {
        for (let j = i + 1; j < memberIds.length; j++) {
          await sql`
            INSERT INTO matches (competition_id, player1_id, player2_id, leg, status)
            VALUES (${competition.id}, ${memberIds[i]}, ${memberIds[j]}, ${leg}, 'planned')
          `;
        }
      }
    }

    return NextResponse.json(competition, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
