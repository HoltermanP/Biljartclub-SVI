import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();
    const members = await sql`SELECT * FROM members ORDER BY name ASC`;
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, moyenne } = await req.json();
    if (!name || moyenne === undefined) {
      return NextResponse.json({ error: 'Naam en moyenne zijn verplicht.' }, { status: 400 });
    }
    const sql = getDb();
    const result = await sql`
      INSERT INTO members (name, moyenne) VALUES (${name.trim()}, ${parseFloat(moyenne)}) RETURNING *
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
