'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { eveningTitle, type EveningStanding } from '@/lib/evening';

interface LiveScore {
  caramboles: number;
  beurten: number;
  highest_serie: number;
}

interface EveningMatch {
  id: number;
  player1_id: number;
  player2_id: number;
  player1_name: string;
  player2_name: string;
  player1_moyenne: number | string;
  player2_moyenne: number | string;
  status: 'planned' | 'played';
  winner_id: number | null;
  winner_name: string | null;
  is_draw: boolean;
  p1_caramboles: number;
  p1_beurten: number;
  p1_highest_serie: number;
  p1_points: number | string;
  p2_caramboles: number;
  p2_beurten: number;
  p2_highest_serie: number;
  p2_points: number | string;
  live_p1?: LiveScore | null;
  live_p2?: LiveScore | null;
}

interface Member {
  id: number;
  name: string;
  moyenne: number;
  competition_name: string | null;
}

interface EveningData {
  evening: { id: number; name: string | null; played_on: string; status: 'open' | 'closed' };
  matches: EveningMatch[];
  standings: EveningStanding[];
  members: Member[];
}

const card = { backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.75rem' };
const muted = { color: 'rgba(245,230,200,0.55)' };
const inputStyle = { backgroundColor: '#0d2b1e', color: '#f5e6c8', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', width: '100%' };

function avg(s: { caramboles: number; beurten: number }) {
  return s.beurten > 0 ? (s.caramboles / s.beurten).toFixed(3) : '–';
}

export default function EveningPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<EveningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/evenings/${id}`);
    if (res.ok) {
      const d: EveningData = await res.json();
      setData(d);
      // Lege, open avond: meteen de eerste partij laten aanmaken
      if (d.matches.length === 0 && d.evening.status === 'open') setShowForm(true);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function setStatus(status: 'open' | 'closed') {
    if (status === 'closed' && !confirm('Avond afsluiten en de speler van de avond vaststellen?')) return;
    setError('');
    const res = await fetch(`/api/evenings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setError((await res.json()).error || 'Opslaan mislukt.');
      return;
    }
    load();
  }

  async function deleteMatch(m: EveningMatch) {
    if (!confirm(`Partij ${m.player1_name} – ${m.player2_name} verwijderen? Gemaakte beurten gaan verloren.`)) return;
    await fetch(`/api/matches/${m.id}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <p style={{ color: 'rgba(245,230,200,0.6)' }}>Laden...</p>;
  if (!data) return <p style={{ color: '#ef4444' }}>Speelavond niet gevonden.</p>;

  const { evening, matches, standings, members } = data;
  const isOpen = evening.status === 'open';
  const openMatches = matches.filter((m) => m.status !== 'played');
  const playedMatches = matches.filter((m) => m.status === 'played').reverse();
  const best = standings[0];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
          <Link href="/evenings" className="min-h-[44px] inline-flex items-center text-sm sm:text-base hover:underline shrink-0" style={{ color: 'rgba(245,230,200,0.6)' }}>← Speelavonden</Link>
          <span className="hidden sm:inline" style={{ color: 'rgba(245,230,200,0.3)' }}>/</span>
          <h1 className="text-xl sm:text-2xl font-bold break-words min-w-0" style={{ color: '#c9a84c' }}>{eveningTitle(evening)}</h1>
        </div>
        <div className="flex gap-2 shrink-0">
          {isOpen && (
            <button type="button" onClick={() => setShowForm(true)}
              className="min-h-[44px] flex-1 sm:flex-none"
              style={{ backgroundColor: '#c9a84c', color: '#0d2b1e', fontWeight: 700, padding: '0.5rem 1.25rem', borderRadius: '0.375rem' }}>
              + Nieuwe partij
            </button>
          )}
          <button type="button" onClick={() => setStatus(isOpen ? 'closed' : 'open')}
            className="min-h-[44px] flex-1 sm:flex-none"
            style={{ backgroundColor: '#235e3f', color: '#f5e6c8', border: '1px solid rgba(201,168,76,0.4)', fontWeight: 600, padding: '0.5rem 1.25rem', borderRadius: '0.375rem' }}>
            {isOpen ? 'Avond afsluiten' : 'Heropenen'}
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm" style={{ color: '#ef4444' }}>{error}</p>}

      {/* Beste speler / speler van de avond */}
      {best && (
        <div className="mb-6 text-center" style={{ ...card, border: '2px solid #c9a84c', padding: '1rem' }}>
          <div className="text-xs sm:text-sm uppercase tracking-widest mb-1" style={muted}>
            {isOpen ? 'Beste speler op dit moment' : 'Speler van de avond'}
          </div>
          <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#c9a84c' }}>🏆 {best.name}</div>
          <div className="text-sm" style={{ color: 'rgba(245,230,200,0.75)' }}>
            {Math.round(best.points)} punten · {best.caramboles} caramboles · hoogste serie {best.highest_serie} · gem. {avg(best)}
          </div>
        </div>
      )}

      {/* Lopende partijen */}
      {openMatches.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: '#c9a84c' }}>Bezig ({openMatches.length})</h2>
          <div className="space-y-3">
            {openMatches.map((m) => {
              const started = !!(m.live_p1 || m.live_p2);
              return (
                <div key={m.id} className="flex flex-col gap-3 sm:flex-row sm:items-center" style={{ ...card, padding: '1rem' }}>
                  <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
                    <LivePlayer name={m.player1_name} moyenne={m.player1_moyenne} live={m.live_p1} />
                    <span style={muted}>–</span>
                    <LivePlayer name={m.player2_name} moyenne={m.player2_moyenne} live={m.live_p2} />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => router.push(`/match/${m.id}`)}
                      className="min-h-[44px] flex-1 sm:flex-none rounded-md font-semibold px-5"
                      style={{ backgroundColor: '#c9a84c', color: '#0d2b1e' }}>
                      {started ? 'Verder spelen' : 'Starten'}
                    </button>
                    <button type="button" onClick={() => deleteMatch(m)}
                      className="min-h-[44px] min-w-[48px] rounded-md text-lg font-bold"
                      aria-label={`Partij ${m.player1_name} – ${m.player2_name} verwijderen`}
                      style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.85)', border: '1px solid rgba(239,68,68,0.35)' }}>
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Stand */}
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-3" style={{ color: '#c9a84c' }}>{isOpen ? 'Tussenstand' : 'Eindstand'}</h2>
        {standings.length === 0 ? (
          <div style={{ ...card, padding: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'rgba(245,230,200,0.6)' }}>Nog geen partijen afgerond.</p>
          </div>
        ) : (
          <StandingsTable standings={standings} />
        )}
        <p className="mt-2 text-xs" style={{ color: 'rgba(245,230,200,0.45)' }}>
          Volgorde: punten, dan caramboles, dan hoogste serie, dan gemiddelde.
        </p>
      </section>

      {/* Gespeelde partijen */}
      {playedMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: '#c9a84c' }}>Gespeeld ({playedMatches.length})</h2>
          <div className="space-y-2">
            {playedMatches.map((m) => (
              <button type="button" key={m.id} onClick={() => router.push(`/match/${m.id}`)}
                className="w-full text-left hover:opacity-90" style={{ ...card, padding: '0.75rem 1rem' }}>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                  <PlayedSide name={m.player1_name} car={m.p1_caramboles} pts={m.p1_points} serie={m.p1_highest_serie} won={m.winner_id === m.player1_id} />
                  <span className="text-xs" style={m.is_draw ? { color: '#facc15' } : muted}>{m.is_draw ? 'remise' : '–'}</span>
                  <PlayedSide name={m.player2_name} car={m.p2_caramboles} pts={m.p2_points} serie={m.p2_highest_serie} won={m.winner_id === m.player2_id} alignRight />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {showForm && (
        <NewMatchModal
          eveningId={evening.id}
          members={members}
          onClose={() => setShowForm(false)}
          onCreated={(matchId) => router.push(`/match/${matchId}`)}
        />
      )}
    </div>
  );
}

function LivePlayer({ name, moyenne, live }: { name: string; moyenne: number | string; live?: LiveScore | null }) {
  return (
    <div className="min-w-0">
      <div className="font-semibold break-words">{name}</div>
      <div className="text-2xl font-bold tabular-nums" style={{ color: '#c9a84c' }}>{live?.caramboles ?? 0}</div>
      <div className="text-xs" style={muted}>
        {live?.beurten ?? 0}/30 beurten · te maken {parseFloat(String(moyenne))}
      </div>
    </div>
  );
}

function PlayedSide({ name, car, pts, serie, won, alignRight }: { name: string; car: number; pts: number | string; serie: number; won: boolean; alignRight?: boolean }) {
  return (
    <div className={`min-w-0 ${alignRight ? 'text-right' : ''}`}>
      <div className="font-semibold break-words" style={{ color: won ? '#4ade80' : '#f5e6c8' }}>{won && '✓ '}{name}</div>
      <div className="text-xs tabular-nums" style={muted}>
        {car} car · serie {serie} · <span style={{ color: '#c9a84c', fontWeight: 700 }}>{Math.round(parseFloat(String(pts)) || 0)} pt</span>
      </div>
    </div>
  );
}

function StandingsTable({ standings }: { standings: EveningStanding[] }) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {standings.map((s, i) => (
          <div key={s.member_id} style={{ ...card, padding: '1rem' }}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0 flex-1">
                <span className="mr-2 inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded text-sm font-bold" style={{ backgroundColor: 'rgba(201,168,76,0.2)', color: i === 0 ? '#c9a84c' : 'rgba(245,230,200,0.75)' }}>
                  {i + 1}
                </span>
                <span className="font-semibold break-words">{s.name}</span>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs" style={muted}>Punten</div>
                <div className="text-lg font-bold tabular-nums" style={{ color: '#c9a84c' }}>{Math.round(s.points)}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
              <Stat label="Partijen" value={s.played} />
              <Stat label="Caramboles" value={s.caramboles} />
              <Stat label="Hoogste serie" value={s.highest_serie} />
              <Stat label="Gemiddelde" value={avg(s)} />
              <Stat label="W / R / V" value={`${s.wins} / ${s.draws} / ${s.losses}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block" style={card}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
              {['#', 'Naam', 'Partijen', 'Punten', 'Caramboles', 'Hoogste serie', 'Gemiddelde', 'Gewonnen', 'Remise', 'Verloren'].map((h) => (
                <th key={h} className="text-left px-3 py-3 text-sm font-semibold whitespace-nowrap" style={{ color: '#c9a84c' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => (
              <tr key={s.member_id} style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
                <td className="px-3 py-3 text-sm font-bold" style={{ color: i === 0 ? '#c9a84c' : 'rgba(245,230,200,0.75)' }}>{i + 1}</td>
                <td className="px-3 py-3 text-sm font-semibold">{i === 0 && '🏆 '}{s.name}</td>
                <td className="px-3 py-3 text-sm tabular-nums">{s.played}</td>
                <td className="px-3 py-3 text-sm font-bold tabular-nums" style={{ color: '#c9a84c' }}>{Math.round(s.points)}</td>
                <td className="px-3 py-3 text-sm tabular-nums">{s.caramboles}</td>
                <td className="px-3 py-3 text-sm tabular-nums">{s.highest_serie}</td>
                <td className="px-3 py-3 text-sm tabular-nums">{avg(s)}</td>
                <td className="px-3 py-3 text-sm tabular-nums" style={{ color: '#4ade80' }}>{s.wins}</td>
                <td className="px-3 py-3 text-sm tabular-nums" style={{ color: '#facc15' }}>{s.draws}</td>
                <td className="px-3 py-3 text-sm tabular-nums" style={{ color: '#f87171' }}>{s.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div style={muted}>{label}</div>
      <div className="tabular-nums">{value}</div>
    </div>
  );
}

function NewMatchModal({ eveningId, members, onClose, onCreated }: {
  eveningId: number;
  members: Member[];
  onClose: () => void;
  onCreated: (matchId: number) => void;
}) {
  const [players, setPlayers] = useState<[string, string]>(['', '']);
  const [moyennes, setMoyennes] = useState<[string, string]>(['', '']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function choose(slot: 0 | 1, memberId: string) {
    const m = members.find((x) => String(x.id) === memberId);
    setPlayers((prev) => (slot === 0 ? [memberId, prev[1]] : [prev[0], memberId]));
    setMoyennes((prev) => {
      const val = m ? String(parseFloat(m.moyenne.toFixed(2))) : '';
      return slot === 0 ? [val, prev[1]] : [prev[0], val];
    });
  }

  async function handleStart() {
    if (!players[0] || !players[1]) { setError('Kies twee spelers.'); return; }
    if (players[0] === players[1]) { setError('Kies twee verschillende spelers.'); return; }
    if (!(parseFloat(moyennes[0]) > 0) || !(parseFloat(moyennes[1]) > 0)) {
      setError('Vul bij beide spelers de te maken caramboles in.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/evenings/${eveningId}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1Id: parseInt(players[0]),
          player2Id: parseInt(players[1]),
          p1Moyenne: parseFloat(moyennes[0]),
          p2Moyenne: parseFloat(moyennes[1]),
        }),
      });
      if (!res.ok) {
        setError((await res.json()).error || 'Aanmaken mislukt.');
        setSaving(false);
        return;
      }
      onCreated((await res.json()).id);
    } catch {
      setError('Verbindingsfout.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full sm:max-w-[480px] max-h-[90dvh] overflow-y-auto rounded-t-xl sm:rounded-xl" style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.4)', padding: '1.25rem', paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
        <h2 className="text-xl font-bold mb-1" style={{ color: '#c9a84c' }}>Nieuwe partij</h2>
        <p className="text-sm mb-4" style={muted}>30 beurten. Te maken caramboles komen uit de laatste competitie van de speler en zijn aan te passen.</p>

        {error && <p className="mb-3 text-sm" style={{ color: '#ef4444' }}>{error}</p>}

        {([0, 1] as const).map((slot) => {
          const chosen = members.find((m) => String(m.id) === players[slot]);
          const otherId = players[slot === 0 ? 1 : 0];
          return (
            <div key={slot} className="mb-4">
              <label>Speler {slot + 1}</label>
              <div className="flex gap-2 mt-1">
                <select value={players[slot]} onChange={(e) => choose(slot, e.target.value)}
                  className="min-h-[44px] min-w-0 flex-1" style={inputStyle}>
                  <option value="">Kies speler…</option>
                  {members.filter((m) => String(m.id) !== otherId).map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <input type="number" inputMode="decimal" step="0.01" min="0.01"
                  aria-label={`Te maken caramboles speler ${slot + 1}`}
                  value={moyennes[slot]}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMoyennes((prev) => (slot === 0 ? [v, prev[1]] : [prev[0], v]));
                  }}
                  placeholder="car."
                  className="min-h-[44px]"
                  style={{ ...inputStyle, width: '88px', color: '#c9a84c', fontWeight: 700, textAlign: 'right' }} />
              </div>
              {chosen && (
                <p className="text-xs mt-1" style={{ color: 'rgba(245,230,200,0.45)' }}>
                  Te maken car. {chosen.competition_name ? `uit ${chosen.competition_name}` : 'uit ledenlijst'}: {parseFloat(chosen.moyenne.toFixed(2))}
                </p>
              )}
            </div>
          );
        })}

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
          <button type="button" onClick={onClose}
            className="min-h-[48px]"
            style={{ backgroundColor: '#235e3f', color: '#f5e6c8', border: '1px solid rgba(201,168,76,0.3)', padding: '0.5rem 1.25rem', borderRadius: '0.375rem', flex: 1 }}>
            Annuleren
          </button>
          <button type="button" onClick={handleStart} disabled={saving}
            className="min-h-[48px]"
            style={{ backgroundColor: '#c9a84c', color: '#0d2b1e', fontWeight: 700, padding: '0.5rem 1.25rem', borderRadius: '0.375rem', flex: 1 }}>
            {saving ? 'Starten...' : 'Partij starten'}
          </button>
        </div>
      </div>
    </div>
  );
}
