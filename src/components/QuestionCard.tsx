import { useEffect, useRef, useState } from 'react';
import type { AnswerOption, QuestionDef, QuestionVisual } from '../types/game';
import { questions } from '../game/systems/QuestionManager';
import { audio } from '../game/systems/AudioManager';
import { speakEnglish, speakRussian, speechAvailable } from '../game/systems/Speech';
import { useProgress } from '../app/useProgress';
import { ExtraVisual, OrderBoard, ProgramBoard } from './questionParts';

const NPC_FACE: Record<string, string> = {
  sign: '📜',
  snail: '🐌',
  bridge1: '🤖',
  bridge2: '🤖',
  owl1: '🦉',
  owl2: '🦉',
  machine: '🛠️',
};

const NPC_EMOJI: Record<string, string> = {
  sign: '📜',
  snail: '🐌',
  robot: '🤖',
  owl: '🦉',
  machine: '🛠️',
  lever: '🕹️',
  firefly: '✨',
  numlock: '🔐',
  penguin: '🐧',
  turtle: '🐢',
  telescope: '🔭',
  bookstand: '📖',
};

function faceFor(stationId: string, npc?: string): string {
  return (npc && NPC_EMOJI[npc]) ?? NPC_FACE[stationId] ?? '💡';
}

function Dots({ n }: { n: number }) {
  return (
    <span className="dots" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <i key={i} />
      ))}
    </span>
  );
}

function Visual({ v, showNumbers }: { v: QuestionVisual; showNumbers: boolean }) {
  switch (v.kind) {
    case 'count':
      return (
        <div className="q-count" data-testid="q-visual">
          {Array.from({ length: v.count }, (_, i) => (
            <span key={i} className="q-thing" style={{ animationDelay: `${i * 0.08}s` }}>
              {v.emoji}
              {showNumbers && <b className="q-num-tag">{i + 1}</b>}
            </span>
          ))}
        </div>
      );
    case 'equation': {
      const sub = v.op === '-';
      const missing = v.unknown === 'b';
      const result = sub ? v.a - v.b : v.a + v.b;
      return (
        <div className="q-equation" data-testid="q-visual">
          <div className="q-group">
            {Array.from({ length: v.a }, (_, i) => (
              <span key={i} className={`q-thing ${sub && i >= v.a - v.b ? 'gone' : ''}`}>
                {v.emoji}
                {showNumbers && !(sub && i >= v.a - v.b) && <b className="q-num-tag">{i + 1}</b>}
              </span>
            ))}
          </div>
          {!sub && (
            <>
              <span className="q-op">+</span>
              <div className="q-group">
                {Array.from({ length: v.b }, (_, i) => (
                  <span key={i} className={`q-thing ${missing ? 'ghost' : ''}`}>
                    {v.emoji}
                    {showNumbers && <b className="q-num-tag">{v.a + i + 1}</b>}
                  </span>
                ))}
              </div>
            </>
          )}
          <div className="q-formula">
            {missing ? `${v.a} ${sub ? '−' : '+'} ? = ${result}` : `${v.a} ${sub ? '−' : '+'} ${v.b} = ?`}
          </div>
        </div>
      );
    }
    case 'word':
    case 'find': {
      const word = v.word;
      if (!word) return null;
      return (
        <button className="q-word" data-testid="q-visual" onClick={() => speakEnglish(word)} aria-label={`Послушать ${word}`}>
          {word}
          {speechAvailable() && <span className="q-speak">🔊</span>}
        </button>
      );
    }
    case 'picture':
      return (
        <div className="q-picture" data-testid="q-visual">
          {v.emoji}
        </div>
      );
    default:
      return <ExtraVisual v={v} />;
  }
}

function OptionButton({
  opt,
  state,
  onPick,
}: {
  opt: AnswerOption;
  state: 'idle' | 'wrong' | 'right';
  onPick: () => void;
}) {
  const numeric = opt.label !== undefined && /^\d+$/.test(opt.label) && !opt.emoji;
  const arrows = opt.label !== undefined && /^[→←↑↓ ]+$/.test(opt.label);
  return (
    <button
      className={`q-option ${state} ${numeric ? 'numeric' : ''} ${arrows ? 'arrows' : ''} ${opt.emoji ? 'has-emoji' : ''}`}
      data-testid={`option-${opt.id}`}
      onClick={onPick}
      disabled={state === 'wrong'}
    >
      {opt.emoji && <span className="q-opt-emoji">{opt.emoji}</span>}
      {opt.label && <span className="q-opt-label">{opt.label}</span>}
      {opt.dots !== undefined && <Dots n={opt.dots} />}
    </button>
  );
}

export interface QuestionCardProps {
  stationId: string;
  npc?: string;
  question: QuestionDef;
  index: number;
  total: number;
  onSolved: () => void;
  onClose: () => void;
}

