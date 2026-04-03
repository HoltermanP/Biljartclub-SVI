import Link from 'next/link';
import { getDb } from '@/lib/db';

async function getStats() {
  try {
    const sql = getDb();
    const [members, competitions] = await Promise.all([
      sql`SELECT id FROM members`,
      sql`
        SELECT c.id, c.name, c.type,
          COUNT(DISTINCT cm.member_id) as member_count,
          COUNT(DISTINCT CASE WHEN m.status='played' THEN m.id END) as played_count,
          COUNT(DISTINCT m.id) as total_matches
        FROM competitions c
        LEFT JOIN competition_members cm ON cm.competition_id = c.id
        LEFT JOIN matches m ON m.competition_id = c.id
        GROUP BY c.id
        ORDER BY c.id DESC
      `,
    ]);
    const totalPlayed = competitions.reduce(
      (sum: number, c: Record<string, unknown>) => sum + (parseInt(String(c.played_count)) || 0),
      0
    );
    return { memberCount: members.length, competitionCount: competitions.length, totalPlayed, competitions };
  } catch {
    return { memberCount: 0, competitionCount: 0, totalPlayed: 0, competitions: [] };
  }
}

export default async function Dashboard() {
  const stats = await getStats();

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2" style={{ color: '#c9a84c' }}>
          Biljartclub SVI
        </h1>
        <p style={{ color: 'rgba(245,230,200,0.7)' }}>Carambolebiljarten &mdash; Competitiemanagement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Leden" value={stats.memberCount} icon="👤" href="/members" />
        <StatCard label="Competities" value={stats.competitionCount} icon="🏆" href="/competitions" />
        <StatCard label="Gespeelde partijen" value={stats.totalPlayed} icon="🎱" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NavCard
          title="Ledenbeheer"
          description="Bekijk, voeg toe of bewerk clubleden en hun moyennes."
          href="/members"
          icon="👤"
        />
        <NavCard
          title="Competities"
          description="Beheer competities, bekijk ranglijsten en gespeelde partijen."
          href="/competitions"
          icon="🏆"
        />
      </div>

      {stats.competitions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#c9a84c' }}>Recente competities</h2>
          <div style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.75rem' }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
                  <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#c9a84c' }}>Naam</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#c9a84c' }}>Type</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#c9a84c' }}>Deelnemers</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#c9a84c' }}>Partijen</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {stats.competitions.slice(0, 5).map((c: {
                  id: number; name: string; type: string;
                  member_count: number; played_count: number; total_matches: number
                }) => (
                  <tr key={c.id} style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
                    <td className="px-4 py-3">{c.name}</td>
                    <td className="px-4 py-3">{c.type === 'single' ? 'Enkelvoudig' : 'Dubbel'}</td>
                    <td className="px-4 py-3">{c.member_count}</td>
                    <td className="px-4 py-3">{c.played_count}/{c.total_matches}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/competitions/${c.id}`} className="text-sm font-semibold hover:underline" style={{ color: '#c9a84c' }}>
                        Bekijken →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, href }: { label: string; value: number; icon: string; href?: string }) {
  const content = (
    <div style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.75rem', padding: '1.5rem' }} className="text-center">
      <div className="text-3xl mb-1">{icon}</div>
      <div className="text-4xl font-bold mb-1" style={{ color: '#c9a84c' }}>{value}</div>
      <div style={{ color: 'rgba(245,230,200,0.7)' }}>{label}</div>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function NavCard({ title, description, href, icon }: { title: string; description: string; href: string; icon: string }) {
  return (
    <Link href={href} style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.75rem', padding: '1.5rem', display: 'block' }}
      className="transition-colors hover:opacity-90">
      <div className="text-2xl mb-2">{icon}</div>
      <h2 className="text-xl font-bold mb-1" style={{ color: '#c9a84c' }}>{title}</h2>
      <p style={{ color: 'rgba(245,230,200,0.7)' }}>{description}</p>
    </Link>
  );
}
