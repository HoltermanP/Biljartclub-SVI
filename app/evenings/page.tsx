'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { eveningTitle, type EveningStanding } from '@/lib/evening';
import StandingsTable from '@/app/components/StandingsTable';

interface Evening {
  id: number;
  name: string | null;
  played_on: string;
  status: 'open' | 'closed';
  match_count: number;
  played_count: number;
  best_player_name: string | null;
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function EveningsPage() {
  const router = useRouter();
  const [evenings, setEvenings] = useState<Evening[]>([]);
  const [overall, setOverall] = useState<EveningStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState(todayIso());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/evenings');
    if (res.ok) {
      const d = await res.json();
      setEvenings(d.evenings);
      setOverall(d.overall);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openForm() {
    setFormName('');
    setFormDate(todayIso());
    setError('');
    setShowForm(true);
  }

  async function handleCreate() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/evenings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), playedOn: formDate }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Aanmaken mislukt.');
        setSaving(false);
        return;
      }
      const evening = await res.json();
      router.push(`/evenings/${evening.id}`);
    } catch {
      setError('Verbindingsfout.');
      setSaving(false);
    }
  }

  async function handleDelete(e: Evening) {
    if (!confirm(`Weet je zeker dat je "${eveningTitle(e)}" wilt verwijderen? Alle partijen van deze avond worden ook verwijderd.`)) return;
    await fetch(`/api/evenings/${e.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#c9a84c' }}>Speelavonden</h1>
        <button type="button" onClick={openForm}
          className="min-h-[44px] w-full sm:w-auto shrink-0"
          style={{ backgroundColor: '#c9a84c', color: '#0d2b1e', fontWeight: 700, padding: '0.5rem 1.25rem', borderRadius: '0.375rem' }}>
          + Nieuwe speelavond
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'rgba(245,230,200,0.6)' }}>Laden...</p>
      ) : evenings.length === 0 ? (
        <div style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'rgba(245,230,200,0.6)' }}>Nog geen speelavonden. Start een nieuwe avond en maak de eerste partij aan.</p>
        </div>
      ) : (
        <>
        {overall.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-3" style={{ color: '#c9a84c' }}>Totaalstand alle speelavonden</h2>
            <StandingsTable standings={overall} showEvenings />
            <p className="mt-2 text-xs" style={{ color: 'rgba(245,230,200,0.45)' }}>
              Alle afgeronde partijen tellen mee. Volgorde: gemiddeld aantal punten per partij, dan gemiddelde, dan hoogste serie.
            </p>
          </section>
        )}
        <h2 className="text-lg font-bold mb-3" style={{ color: '#c9a84c' }}>Avonden</h2>
        <div className="space-y-3">
          {evenings.map((e) => (
            <div key={e.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
              style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold break-words" style={{ color: '#f5e6c8' }}>{eveningTitle(e)}</span>
                  <span className="text-xs px-2 py-0.5 rounded"
                    style={e.status === 'open'
                      ? { backgroundColor: 'rgba(74,222,128,0.15)', color: '#4ade80' }
                      : { backgroundColor: 'rgba(201,168,76,0.2)', color: '#c9a84c' }}>
                    {e.status === 'open' ? 'Bezig' : 'Afgesloten'}
                  </span>
                </div>
                <div className="text-sm" style={{ color: 'rgba(245,230,200,0.65)' }}>
                  {e.played_count} van {e.match_count} partijen gespeeld
                  {e.best_player_name && (
                    <> · {e.status === 'closed' ? 'Speler van de avond' : 'Beste speler nu'}: <span style={{ color: '#c9a84c', fontWeight: 600 }}>{e.best_player_name}</span></>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href={`/evenings/${e.id}`}
                  className="flex min-h-[44px] flex-1 sm:flex-none items-center justify-center rounded-md font-semibold px-5 hover:opacity-90"
                  style={{ backgroundColor: '#c9a84c', color: '#0d2b1e' }}>
                  {e.status === 'open' ? 'Verder' : 'Bekijken'}
                </Link>
                <button type="button" onClick={() => handleDelete(e)}
                  className="min-h-[44px] min-w-[48px] rounded-md text-lg font-bold hover:opacity-90"
                  aria-label={`Speelavond ${eveningTitle(e)} verwijderen`}
                  style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.85)', border: '1px solid rgba(239,68,68,0.35)' }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full sm:max-w-[440px] rounded-t-xl sm:rounded-xl" style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.4)', padding: '1.25rem', paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#c9a84c' }}>Nieuwe speelavond</h2>

            {error && <p className="mb-3 text-sm" style={{ color: '#ef4444' }}>{error}</p>}

            <div className="mb-4">
              <label>Datum</label>
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                style={{ backgroundColor: '#0d2b1e', color: '#f5e6c8', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', width: '100%', colorScheme: 'dark' }} />
            </div>

            <div className="mb-6">
              <label>Naam (optioneel)</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                placeholder="Bijv. Clubavond"
                style={{ backgroundColor: '#0d2b1e', color: '#f5e6c8', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', width: '100%' }} />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="min-h-[48px]"
                style={{ backgroundColor: '#235e3f', color: '#f5e6c8', border: '1px solid rgba(201,168,76,0.3)', padding: '0.5rem 1.25rem', borderRadius: '0.375rem', flex: 1 }}>
                Annuleren
              </button>
              <button type="button" onClick={handleCreate} disabled={saving}
                className="min-h-[48px]"
                style={{ backgroundColor: '#c9a84c', color: '#0d2b1e', fontWeight: 700, padding: '0.5rem 1.25rem', borderRadius: '0.375rem', flex: 1 }}>
                {saving ? 'Aanmaken...' : 'Avond starten'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
