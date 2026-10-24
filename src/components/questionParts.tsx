import { useEffect, useRef, useState } from 'react';
import type { AnswerOption, ProgramDef, QuestionVisual, RobotCmd } from '../types/game';
import { CMD_ICON, CMD_LABEL, encodeProgram, runProgram } from '../game/systems/robotProgram';
import { audio } from '../game/systems/AudioManager';

// Части карточки задания для второй главы: последовательности, энергия,
// карта маршрута, дорожка робота, «расставь по порядку» и «составь программу».

/** Дорожка робота: клетки пола, ямы и флажок цели. */
export function Track({ track, robot, falling }: { track: string; robot: number; falling?: boolean }) {
  return (
    <div className="track" data-testid="robot-track">
      {[...track].map((c, i) => (
        <div key={i} className={`cell ${c === '_' ? 'pit' : 'floor'}`}>
          {c === 'G' && <span className="cell-goal">🚩</span>}
          {i === robot && <span className={`cell-robot ${falling ? 'falling' : ''}`}>🤖</span>}
        </div>
      ))}
    </div>
  );
}

export function SequenceVisual({ items }: { items: string[] }) {
  return (
    <div className="seq" data-testid="q-visual">
      {items.map((it, i) => (
        <span key={i} className="seq-item">
          {it}
        </span>
      ))}
      <span className="seq-item seq-q">?</span>
    </div>
  );
}

const ENERGY_COLORS = ['#FF8A3D', '#5B8CFF', '#B054E8'];

