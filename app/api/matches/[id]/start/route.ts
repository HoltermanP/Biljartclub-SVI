import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { startingPlayerId } = await req.json();

    if (!startingPlayerId) {
      return NextResponse.json({ error: 'Beginspeler is verplicht.' }, { status: 400 });
    }

    const sql = getDb();
    const matchId = parseInt(id);

    const matchResult = await sql`SELECT * FROM matches WHERE id=${matchId}`;
    if (matchResult.length === 0) {
      return NextResponse.json({ error: 'Partij niet gevonden.' }, { status: 404 });
    }

    const match = matchResult[0];
    if (match.status === 'played') {
      return NextResponse.json({ error: 'Partij is al gespeeld.' }, { status: 400 });
    }

    if (startingPlayerId !== match.player1_id && startingPlayerId !== match.player2_id) {
      return NextResponse.json({ error: 'Ongeldige beginspeler.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, matchId: match.id, startingPlayerId });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
