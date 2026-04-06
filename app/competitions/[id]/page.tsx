'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Standing {
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
}

interface Match {
  id: number;
  player1_id: number;
  player2_id: number;
  player1_name: string;
  player2_name: string;
  player1_moyenne: number;
  player2_moyenne: number;
  winner_id: number | null;
  winner_name: string | null;
  is_draw: boolean;
  status: 'planned' | 'played';
  leg: number;
  played_at: string | null;
  p1_caramboles: number;
  p1_beurten: number;
  p1_highest_serie: number;
  p1_points: number;
  p1_above_moyenne: boolean;
  p2_caramboles: number;
  p2_beurten: number;
  p2_highest_serie: number;
  p2_points: number;
  p2_above_moyenne: boolean;
}

interface CompetitionData {
  competition: { id: number; name: string; type: string };
  members: { id: number; name: string; moyenne: number }[];
  matches: Match[];
  standings: Standing[];
}

export default function CompetitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<CompetitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'standings' | 'played' | 'planned'>('standings');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/competitions/${id}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p style={{ color: 'rgba(245,230,200,0.6)' }}>Laden...</p>;
  if (!data) return <p style={{ color: '#ef4444' }}>Competitie niet gevonden.</p>;

  const { competition, matches, standings } = data;
  const playedMatches = matches.filter((m) => m.status === 'played');
  const plannedMatches = matches.filter((m) => m.status === 'planned');

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 mb-4 sm:mb-6 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
          <Link href="/competitions" className="min-h-[44px] inline-flex items-center text-sm sm:text-base hover:underline shrink-0" style={{ color: 'rgba(245,230,200,0.6)' }}>← Competities</Link>
          <span className="hidden sm:inline" style={{ color: 'rgba(245,230,200,0.3)' }}>/</span>
          <h1 className="text-xl sm:text-2xl font-bold break-words min-w-0" style={{ color: '#c9a84c' }}>{competition.name}</h1>
        </div>
        <span className="text-xs sm:text-sm px-2 py-1 rounded w-fit shrink-0" style={{ backgroundColor: 'rgba(201,168,76,0.2)', color: '#c9a84c' }}>
          {competition.type === 'single' ? 'Enkelvoudig' : 'Dubbel'}
        </span>
      </div>

      {/* Tabs — horizontaal scrollbaar op smalle schermen */}
      <div className="overflow-touch-x -mx-1 px-1 mb-4 sm:mb-6" style={{ borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
        <div className="flex gap-0 min-w-min pb-px">
        {([
          { key: 'standings', label: `Ranglijst` },
          { key: 'played', label: `Gespeeld (${playedMatches.length})` },
          { key: 'planned', label: `Te spelen (${plannedMatches.length})` },
        ] as const).map(({ key, label }) => (
          <button
            type="button"
            key={key}
            onClick={() => setTab(key)}
            className="min-h-[48px] shrink-0 px-3 sm:px-5 py-3 text-sm sm:text-base whitespace-nowrap"
            style={{
              fontWeight: tab === key ? 700 : 400,
              color: tab === key ? '#c9a84c' : 'rgba(245,230,200,0.6)',
              borderBottom: tab === key ? '2px solid #c9a84c' : '2px solid transparent',
              marginBottom: '-1px',
            }}>
            {label}
          </button>
        ))}
        </div>
      </div>

      {tab === 'standings' && <StandingsTab standings={standings} />}
      {tab === 'played' && <PlayedTab matches={playedMatches} />}
      {tab === 'planned' && <PlannedTab matches={plannedMatches} onStart={(matchId) => router.push(`/match/${matchId}`)} />}
    </div>
  );
}

