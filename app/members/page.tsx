'use client';

import { useEffect, useState } from 'react';

interface Member {
  id: number;
  name: string;
  moyenne: number;
  created_at: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [formName, setFormName] = useState('');
  const [formMoyenne, setFormMoyenne] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadMembers() {
    setLoading(true);
    const res = await fetch('/api/members');
    const data = await res.json();
    setMembers(data);
    setLoading(false);
  }

  useEffect(() => { loadMembers(); }, []);

  function openAdd() {
    setEditMember(null);
    setFormName('');
    setFormMoyenne('');
    setError('');
    setShowForm(true);
  }

  function openEdit(member: Member) {
    setEditMember(member);
    setFormName(member.name);
    setFormMoyenne(String(member.moyenne));
    setError('');
    setShowForm(true);
  }

  async function handleSave() {
    if (!formName.trim() || !formMoyenne) {
      setError('Naam en moyenne zijn verplicht.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url = editMember ? `/api/members/${editMember.id}` : '/api/members';
      const method = editMember ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), moyenne: parseFloat(formMoyenne) }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Opslaan mislukt.');
      } else {
        setShowForm(false);
        loadMembers();
      }
    } catch {
      setError('Verbindingsfout.');
    }
    setSaving(false);
  }

  async function handleDelete(member: Member) {
    if (!confirm(`Weet je zeker dat je "${member.name}" wilt verwijderen?`)) return;
    await fetch(`/api/members/${member.id}`, { method: 'DELETE' });
    loadMembers();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ color: '#c9a84c' }}>Leden</h1>
        <button onClick={openAdd}
          style={{ backgroundColor: '#c9a84c', color: '#0d2b1e', fontWeight: 700, padding: '0.5rem 1.25rem', borderRadius: '0.375rem' }}>
          + Lid toevoegen
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'rgba(245,230,200,0.6)' }}>Laden...</p>
      ) : members.length === 0 ? (
        <div style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'rgba(245,230,200,0.6)' }}>Nog geen leden aangemaakt.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.75rem' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
                <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#c9a84c' }}>Naam</th>
                <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#c9a84c' }}>Moyenne</th>
                <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#c9a84c' }}>Lid sinds</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
                  <td className="px-4 py-3 font-semibold">{m.name}</td>
                  <td className="px-4 py-3" style={{ color: '#c9a84c' }}>{parseFloat(String(m.moyenne)).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'rgba(245,230,200,0.6)' }}>
                    {new Date(m.created_at).toLocaleDateString('nl-NL')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(m)} className="text-sm mr-3 hover:underline" style={{ color: '#c9a84c' }}>
                      Bewerken
                    </button>
                    <button onClick={() => handleDelete(m)} className="text-sm hover:underline" style={{ color: '#ef4444' }}>
                      Verwijderen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '0.75rem', padding: '2rem', width: '100%', maxWidth: '400px' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#c9a84c' }}>
              {editMember ? 'Lid bewerken' : 'Lid toevoegen'}
            </h2>

            {error && (
              <p className="mb-3 text-sm" style={{ color: '#ef4444' }}>{error}</p>
            )}

            <div className="mb-4">
              <label>Naam</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Naam van het lid"
                style={{ backgroundColor: '#0d2b1e', color: '#f5e6c8', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', width: '100%' }}
              />
            </div>
            <div className="mb-6">
              <label>Moyenne (te maken caramboles)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={formMoyenne}
                onChange={(e) => setFormMoyenne(e.target.value)}
                placeholder="bijv. 1.50"
                style={{ backgroundColor: '#0d2b1e', color: '#f5e6c8', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', width: '100%' }}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving}
                style={{ backgroundColor: '#c9a84c', color: '#0d2b1e', fontWeight: 700, padding: '0.5rem 1.25rem', borderRadius: '0.375rem', flex: 1 }}>
                {saving ? 'Opslaan...' : 'Opslaan'}
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
