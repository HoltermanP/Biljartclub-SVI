import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { playerId, turnNumber, caramboles } = await req.json();

    if (!playerId || turnNumber === undefined || caramboles === undefined) {
      return NextResponse.json({ error: 'playerId, turnNumber en caramboles zijn verplicht.' }, { status: 400 });
    }

    const sql = getDb();
    const matchId = parseInt(id);

    const result = await sql`
      INSERT INTO turns (match_id, player_id, turn_number, caramboles)
      VALUES (${matchId}, ${playerId}, ${turnNumber}, ${caramboles})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
