import type { EveningStanding } from '@/lib/evening';

const card = { backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.75rem' };
const muted = { color: 'rgba(245,230,200,0.55)' };

export function avg(s: { caramboles: number; beurten: number }) {
  return s.beurten > 0 ? (s.caramboles / s.beurten).toFixed(3) : '–';
}

export function avgPoints(s: EveningStanding) {
  return s.avg_points.toFixed(2);
}

// showEvenings: kolom met aantal avonden tonen (totaalstand over alle speelavonden)
export default function StandingsTable({ standings, showEvenings }: { standings: EveningStanding[]; showEvenings?: boolean }) {
  const headers = ['#', 'Naam', ...(showEvenings ? ['Avonden'] : []), 'Partijen', 'Gem. punten', 'Punten totaal', 'Caramboles', 'Hoogste serie', 'Gemiddelde', 'Gewonnen', 'Remise', 'Verloren'];
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
                <div className="text-xs" style={muted}>Gem. punten</div>
                <div className="text-lg font-bold tabular-nums" style={{ color: '#c9a84c' }}>{avgPoints(s)}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
              {showEvenings && <Stat label="Avonden" value={s.evenings} />}
              <Stat label="Partijen" value={s.played} />
              <Stat label="Punten totaal" value={Math.round(s.points)} />
              <Stat label="Caramboles" value={s.caramboles} />
              <Stat label="Hoogste serie" value={s.highest_serie} />
              <Stat label="Gemiddelde" value={avg(s)} />
              <Stat label="W / R / V" value={`${s.wins} / ${s.draws} / ${s.losses}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto" style={card}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
              {headers.map((h) => (
                <th key={h} className="text-left px-3 py-3 text-sm font-semibold whitespace-nowrap" style={{ color: '#c9a84c' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => (
              <tr key={s.member_id} style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
                <td className="px-3 py-3 text-sm font-bold" style={{ color: i === 0 ? '#c9a84c' : 'rgba(245,230,200,0.75)' }}>{i + 1}</td>
                <td className="px-3 py-3 text-sm font-semibold">{i === 0 && '🏆 '}{s.name}</td>
                {showEvenings && <td className="px-3 py-3 text-sm tabular-nums">{s.evenings}</td>}
                <td className="px-3 py-3 text-sm tabular-nums">{s.played}</td>
                <td className="px-3 py-3 text-sm font-bold tabular-nums" style={{ color: '#c9a84c' }}>{avgPoints(s)}</td>
                <td className="px-3 py-3 text-sm tabular-nums">{Math.round(s.points)}</td>
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