/** Ячейки энергии: потраченные окрашены по шагам, оставшиеся светятся. */
export function EnergyVisual({ total, steps }: { total: number; steps: { label: string; amount: number }[] }) {
  const cells: (number | null)[] = [];
  steps.forEach((s, si) => {
    for (let k = 0; k < s.amount; k++) cells.push(si);
  });
  while (cells.length < total) cells.push(null);
  return (
    <div className="energy" data-testid="q-visual">
      <div className="energy-bar">
        {cells.map((c, i) => (
          <i
            key={i}
            className={c === null ? 'left' : 'spent'}
            style={c === null ? undefined : { background: ENERGY_COLORS[c % ENERGY_COLORS.length] }}
          >
            ⚡
          </i>
        ))}
      </div>
      <div className="energy-legend">
        <span>
          Было: <b>{total}</b>
        </span>
        {steps.map((s, i) => (
          <span key={i} style={{ color: ENERGY_COLORS[i % ENERGY_COLORS.length] }}>
            {s.label}: <b>{s.amount}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

const GRID_ICON: Record<string, string> = { S: '🏝️', G: '🏁', '#': '⛈️', '.': '' };

export function GridVisual({ rows }: { rows: string[] }) {
  return (
    <div className="grid-map" data-testid="q-visual" style={{ gridTemplateColumns: `repeat(${rows[0].length}, 1fr)` }}>
      {rows.flatMap((row, r) =>
        [...row].map((c, k) => (
          <div key={`${r}-${k}`} className={`grid-cell ${c === '#' ? 'storm' : ''}`}>
            {GRID_ICON[c] ?? ''}
          </div>
        )),
      )}
    </div>
  );
}

export function ExtraVisual({ v }: { v: QuestionVisual }) {
  switch (v.kind) {
    case 'sequence':
      return <SequenceVisual items={v.items} />;
    case 'energy':
      return <EnergyVisual total={v.total} steps={v.steps} />;
    case 'grid':
      return <GridVisual rows={v.rows} />;
    case 'code':
      return <Track track={v.track} robot={v.track.indexOf('R')} />;
    default:
      return null;
  }
}

// ---------- Расставь по порядку ----------

/**
 * Ребёнок нажимает карточки по очереди. Верный следующий шаг встаёт в слот,
 * неверный — подсказка, и можно пробовать снова (уже поставленное не сбрасывается).
 */
export function OrderBoard({
  options,
  order,
  solved,
  onAnswer,
}: {
  options: AnswerOption[];
  order: string[];
  solved: boolean;
  onAnswer: (answer: string) => boolean;
}) {
  const [placed, setPlaced] = useState<string[]>([]);
  const [shakes, setShakes] = useState(0);
  const byId = (id: string) => options.find((o) => o.id === id);

  const pick = (id: string) => {
    if (solved || placed.includes(id)) return;
    const next = [...placed, id];
    const isPrefix = next.every((v, i) => order[i] === v);
    if (!isPrefix) {
      onAnswer(next.join(','));
      setShakes((n) => n + 1);
      return;
    }
    audio.play('pop');
    setPlaced(next);
    if (next.length === order.length) onAnswer(next.join(','));
  };

  return (
    <div className="order-board">
      <div className="order-slots">
        {order.map((_, i) => {
          const o = placed[i] ? byId(placed[i]) : undefined;
          return (
            <div key={i} className={`order-slot ${o ? 'filled' : ''}`} data-testid={`slot-${i}`}>
              <span className="order-num">{i + 1}</span>
              {o && (
                <>
                  <span className="q-opt-emoji">{o.emoji}</span>
                  {o.label && <span className="order-label">{o.label}</span>}
                </>
              )}
            </div>
          );
        })}
      </div>
      <div key={shakes} className={`q-options ${shakes ? 'shaking' : ''}`}>
        {options.map((o) => (
          <button
            key={o.id}
            className={`q-option has-emoji ${placed.includes(o.id) ? 'used' : ''}`}
            data-testid={`option-${o.id}`}
            disabled={placed.includes(o.id) || solved}
            onClick={() => pick(o.id)}
          >
            <span className="q-opt-emoji">{o.emoji}</span>
            {o.label && <span className="q-opt-label small">{o.label}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Составь программу ----------

export function ProgramBoard({
  program,
  solved,
  onAnswer,
}: {
  program: ProgramDef;
  solved: boolean;
  onAnswer: (answer: string) => boolean;
}) {
  const start = program.track.indexOf('R');
  const [cmds, setCmds] = useState<RobotCmd[]>([]);
  const [robot, setRobot] = useState(start);
  const [falling, setFalling] = useState(false);
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const add = (c: RobotCmd) => {
    if (running || solved || cmds.length >= program.slots) return;
    audio.play('click');
    setCmds([...cmds, c]);
  };
  const removeAt = (i: number) => {
    if (running || solved) return;
    setCmds(cmds.filter((_, k) => k !== i));
  };

  const run = () => {
    if (running || solved || cmds.length === 0) return;
    setRunning(true);
    setFalling(false);
    setRobot(start);
    const res = runProgram(program.track, cmds);
    res.steps.forEach((st, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setRobot(Math.min(st.to, program.track.length - 1));
          audio.play(st.cmd === 'jump' ? 'jump' : 'click');
          if (!st.ok) setFalling(true);
        }, 450 * (i + 1)),
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        const ok = onAnswer(encodeProgram(cmds));
        if (!ok) {
          // Робот возвращается на старт, программу можно поправить.
          timers.current.push(
            window.setTimeout(() => {
              setRobot(start);
              setFalling(false);
              setRunning(false);
            }, 700),
          );
        }
      }, 450 * (res.steps.length + 1)),
    );
  };

  return (
    <div className="program-board">
      <Track track={program.track} robot={robot} falling={falling} />
      <div className="program-slots" data-testid="program-slots">
        {Array.from({ length: program.slots }, (_, i) => (
          <button
            key={i}
            className={`program-slot ${cmds[i] ? 'filled' : ''}`}
            data-testid={`program-slot-${i}`}
            onClick={() => removeAt(i)}
            disabled={!cmds[i] || running}
            aria-label={cmds[i] ? `Убрать: ${CMD_LABEL[cmds[i]]}` : `Шаг ${i + 1}`}
          >
            <span className="order-num">{i + 1}</span>
            {cmds[i] && <span className="cmd-icon">{CMD_ICON[cmds[i]]}</span>}
          </button>
        ))}
      </div>
      <div className="program-controls">
        {(['forward', 'jump'] as RobotCmd[]).map((c) => (
          <button key={c} className="q-option has-emoji cmd-btn" data-testid={`cmd-${c}`} onClick={() => add(c)} disabled={running || solved}>
            <span className="q-opt-emoji">{CMD_ICON[c]}</span>
            <span className="q-opt-label small">{CMD_LABEL[c]}</span>
          </button>
        ))}
        <button className="btn btn-primary run-btn" data-testid="program-run" onClick={run} disabled={running || solved || cmds.length === 0}>
          ▶ Запуск
        </button>
        <button className="btn btn-secondary" data-testid="program-clear" onClick={() => setCmds([])} disabled={running || solved}>
          ↺
        </button>
      </div>
    </div>
  );
}
