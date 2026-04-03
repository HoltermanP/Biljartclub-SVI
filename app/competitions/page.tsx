'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Competition {
  id: number;
  name: string;
  type: string;
  member_count: number;
  played_count: number;
  total_matches: number;
  created_at: string;
}

interface Member {
  id: number;
  name: string;
  moyenne: number;
}

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'single' | 'double'>('single');
  // selectedMoyennes: { memberId -> moyenne string }
  const [selectedMoyennes, setSelectedMoyennes] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedIds = Object.keys(selectedMoyennes).map(Number);

  async function load() {
    setLoading(true);
    const [compRes, memRes] = await Promise.all([
      fetch('/api/competitions'),
      fetch('/api/members'),
    ]);
    setCompetitions(await compRes.json());
    setMembers(await memRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openForm() {
    setFormName('');
    setFormType('single');
    setSelectedMoyennes({});
    setError('');
    setShowForm(true);
  }

  function toggleMember(member: Member) {
    setSelectedMoyennes((prev) => {
      if (prev[member.id] !== undefined) {
        const next = { ...prev };
        delete next[member.id];
        return next;
      }
      return { ...prev, [member.id]: String(parseFloat(String(member.moyenne)).toFixed(2)) };
    });
  }

  function setMoyenne(memberId: number, value: string) {
    setSelectedMoyennes((prev) => ({ ...prev, [memberId]: value }));
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Weet je zeker dat je "${name}" wilt verwijderen? Alle partijen worden ook verwijderd.`)) return;
    await fetch(`/api/competitions/${id}`, { method: 'DELETE' });
    load();
  }

  async function handleCreate() {
    if (!formName.trim()) { setError('Naam is verplicht.'); return; }
    if (selectedIds.length < 2) { setError('Selecteer minimaal 2 deelnemers.'); return; }
    for (const id of selectedIds) {
      const val = parseFloat(selectedMoyennes[id]);
      if (isNaN(val) || val <= 0) {
        const m = members.find((m) => m.id === id);
        setError(`Ongeldige moyenne voor ${m?.name ?? 'speler'}.`);
        return;
      }
    }
    setSaving(true);
    setError('');
    try {
      const memberMoyennes = selectedIds.map((id) => ({
        memberId: id,
        moyenne: parseFloat(selectedMoyennes[id]),
      }));
      const res = await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), type: formType, memberMoyennes }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Aanmaken mislukt.');
      } else {
        setShowForm(false);
        load();
      }
    } catch {
      setError('Verbindingsfout.');
    }
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ color: '#c9a84c' }}>Competities</h1>
        <button onClick={openForm}
          style={{ backgroundColor: '#c9a84c', color: '#0d2b1e', fontWeight: 700, padding: '0.5rem 1.25rem', borderRadius: '0.375rem' }}>
          + Nieuwe competitie
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'rgba(245,230,200,0.6)' }}>Laden...</p>
      ) : competitions.length === 0 ? (
        <div style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'rgba(245,230,200,0.6)' }}>Nog geen competities aangemaakt.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.75rem' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
                <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#c9a84c' }}>Naam</th>
                <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#c9a84c' }}>Type</th>
                <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#c9a84c' }}>Deelnemers</th>
                <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#c9a84c' }}>Voortgang</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {competitions.map((c) => {
                const pct = c.total_matches > 0 ? Math.round((c.played_count / c.total_matches) * 100) : 0;
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
                    <td className="px-4 py-3 font-semibold">{c.name}</td>
                    <td className="px-4 py-3">{c.type === 'single' ? 'Enkelvoudig' : 'Dubbel'}</td>
                    <td className="px-4 py-3">{c.member_count} spelers</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(201,168,76,0.2)', borderRadius: '3px' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#c9a84c', borderRadius: '3px' }} />
                        </div>
                        <span className="text-sm" style={{ color: 'rgba(245,230,200,0.7)', minWidth: '70px' }}>
                          {c.played_count}/{c.total_matches}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/competitions/${c.id}`} className="text-sm font-semibold hover:underline mr-4" style={{ color: '#c9a84c' }}>
                        Bekijken →
                      </Link>
                      <button onClick={() => handleDelete(c.id, c.name)}
                        className="text-xs hover:underline"
                        style={{ color: 'rgba(239,68,68,0.5)', marginLeft: '0.25rem' }}>
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '0.75rem', padding: '2rem', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#c9a84c' }}>Nieuwe competitie</h2>

            {error && <p className="mb-3 text-sm" style={{ color: '#ef4444' }}>{error}</p>}

            <div className="mb-4">
              <label>Naam</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Competitienaam"
                style={{ backgroundColor: '#0d2b1e', color: '#f5e6c8', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', width: '100%' }}
              />
            </div>

            <div className="mb-4">
              <label>Type</label>
              <div className="flex gap-3 mt-1">
                {(['single', 'double'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFormType(t)}
                    style={{
                      flex: 1, padding: '0.5rem', borderRadius: '0.375rem',
                      border: formType === t ? '2px solid #c9a84c' : '1px solid rgba(201,168,76,0.3)',
                      backgroundColor: formType === t ? 'rgba(201,168,76,0.15)' : 'transparent',
                      color: '#f5e6c8', fontWeight: formType === t ? 700 : 400,
                    }}>
                    {t === 'single' ? 'Enkelvoudig' : 'Dubbel (2 legs)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label>Deelnemers &amp; moyennes voor deze competitie ({selectedIds.length} geselecteerd)</label>
              {members.length === 0 ? (
                <p className="text-sm mt-1" style={{ color: 'rgba(245,230,200,0.6)' }}>
                  Geen leden beschikbaar. Voeg eerst leden toe.
                </p>
              ) : (
                <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                  {members.map((m) => {
                    const selected = selectedMoyennes[m.id] !== undefined;
                    return (
                      <div key={m.id}
                        style={{ backgroundColor: selected ? 'rgba(201,168,76,0.1)' : 'transparent', borderRadius: '0.375rem', padding: '0.4rem 0.5rem' }}
                        className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleMember(m)}
                          style={{ accentColor: '#c9a84c', width: '16px', height: '16px', flexShrink: 0 }}
                        />
                        <span className="flex-1">{m.name}</span>
                        {selected ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs" style={{ color: 'rgba(245,230,200,0.5)' }}>moy.</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={selectedMoyennes[m.id]}
                              onChange={(e) => setMoyenne(m.id, e.target.value)}
                              style={{
                                width: '72px', backgroundColor: '#0d2b1e', color: '#c9a84c',
                                border: '1px solid rgba(201,168,76,0.5)', borderRadius: '0.25rem',
                                padding: '0.2rem 0.4rem', fontWeight: 700, textAlign: 'right',
                              }}
                            />
                          </div>
                        ) : (
                          <span className="text-sm" style={{ color: 'rgba(245,230,200,0.4)' }}>
                            moy. {parseFloat(String(m.moyenne)).toFixed(2)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={handleCreate} disabled={saving}
                style={{ backgroundColor: '#c9a84c', color: '#0d2b1e', fontWeight: 700, padding: '0.5rem 1.25rem', borderRadius: '0.375rem', flex: 1 }}>
                {saving ? 'Aanmaken...' : 'Aanmaken'}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ backgroundColor: '#235e3f', color: '#f5e6c8', border: '1px solid rgba(201,168,76,0.3)', padding: '0.5rem 1.25rem', borderRadius: '0.375rem', flex: 1 }}>
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