function StandingsTab({ standings }: { standings: Standing[] }) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {standings.map((s, i) => {
          const avgCar = s.beurten > 0 ? (s.caramboles / s.beurten).toFixed(3) : '–';
          const avgPts = s.played > 0 ? (s.points / s.played).toFixed(2) : '–';
          return (
            <div
              key={s.member_id}
              style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <span className="mr-2 inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded text-sm font-bold" style={{ backgroundColor: 'rgba(201,168,76,0.2)', color: i === 0 ? '#c9a84c' : 'rgba(245,230,200,0.75)' }}>
                    {i + 1}
                  </span>
                  <span className="font-semibold break-words" style={{ color: '#f5e6c8' }}>{s.name}</span>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs" style={{ color: 'rgba(245,230,200,0.5)' }}>Punten</div>
                  <div className="text-lg font-bold tabular-nums" style={{ color: '#c9a84c' }}>{s.points.toFixed(2)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm sm:grid-cols-3">
                <div>
                  <div style={{ color: 'rgba(245,230,200,0.55)' }}>Partijen</div>
                  <div className="font-medium tabular-nums">{s.played}</div>
                </div>
                <div>
                  <div style={{ color: 'rgba(245,230,200,0.55)' }}>Gem. punten</div>
                  <div className="tabular-nums">{avgPts}</div>
                </div>
                <div>
                  <div style={{ color: 'rgba(245,230,200,0.55)' }}>Gem. car.</div>
                  <div className="tabular-nums">{avgCar}</div>
                </div>
                <div>
                  <div style={{ color: '#4ade80' }}>Winst</div>
                  <div className="tabular-nums font-medium" style={{ color: '#4ade80' }}>{s.wins}</div>
                </div>
                <div>
                  <div style={{ color: '#facc15' }}>Remise</div>
                  <div className="tabular-nums font-medium" style={{ color: '#facc15' }}>{s.draws}</div>
                </div>
                <div>
                  <div style={{ color: '#f87171' }}>Verlies</div>
                  <div className="tabular-nums font-medium" style={{ color: '#f87171' }}>{s.losses}</div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div style={{ color: 'rgba(245,230,200,0.55)' }}>Hoogste serie</div>
                  <div className="tabular-nums">{s.highest_serie}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block rounded-xl" style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.75rem' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
              {['#', 'Naam', 'Partijen', 'Punten', 'Gem. punten', 'Gem. caramboles', 'Gewonnen', 'Remise', 'Verloren', 'Hoogste serie'].map((h) => (
                <th key={h} className="text-left px-3 py-3 text-sm font-semibold whitespace-nowrap" style={{ color: '#c9a84c' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const avgCar = s.beurten > 0 ? (s.caramboles / s.beurten).toFixed(3) : '–';
              const avgPts = s.played > 0 ? (s.points / s.played).toFixed(2) : '–';
              return (
                <tr key={s.member_id} style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
                  <td className="px-3 py-3 text-sm font-bold" style={{ color: i === 0 ? '#c9a84c' : 'rgba(245,230,200,0.6)' }}>{i + 1}</td>
                  <td className="px-3 py-3 font-semibold text-sm">{s.name}</td>
                  <td className="px-3 py-3 text-sm">{s.played}</td>
                  <td className="px-3 py-3 text-sm font-bold whitespace-nowrap" style={{ color: '#c9a84c' }}>{s.points.toFixed(2)}</td>
                  <td className="px-3 py-3 text-sm">{avgPts}</td>
                  <td className="px-3 py-3 text-sm">{avgCar}</td>
                  <td className="px-3 py-3 text-sm" style={{ color: '#4ade80' }}>{s.wins}</td>
                  <td className="px-3 py-3 text-sm" style={{ color: '#facc15' }}>{s.draws}</td>
                  <td className="px-3 py-3 text-sm" style={{ color: '#f87171' }}>{s.losses}</td>
                  <td className="px-3 py-3 text-sm">{s.highest_serie}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PlayedTab({ matches }: { matches: Match[] }) {
  if (matches.length === 0) {
    return <p style={{ color: 'rgba(245,230,200,0.6)' }}>Nog geen partijen gespeeld.</p>;
  }
  return (
    <div className="space-y-4">
      {matches.map((m) => <PlayedMatchCard key={m.id} match={m} />)}
    </div>
  );
}

function PlayedMatchCard({ match: m }: { match: Match }) {
  const p1Avg = m.p1_beurten > 0 ? (m.p1_caramboles / m.p1_beurten).toFixed(3) : '–';
  const p2Avg = m.p2_beurten > 0 ? (m.p2_caramboles / m.p2_beurten).toFixed(3) : '–';

  function ptBreakdown(caramboles: number, moyenne: number, won: boolean, isDraw: boolean, aboveMoyenne: boolean) {
    const base = moyenne > 0 ? (caramboles * 10) / moyenne : 0;
    const parts = [`${base.toFixed(2)} basis`];
    if (won) parts.push('+2 winst');
    if (isDraw) parts.push('+1 remise');
    if (aboveMoyenne) parts.push('+3 boven gem.');
    return parts.join(', ');
  }

  return (
    <div style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {m.leg > 1 && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,168,76,0.2)', color: '#c9a84c' }}>Leg {m.leg}</span>}
          {m.is_draw ? (
            <span className="text-sm font-bold" style={{ color: '#facc15' }}>Remise</span>
          ) : (
            <span className="text-sm font-bold" style={{ color: '#4ade80' }}>Winst: {m.winner_name}</span>
          )}
        </div>
        <span className="text-xs" style={{ color: 'rgba(245,230,200,0.5)' }}>
          {m.played_at ? new Date(m.played_at).toLocaleDateString('nl-NL') : ''}
        </span>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {[
          {
            name: m.player1_name, ball: '⚪', caramboles: m.p1_caramboles, beurten: m.p1_beurten,
            avg: p1Avg, serie: m.p1_highest_serie, points: m.p1_points,
            above: m.p1_above_moyenne, won: m.winner_id === m.player1_id, isDraw: m.is_draw,
            moyenne: m.player1_moyenne,
          },
          {
            name: m.player2_name, ball: '🟡', caramboles: m.p2_caramboles, beurten: m.p2_beurten,
            avg: p2Avg, serie: m.p2_highest_serie, points: m.p2_points,
            above: m.p2_above_moyenne, won: m.winner_id === m.player2_id, isDraw: m.is_draw,
            moyenne: m.player2_moyenne,
          },
        ].map((p) => (
          <div key={p.name} style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', padding: '0.75rem' }}>
            <div className="flex items-center gap-2 mb-2">
              <span>{p.ball}</span>
              <span className="font-semibold">{p.name}</span>
              {p.won && <span className="text-xs" style={{ color: '#4ade80' }}>✓ Gewonnen</span>}
              {p.isDraw && !p.won && <span className="text-xs" style={{ color: '#facc15' }}>= Remise</span>}
            </div>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <div style={{ color: 'rgba(245,230,200,0.6)' }}>Caramboles:</div>
              <div className="font-bold" style={{ color: '#c9a84c' }}>{p.caramboles}</div>
              <div style={{ color: 'rgba(245,230,200,0.6)' }}>Beurten:</div>
              <div>{p.beurten}</div>
              <div style={{ color: 'rgba(245,230,200,0.6)' }}>Gem.:</div>
              <div>{p.avg} {p.above && <span style={{ color: '#4ade80' }}>↑</span>}</div>
              <div style={{ color: 'rgba(245,230,200,0.6)' }}>Hoogste serie:</div>
              <div>{p.serie}</div>
              <div style={{ color: 'rgba(245,230,200,0.6)' }}>Punten:</div>
              <div className="font-bold" style={{ color: '#c9a84c' }}>{parseFloat(String(p.points)).toFixed(2)}</div>
            </div>
            <div className="mt-2 text-xs" style={{ color: 'rgba(245,230,200,0.5)' }}>
              {ptBreakdown(p.caramboles, p.moyenne, p.won, p.isDraw, p.above)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlannedTab({ matches, onStart }: { matches: Match[]; onStart: (id: number) => void }) {
  if (matches.length === 0) {
    return <p style={{ color: 'rgba(245,230,200,0.6)' }}>Alle partijen zijn gespeeld!</p>;
  }
  return (
    <>
      {/* Kaarten op smalle schermen */}
      <div className="space-y-3 md:hidden">
        {matches.map((m) => (
          <div
            key={m.id}
            style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
            <div className="text-sm font-semibold mb-2 break-words">
              <span>⚪ {m.player1_name}</span>
              <span className="block text-xs font-normal mt-0.5" style={{ color: 'rgba(245,230,200,0.5)' }}>
                moy. {parseFloat(String(m.player1_moyenne)).toFixed(2)}
              </span>
            </div>
            <div className="text-center text-xs py-1" style={{ color: 'rgba(245,230,200,0.4)' }}>tegen</div>
            <div className="text-sm font-semibold mb-3 break-words">
              <span>🟡 {m.player2_name}</span>
              <span className="block text-xs font-normal mt-0.5" style={{ color: 'rgba(245,230,200,0.5)' }}>
                moy. {parseFloat(String(m.player2_moyenne)).toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onStart(m.id)}
              className="w-full min-h-[48px]"
              style={{ backgroundColor: '#c9a84c', color: '#0d2b1e', fontWeight: 700, padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.9375rem' }}>
              Start partij
            </button>
          </div>
        ))}
      </div>

      <div className="hidden md:block rounded-xl" style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.75rem' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
              <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#c9a84c' }}>Speler 1</th>
              <th className="text-center px-4 py-3 text-sm font-semibold" style={{ color: '#c9a84c' }}>vs</th>
              <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#c9a84c' }}>Speler 2</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id} style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
                <td className="px-4 py-3">
                  ⚪ {m.player1_name}
                  <span className="ml-2 text-sm" style={{ color: 'rgba(245,230,200,0.5)' }}>
                    (moy. {parseFloat(String(m.player1_moyenne)).toFixed(2)})
                  </span>
                </td>
                <td className="px-4 py-3 text-center" style={{ color: 'rgba(245,230,200,0.4)' }}>vs</td>
                <td className="px-4 py-3">
                  🟡 {m.player2_name}
                  <span className="ml-2 text-sm" style={{ color: 'rgba(245,230,200,0.5)' }}>
                    (moy. {parseFloat(String(m.player2_moyenne)).toFixed(2)})
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onStart(m.id)}
                    className="min-h-[44px] min-w-[44px] sm:min-w-0 inline-flex items-center justify-center"
                    style={{ backgroundColor: '#c9a84c', color: '#0d2b1e', fontWeight: 700, padding: '0.4rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                    Start partij
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
