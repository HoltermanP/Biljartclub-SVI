import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { player1Id, player2Id, p1Moyenne, p2Moyenne } = await req.json();
    const p1 = parseFloat(p1Moyenne);
    const p2 = parseFloat(p2Moyenne);

    if (!player1Id || !player2Id || player1Id === player2Id) {
      return NextResponse.json({ error: 'Kies twee verschillende spelers.' }, { status: 400 });
    }
    if (!(p1 > 0) || !(p2 > 0)) {
      return NextResponse.json({ error: 'Te maken caramboles moet groter dan 0 zijn.' }, { status: 400 });
    }

    const sql = getDb();
    const eveningId = parseInt(id);

    const evening = await sql`SELECT status FROM evenings WHERE id=${eveningId}`;
    if (evening.length === 0) {
      return NextResponse.json({ error: 'Speelavond niet gevonden.' }, { status: 404 });
    }
    if (evening[0].status === 'closed') {
      return NextResponse.json({ error: 'Deze speelavond is afgesloten.' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO matches (evening_id, player1_id, player2_id, p1_moyenne, p2_moyenne, status)
      VALUES (${eveningId}, ${player1Id}, ${player2Id}, ${p1}, ${p2}, 'planned')
      RETURNING *
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
