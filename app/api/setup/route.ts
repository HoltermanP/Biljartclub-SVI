import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();

    await sql`
      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        moyenne DECIMAL(5,2) NOT NULL DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS competitions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('single', 'double')),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS competition_members (
        id SERIAL PRIMARY KEY,
        competition_id INTEGER REFERENCES competitions(id) ON DELETE CASCADE,
        member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
        moyenne DECIMAL(5,2),
        UNIQUE(competition_id, member_id)
      )
    `;

    // Voeg moyenne toe aan bestaande competition_members als die kolom ontbreekt
    await sql`
      ALTER TABLE competition_members ADD COLUMN IF NOT EXISTS moyenne DECIMAL(5,2)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        competition_id INTEGER REFERENCES competitions(id) ON DELETE CASCADE,
        player1_id INTEGER REFERENCES members(id),
        player2_id INTEGER REFERENCES members(id),
        leg INTEGER NOT NULL DEFAULT 1,
        status VARCHAR(10) DEFAULT 'planned' CHECK (status IN ('planned', 'played')),
        winner_id INTEGER REFERENCES members(id),
        is_draw BOOLEAN DEFAULT FALSE,
        played_at TIMESTAMP,
        p1_caramboles INTEGER DEFAULT 0,
        p1_beurten INTEGER DEFAULT 0,
        p1_highest_serie INTEGER DEFAULT 0,
        p1_points DECIMAL(8,2) DEFAULT 0,
        p1_above_moyenne BOOLEAN DEFAULT FALSE,
        p2_caramboles INTEGER DEFAULT 0,
        p2_beurten INTEGER DEFAULT 0,
        p2_highest_serie INTEGER DEFAULT 0,
        p2_points DECIMAL(8,2) DEFAULT 0,
        p2_above_moyenne BOOLEAN DEFAULT FALSE
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS turns (
        id SERIAL PRIMARY KEY,
        match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
        player_id INTEGER REFERENCES members(id),
        turn_number INTEGER NOT NULL,
        caramboles INTEGER NOT NULL DEFAULT 0
      )
    `;

    return NextResponse.json({ success: true, message: 'Schema aangemaakt.' });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
