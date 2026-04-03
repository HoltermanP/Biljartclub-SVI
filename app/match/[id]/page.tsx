'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface MatchData {
  id: number;
  competition_id: number;
  player1_id: number;
  player2_id: number;
  player1_name: string;
  player2_name: string;
  player1_moyenne: number;
  player2_moyenne: number;
  status: string;
  winner_id: number | null;
  winner_name: string | null;
  is_draw: boolean;
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

interface Turn {
  id: number;
  player_id: number;
  turn_number: number;
  caramboles: number;
  player_name: string;
}

type Phase = 'choose_start' | 'playing' | 'finished';

interface PlayerState {
  id: number;
  name: string;
  moyenne: number;
  ball: string;
  totalCaramboles: number;
  beurten: number;
  highestSerie: number;
  currentBeurtCaramboles: number;
}

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [match, setMatch] = useState<MatchData | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>('choose_start');

  // Game state
  const [startingPlayerId, setStartingPlayerId] = useState<number | null>(null);
  const [activePlayerId, setActivePlayerId] = useState<number | null>(null);
  const [p1State, setP1State] = useState<PlayerState | null>(null);
  const [p2State, setP2State] = useState<PlayerState | null>(null);
  const [p1TurnCount, setP1TurnCount] = useState(0);
  const [p2TurnCount, setP2TurnCount] = useState(0);

  // Correction modal
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionTurns, setCorrectionTurns] = useState<Turn[]>([]);
  const [correctionValues, setCorrectionValues] = useState<Record<number, number>>({});

  // Finish result
  const [finishResult, setFinishResult] = useState<{
    p1: { caramboles: number; beurten: number; highestSerie: number; matchAverage: number; total: number; basePoints: number; winBonus: number; drawBonus: number; aboveMoyenneBonus: number; aboveMoyenne: boolean };
    p2: { caramboles: number; beurten: number; highestSerie: number; matchAverage: number; total: number; basePoints: number; winBonus: number; drawBonus: number; aboveMoyenneBonus: number; aboveMoyenne: boolean };
    winnerId: number | null;
    isDraw: boolean;
  } | null>(null);

  const MAX_TURNS = 30;

  const load = useCallback(async () => {
    const res = await fetch(`/api/matches/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setMatch(data.match);
    setTurns(data.turns);
    setLoading(false);

    if (data.match.status === 'played') {
      setPhase('finished');
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Initialize player states from match (balls worden pas toegewezen na startkeuze)
  useEffect(() => {
    if (!match) return;
    setP1State({
      id: match.player1_id,
      name: match.player1_name,
      moyenne: parseFloat(String(match.player1_moyenne)),
      ball: '⚪',
      totalCaramboles: 0,
      beurten: 0,
      highestSerie: 0,
      currentBeurtCaramboles: 0,
    });
    setP2State({
      id: match.player2_id,
      name: match.player2_name,
      moyenne: parseFloat(String(match.player2_moyenne)),
      ball: '🟡',
      totalCaramboles: 0,
      beurten: 0,
      highestSerie: 0,
      currentBeurtCaramboles: 0,
    });
  }, [match]);


  function handleChooseStart(playerId: number) {
    if (!match) return;
    setStartingPlayerId(playerId);
    setActivePlayerId(playerId);

    // Beginspeler wordt speler 1 (⚪, links), de ander speler 2 (🟡, rechts)
    const starter = playerId === match.player1_id
      ? { id: match.player1_id, name: match.player1_name, moyenne: parseFloat(String(match.player1_moyenne)) }
      : { id: match.player2_id, name: match.player2_name, moyenne: parseFloat(String(match.player2_moyenne)) };
    const other = playerId === match.player1_id
      ? { id: match.player2_id, name: match.player2_name, moyenne: parseFloat(String(match.player2_moyenne)) }
      : { id: match.player1_id, name: match.player1_name, moyenne: parseFloat(String(match.player1_moyenne)) };

    setP1State({ ...starter, ball: '⚪', totalCaramboles: 0, beurten: 0, highestSerie: 0, currentBeurtCaramboles: 0 });
    setP2State({ ...other, ball: '🟡', totalCaramboles: 0, beurten: 0, highestSerie: 0, currentBeurtCaramboles: 0 });
    setPhase('playing');
  }

  // Alles op display-volgorde: p1State = beginspeler (⚪), p2State = tweede speler (🟡)
  const isActiveDisplayP1 = activePlayerId === p1State?.id;
  const activeState = isActiveDisplayP1 ? p1State : p2State;
  const setActiveState = isActiveDisplayP1 ? setP1State : setP2State;
  const activeTurnCount = isActiveDisplayP1 ? p1TurnCount : p2TurnCount;
  const otherTurnCount = isActiveDisplayP1 ? p2TurnCount : p1TurnCount;

  function addCarambole() {
    setActiveState((prev) => prev ? { ...prev, currentBeurtCaramboles: prev.currentBeurtCaramboles + 1 } : prev);
  }

  function removeCarambole() {
    setActiveState((prev) => prev
      ? { ...prev, currentBeurtCaramboles: Math.max(0, prev.currentBeurtCaramboles - 1) }
      : prev);
  }

  async function finishTurn() {
    if (!activeState || !p1State || !p2State || !match) return;
    const turnNumber = activeTurnCount + 1;
    const caramboles = activeState.currentBeurtCaramboles;

    const res = await fetch(`/api/matches/${id}/turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: activeState.id, turnNumber, caramboles }),
    });
    if (!res.ok) return;
    const savedTurn = await res.json();
    setTurns((prev) => [...prev, savedTurn]);

    const newCurrCount = activeTurnCount + 1;
    setActiveState((prev) => prev ? {
      ...prev,
      totalCaramboles: prev.totalCaramboles + caramboles,
      highestSerie: Math.max(prev.highestSerie, caramboles),
      beurten: newCurrCount,
      currentBeurtCaramboles: 0,
    } : prev);
    if (isActiveDisplayP1) setP1TurnCount(newCurrCount); else setP2TurnCount(newCurrCount);

    // Check game over (beide spelers 30 beurten)
    const totalP1 = isActiveDisplayP1 ? newCurrCount : p1TurnCount;
    const totalP2 = isActiveDisplayP1 ? p2TurnCount : newCurrCount;
    if (totalP1 >= MAX_TURNS && totalP2 >= MAX_TURNS) {
      await finishMatch();
      return;
    }

    // Wissel naar de andere speler als die nog beurten heeft
    const otherState = isActiveDisplayP1 ? p2State : p1State;
    if (otherTurnCount < MAX_TURNS) {
      setActivePlayerId(otherState.id);
    }
    // Anders blijft de actieve speler aan de beurt (de andere is al klaar)
  }

  async function finishMatch() {
    const res = await fetch(`/api/matches/${id}/finish`, { method: 'POST' });
    if (!res.ok) return;
    const result = await res.json();
    setFinishResult(result);
    setPhase('finished');
  }

  function openCorrection() {
    if (!activeState) return;
    const activeTurns = turns.filter((t) => t.player_id === activeState.id);
    setCorrectionTurns(activeTurns);
    const vals: Record<number, number> = {};
    activeTurns.forEach((t) => { vals[t.id] = t.caramboles; });
    setCorrectionValues(vals);
    setShowCorrection(true);
  }

  async function saveCorrection(turnId: number) {
    const newVal = correctionValues[turnId];
    const res = await fetch(`/api/matches/${id}/turn/${turnId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caramboles: newVal }),
    });
    if (res.ok) {
      setTurns((prev) => prev.map((t) => t.id === turnId ? { ...t, caramboles: newVal } : t));
    }
    setShowCorrection(false);
  }

  // Rondenummer = voltooide rondes + 1 (ronde = beide spelers hebben gespeeld)
  const roundNumber = Math.min(p1TurnCount, p2TurnCount) + 1;
  // Toon "laatste beurt" zodra beide spelers 29 beurten hebben (= ronde 30 gestart)
  const showLastTurnWarning = phase === 'playing' && roundNumber === MAX_TURNS;

  if (loading) return <p style={{ color: 'rgba(245,230,200,0.6)' }}>Laden...</p>;
  if (!match) return <p style={{ color: '#ef4444' }}>Partij niet gevonden.</p>;

  // PHASE: Choose starting player
  if (phase === 'choose_start') {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: '#c9a84c' }}>Partij starten</h1>
        <p className="text-center mb-2" style={{ color: 'rgba(245,230,200,0.7)' }}>Wie begint?</p>
        <p className="text-center mb-6 text-sm" style={{ color: 'rgba(245,230,200,0.5)' }}>
          De beginspeler speelt met ⚪ (wit)
        </p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: match.player1_id, name: match.player1_name },
            { id: match.player2_id, name: match.player2_name },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => handleChooseStart(p.id)}
              style={{
                backgroundColor: '#1a4731',
                border: '2px solid rgba(201,168,76,0.4)',
                borderRadius: '0.75rem',
                padding: '2rem 1rem',
                textAlign: 'center',
                cursor: 'pointer',
              }}
              className="hover:border-yellow-500 transition-colors">
              <div className="text-5xl mb-3">🎱</div>
              <div className="text-xl font-bold" style={{ color: '#f5e6c8' }}>{p.name}</div>
              <div className="text-sm mt-2" style={{ color: 'rgba(245,230,200,0.5)' }}>Tik om te beginnen</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // PHASE: Finished
  if (phase === 'finished') {
    const p1 = match.status === 'played' ? {
      caramboles: match.p1_caramboles,
      beurten: match.p1_beurten,
      highestSerie: match.p1_highest_serie,
      points: match.p1_points,
      aboveMoyenne: match.p1_above_moyenne,
    } : finishResult?.p1 ? {
      caramboles: finishResult.p1.caramboles,
      beurten: finishResult.p1.beurten,
      highestSerie: finishResult.p1.highestSerie,
      points: finishResult.p1.total,
      aboveMoyenne: finishResult.p1.aboveMoyenne,
    } : null;

    const p2 = match.status === 'played' ? {
      caramboles: match.p2_caramboles,
      beurten: match.p2_beurten,
      highestSerie: match.p2_highest_serie,
      points: match.p2_points,
      aboveMoyenne: match.p2_above_moyenne,
    } : finishResult?.p2 ? {
      caramboles: finishResult.p2.caramboles,
      beurten: finishResult.p2.beurten,
      highestSerie: finishResult.p2.highestSerie,
      points: finishResult.p2.total,
      aboveMoyenne: finishResult.p2.aboveMoyenne,
    } : null;

    const isDraw = match.status === 'played' ? match.is_draw : finishResult?.isDraw ?? false;
    const winnerId = match.status === 'played' ? match.winner_id : finishResult?.winnerId ?? null;
    const winnerName = match.status === 'played' ? match.winner_name : (
      winnerId === match.player1_id ? match.player1_name : match.player2_name
    );

    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: '#c9a84c' }}>Partij afgelopen</h1>
        <div className="text-center mb-6">
          {isDraw ? (
            <span className="text-xl font-bold" style={{ color: '#facc15' }}>Remise!</span>
          ) : (
            <span className="text-xl font-bold" style={{ color: '#4ade80' }}>Winnaar: {winnerName}</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { player: { id: match.player1_id, name: match.player1_name, ball: '⚪', moyenne: parseFloat(String(match.player1_moyenne)) }, stats: p1, won: winnerId === match.player1_id, fr: finishResult?.p1 },
            { player: { id: match.player2_id, name: match.player2_name, ball: '🟡', moyenne: parseFloat(String(match.player2_moyenne)) }, stats: p2, won: winnerId === match.player2_id, fr: finishResult?.p2 },
          ].map(({ player, stats, won, fr }) => (
            <div key={player.id} style={{ backgroundColor: '#1a4731', border: `2px solid ${won ? '#4ade80' : isDraw ? '#facc15' : 'rgba(201,168,76,0.3)'}`, borderRadius: '0.75rem', padding: '1rem' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{player.ball}</span>
                <span className="font-bold text-lg">{player.name}</span>
                {won && <span style={{ color: '#4ade80' }}>✓</span>}
              </div>
              {stats && (
                <div className="space-y-1 text-sm">
                  <Row label="Caramboles" value={stats.caramboles} gold />
                  <Row label="Te maken (moy.)" value={player.moyenne.toFixed(2)} />
                  <Row label="Beurten" value={stats.beurten} />
                  <Row label="Gem." value={stats.beurten > 0 ? (stats.caramboles / stats.beurten).toFixed(3) : '–'} />
                  <Row label="Hoogste serie" value={stats.highestSerie} />
                  <Row label="Punten" value={parseFloat(String(stats.points)).toFixed(2)} gold />
                  {stats.aboveMoyenne && <div style={{ color: '#4ade80', marginTop: '0.25rem' }}>↑ Boven moyenne gespeeld</div>}
                  {fr && (
                    <div className="mt-2 pt-2 text-xs" style={{ borderTop: '1px solid rgba(201,168,76,0.2)', color: 'rgba(245,230,200,0.6)' }}>
                      {fr.basePoints.toFixed(2)} basis
                      {fr.winBonus > 0 && ` +${fr.winBonus} winst`}
                      {fr.drawBonus > 0 && ` +${fr.drawBonus} remise`}
                      {fr.aboveMoyenneBonus > 0 && ` +${fr.aboveMoyenneBonus} boven gem.`}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push(`/competitions/${match.competition_id}`)}
            style={{ backgroundColor: '#c9a84c', color: '#0d2b1e', fontWeight: 700, padding: '0.75rem 2rem', borderRadius: '0.375rem', fontSize: '1rem' }}>
            ← Terug naar competitie
          </button>
        </div>
      </div>
    );
  }

  // PHASE: Playing
  if (!p1State || !p2State || !activeState) return null;

  const p1Avg = p1State.beurten > 0 ? (p1State.totalCaramboles / p1State.beurten) : 0;
  const p2Avg = p2State.beurten > 0 ? (p2State.totalCaramboles / p2State.beurten) : 0;
  // Rondenummer al berekend boven, cappen op MAX_TURNS
  const currentTurnNumber = Math.min(roundNumber, MAX_TURNS);

  return (
    <div>
      {/* Last turn warning */}
      {showLastTurnWarning && (
        <div className="text-center py-2 px-4 mb-4 rounded font-bold text-lg" style={{ backgroundColor: '#b45309', color: '#fef3c7' }}>
          ⚠️ LAATSTE BEURT!
        </div>
      )}

      {/* Scoreboard grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { state: p1State, avg: p1Avg, isActive: activePlayerId === p1State.id, turnCount: p1TurnCount },
          { state: p2State, avg: p2Avg, isActive: activePlayerId === p2State.id, turnCount: p2TurnCount },
        ].map(({ state, avg, isActive, turnCount }) => (
          <div
            key={state.id}
            style={{
              backgroundColor: '#1a4731',
              border: `2px solid ${isActive ? '#c9a84c' : 'rgba(201,168,76,0.2)'}`,
              borderRadius: '0.75rem',
              padding: '1rem',
              opacity: isActive ? 1 : 0.7,
            }}>
            {/* Active indicator ball */}
            {isActive && (
              <div className="text-center text-4xl mb-2">{state.ball}</div>
            )}

            <div className="font-bold text-center mb-2" style={{ color: isActive ? '#c9a84c' : '#f5e6c8', fontSize: isActive ? '1.125rem' : '1rem' }}>
              {state.name}
            </div>

            {/* Big caramboles count */}
            <div className="text-center mb-2">
              <span className="font-bold" style={{ fontSize: isActive ? '3rem' : '2rem', color: '#c9a84c', lineHeight: 1 }}>
                {state.totalCaramboles}
              </span>
              {isActive && state.currentBeurtCaramboles > 0 && (
                <span className="ml-2 text-xl font-bold" style={{ color: '#4ade80' }}>
                  +{state.currentBeurtCaramboles}
                </span>
              )}
            </div>

            <div className="text-sm space-y-1" style={{ color: 'rgba(245,230,200,0.8)' }}>
              <div className="flex justify-between">
                <span>Gem.</span>
                <span>{avg.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span>Moyenne</span>
                <span style={{ color: '#c9a84c' }}>{state.moyenne.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>H. serie</span>
                <span>{state.highestSerie}</span>
              </div>
            </div>

            {/* Current beurt counter */}
            {isActive && (
              <div className="mt-3 text-center">
                <div className="text-xs mb-1" style={{ color: 'rgba(245,230,200,0.6)' }}>Huidige beurt</div>
                <div className="text-3xl font-bold" style={{ color: '#4ade80' }}>
                  {state.currentBeurtCaramboles}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Beurtnummer groot in het midden */}
      <div className="text-center my-3">
        <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(245,230,200,0.5)' }}>Beurt</div>
        <div style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1, color: '#c9a84c' }}>
          {currentTurnNumber}
        </div>
        <div className="text-sm mt-1" style={{ color: 'rgba(245,230,200,0.4)' }}>van {MAX_TURNS}</div>
      </div>

      {/* Controls */}
      <div style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
        <div className="text-center mb-1 text-sm" style={{ color: 'rgba(245,230,200,0.6)' }}>
          {activeState.name} aan de beurt
        </div>

        {/* +1 / teller / -1 */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={removeCarambole}
            style={{
              backgroundColor: '#235e3f',
              border: '2px solid rgba(201,168,76,0.5)',
              borderRadius: '0.75rem',
              padding: '1rem',
              fontSize: '2rem',
              fontWeight: 700,
              color: 'rgba(201,168,76,0.7)',
              cursor: 'pointer',
              width: '72px',
              flexShrink: 0,
            }}>
            −
          </button>
          <button
            onClick={addCarambole}
            style={{
              flex: 1,
              backgroundColor: '#235e3f',
              border: '2px solid #c9a84c',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              fontSize: '3rem',
              fontWeight: 700,
              color: '#c9a84c',
              cursor: 'pointer',
            }}>
            + {activeState.currentBeurtCaramboles}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={finishTurn}
            style={{
              backgroundColor: '#c9a84c',
              color: '#0d2b1e',
              fontWeight: 700,
              padding: '0.75rem',
              borderRadius: '0.5rem',
              fontSize: '1rem',
            }}>
            Beurt afsluiten →
          </button>
          <button
            onClick={openCorrection}
            style={{
              backgroundColor: '#235e3f',
              color: '#f5e6c8',
              border: '1px solid rgba(201,168,76,0.4)',
              fontWeight: 600,
              padding: '0.75rem',
              borderRadius: '0.5rem',
              fontSize: '1rem',
            }}>
            Correctie
          </button>
        </div>
      </div>

      {/* Correction modal */}
      {showCorrection && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div style={{ backgroundColor: '#1a4731', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '0.75rem', padding: '1.5rem', width: '100%', maxWidth: '380px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#c9a84c' }}>
              Correctie — {activeState.name}
            </h2>
            {correctionTurns.length === 0 ? (
              <p style={{ color: 'rgba(245,230,200,0.6)' }}>Nog geen beurten gespeeld.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {correctionTurns.map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <span className="text-sm w-16" style={{ color: 'rgba(245,230,200,0.6)' }}>Beurt {t.turn_number}</span>
                    <input
                      type="number"
                      min="0"
                      value={correctionValues[t.id] ?? t.caramboles}
                      onChange={(e) => setCorrectionValues((prev) => ({ ...prev, [t.id]: parseInt(e.target.value) || 0 }))}
                      style={{ width: '80px', backgroundColor: '#0d2b1e', color: '#f5e6c8', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '0.375rem', padding: '0.25rem 0.5rem' }}
                    />
                    <button
                      onClick={() => saveCorrection(t.id)}
                      style={{ backgroundColor: '#c9a84c', color: '#0d2b1e', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                      Opslaan
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowCorrection(false)}
              style={{ backgroundColor: '#235e3f', color: '#f5e6c8', border: '1px solid rgba(201,168,76,0.3)', padding: '0.5rem 1rem', borderRadius: '0.375rem', width: '100%' }}>
              Sluiten
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, gold }: { label: string; value: string | number; gold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: 'rgba(245,230,200,0.6)' }}>{label}:</span>
      <span style={gold ? { color: '#c9a84c', fontWeight: 700 } : {}}>{value}</span>
    </div>
  );
}
