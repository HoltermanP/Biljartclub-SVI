import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, moyenne } = await req.json();
    if (!name || moyenne === undefined) {
      return NextResponse.json({ error: 'Naam en moyenne zijn verplicht.' }, { status: 400 });
    }
    const sql = getDb();
    const memberId = parseInt(id);
    const result = await sql`
      UPDATE members SET name=${name.trim()}, moyenne=${parseFloat(moyenne)} WHERE id=${memberId} RETURNING *
    `;
    if (result.length === 0) {
      return NextResponse.json({ error: 'Lid niet gevonden.' }, { status: 404 });
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
    const memberId = parseInt(id);
    await sql`DELETE FROM members WHERE id=${memberId}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
