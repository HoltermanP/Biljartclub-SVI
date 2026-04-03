import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; turnId: string }> }
) {
  try {
    const { id, turnId } = await params;
    const { caramboles } = await req.json();

    if (caramboles === undefined) {
      return NextResponse.json({ error: 'caramboles is verplicht.' }, { status: 400 });
    }

    const sql = getDb();
    const matchId = parseInt(id);
    const tId = parseInt(turnId);

    const result = await sql`
      UPDATE turns SET caramboles=${caramboles} WHERE id=${tId} AND match_id=${matchId} RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Beurt niet gevonden.' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