export function QuestionCard({ stationId, npc, question: q, index, total, onSolved, onClose }: QuestionCardProps) {
  const { settings } = useProgress();
  const [wrong, setWrong] = useState<string[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [shake, setShake] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (q.word && (q.visual?.kind === 'word' || q.visual?.kind === 'find')) {
      const t = window.setTimeout(() => speakEnglish(q.word as string), 350);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [q]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  /** Single answer submission for all modes: choice, order, program. */
  const submit = (answer: string): boolean => {
    if (solved) return true;
    const res = questions.answer(q.id, answer);
    if (res.correct) {
      setSolved(true);
      setHint(null);
      audio.play('correct');
      if (q.word) speakEnglish(q.word);
      timer.current = window.setTimeout(onSolved, 1900);
      return true;
    }
    audio.play('wrong');
    setHint(res.hint ?? null);
    setShake((n) => n + 1);
    return false;
  };

  const pick = (opt: AnswerOption) => {
    if (!submit(opt.id)) setWrong((w) => [...w, opt.id]);
  };

  const readAloud = () => {
    const text = [...(q.story ?? []), q.prompt].join(' ');
    speakRussian(text);
  };

  const pictureOptions = q.options.every((o) => o.emoji && !o.label);

  return (
    <div className="overlay" data-testid="question-card" data-question={q.id}>
      <div className={`card question-card ${solved ? 'is-solved' : ''}`} key={q.id}>
        <div className="q-header">
          <span className="q-face">{faceFor(stationId, npc)}</span>
          {total > 1 && (
            <span className="q-steps" aria-label={`Задание ${index + 1} из ${total}`}>
              {Array.from({ length: total }, (_, i) => (
                <i key={i} className={i < index || (i === index && solved) ? 'done' : i === index ? 'now' : ''} />
              ))}
            </span>
          )}
          {settings.readAloud && speechAvailable() && (
            <button className="icon-btn small" onClick={readAloud} aria-label="Послушать">
              🔊
            </button>
          )}
          <button className="q-close" onClick={onClose} aria-label="Закрыть и вернуться позже" data-testid="question-close">
            ✕
          </button>
        </div>

        {q.story && (
          <div className="q-story" data-testid="q-story">
            {q.story.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
        {q.visual && <Visual v={q.visual} showNumbers={!!hint} />}
        <div className="q-prompt">{q.prompt}</div>

        {q.order ? (
          <OrderBoard options={q.options} order={q.order} solved={solved} onAnswer={submit} />
        ) : q.program ? (
          <ProgramBoard program={q.program} solved={solved} onAnswer={submit} />
        ) : (
          <div key={shake} className={`q-options ${pictureOptions ? 'pictures' : ''} ${shake ? 'shaking' : ''}`}>
            {q.options.map((opt) => (
              <OptionButton
                key={opt.id}
                opt={opt}
                state={solved && opt.id === q.correct ? 'right' : wrong.includes(opt.id) ? 'wrong' : 'idle'}
                onPick={() => pick(opt)}
              />
            ))}
          </div>
        )}

        {hint && !solved && (
          <div className="q-hint" data-testid="q-hint" role="status">
            <span>💡</span> {hint}
          </div>
        )}

        {solved && (
          <div className="q-success" data-testid="q-success" role="status">
            <div className="q-success-burst" aria-hidden>
              {['⭐', '✨', '🌟', '✨', '⭐', '🌟'].map((s, i) => (
                <span key={i} style={{ ['--i' as string]: i }}>
                  {s}
                </span>
              ))}
            </div>
            <div className="q-success-title">Отлично!</div>
            <div className="q-success-text">{q.explanation}</div>
            <div className="q-success-reward">{q.reward}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Quest card: "Find the object by its English word". */
export function FindCard({ question: q, onAccept }: { question: QuestionDef; onAccept: () => void }) {
  const word = q.word ?? '';
  const { settings } = useProgress();
  useEffect(() => {
    if (!word) return undefined;
    const t = window.setTimeout(() => speakEnglish(word), 350);
    return () => window.clearTimeout(t);
  }, [word]);
  return (
    <div className="overlay" data-testid="find-card">
      <div className="card question-card find-card">
        {q.story && (
          <div className="q-story" data-testid="q-story">
            {q.story.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
        <div className="q-prompt">{q.prompt}</div>
        {word && (
          <button className="q-word" onClick={() => speakEnglish(word)} aria-label={`Послушать ${word}`}>
            {word}
            {speechAvailable() && <span className="q-speak">🔊</span>}
          </button>
        )}
        {!word && settings.readAloud && speechAvailable() && (
          <button className="icon-btn" onClick={() => speakRussian([...(q.story ?? []), q.prompt].join(' '))} aria-label="Послушать">
            🔊
          </button>
        )}
        <p className="find-tip">{word ? 'Подойди к картинке, которая подходит к слову.' : 'Прочитай и найди нужное место.'}</p>
        <button className="btn btn-primary btn-xl" data-testid="find-accept" onClick={onAccept}>
          🔎 Иду искать!
        </button>
      </div>
    </div>
  );
}
