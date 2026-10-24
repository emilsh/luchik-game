import { useCallback, useEffect, useRef, useState } from 'react';
import type { Screen } from '../app/routes';
import { useProgress } from '../app/useProgress';
import { bus, EV, type HudState, type LevelCompleteEvent, type QuestionOpenEvent, type ToastEvent } from '../game/events';
import { getLevel, levelRewards } from '../game/levels';
import { LEVEL_COUNT } from '../data/chapters';
import { pauseLevel, resumeLevel } from '../game/gameHost';
import { input } from '../game/systems/InputController';
import { progress, type CompletionResult } from '../game/systems/ProgressManager';
import { audio } from '../game/systems/AudioManager';
import type { QuestionDef } from '../types/game';
import { GameCanvas } from './GameCanvas';
import { Hud } from './Hud';
import { TouchControls } from './TouchControls';
import { FindCard, QuestionCard } from './QuestionCard';
import { PauseMenu } from './PauseMenu';
import { LevelComplete } from './LevelComplete';
import { StoryIntro } from './StoryIntro';
import { Tutorial } from './Tutorial';
import { Toasts, type ToastItem } from './Toasts';

type Phase = 'loading' | 'intro' | 'tutorial' | 'play' | 'question' | 'find' | 'paused' | 'complete';

const detectTouch = () => {
  try {
    return navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
};

export function GameScreen({ levelId, go }: { levelId: number; go: (s: Screen) => void }) {
  const level = getLevel(levelId);
  const save = useProgress();
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [hud, setHud] = useState<HudState | null>(null);
  const [question, setQuestion] = useState<QuestionOpenEvent | null>(null);
  const [findQ, setFindQ] = useState<{ stationId: string; question: QuestionDef } | null>(null);
  const [complete, setComplete] = useState<{ e: LevelCompleteEvent; result: CompletionResult } | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [touch, setTouch] = useState(detectTouch);
  const [portrait, setPortrait] = useState(false);
  const skipIntro = useRef(false);
  const phaseRef = useRef<Phase>(phase);
  phaseRef.current = phase;
  const toastId = useRef(0);

  useEffect(() => {
    progress.setCurrentLevel(levelId);
  }, [levelId]);

  // Game keys are captured only while the game itself is being played.
  useEffect(() => {
    input.captureKeys = phase === 'play';
    if (phase !== 'play') input.reset();
  }, [phase]);

  const togglePause = useCallback(() => {
    if (phaseRef.current === 'play') {
      pauseLevel();
      setPhase('paused');
    } else if (phaseRef.current === 'paused') {
      resumeLevel();
      setPhase('play');
    }
  }, []);

  useEffect(() => {
    input.onPause = togglePause;
    return () => {
      input.onPause = null;
      input.captureKeys = false;
      input.reset();
    };
  }, [togglePause]);

  useEffect(() => {
    const onReady = () => {
      setHud(null);
      setToasts([]);
      setQuestion(null);
      setFindQ(null);
      setComplete(null);
      if (skipIntro.current) {
        skipIntro.current = false;
        setPhase('play');
        bus.emit(EV.LEVEL_START);
      } else {
        setPhase('intro');
      }
    };
    const onHud = (h: HudState) => setHud(h);
    const onQuestion = (e: QuestionOpenEvent) => {
      setQuestion(e);
      setPhase('question');
    };
    const onFind = (e: { stationId: string; question: QuestionDef }) => {
      setFindQ(e);
      setPhase('find');
    };
    const onToast = (t: ToastEvent) => {
      const id = ++toastId.current;
      setToasts((list) => [...list.slice(-1), { ...t, id }]);
      window.setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 3200);
    };
    const onComplete = (e: LevelCompleteEvent) => {
      const result = progress.completeLevel(e.levelId, e.stars, levelRewards(getLevel(e.levelId)));
      audio.play('win');
      setComplete({ e, result });
      setPhase('complete');
    };
    bus.on(EV.LEVEL_READY, onReady);
    bus.on(EV.HUD, onHud);
    bus.on(EV.QUESTION_OPEN, onQuestion);
    bus.on(EV.FIND_ANNOUNCE, onFind);
    bus.on(EV.TOAST, onToast);
    bus.on(EV.LEVEL_COMPLETE, onComplete);
    return () => {
      bus.off(EV.LEVEL_READY, onReady);
      bus.off(EV.HUD, onHud);
      bus.off(EV.QUESTION_OPEN, onQuestion);
      bus.off(EV.FIND_ANNOUNCE, onFind);
      bus.off(EV.TOAST, onToast);
      bus.off(EV.LEVEL_COMPLETE, onComplete);
    };
  }, []);

  // Rotate-device hint and touch auto-detection.
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const update = () => setPortrait(mq.matches && detectTouch());
    update();
    mq.addEventListener?.('change', update);
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === 'touch') setTouch(true);
    };
    window.addEventListener('pointerdown', onPointer);
    return () => {
      mq.removeEventListener?.('change', update);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, []);

  const startPlay = () => {
    if (levelId === 1 && !save.tutorialSeen) {
      setPhase('tutorial');
      return;
    }
    setPhase('play');
    bus.emit(EV.LEVEL_START);
  };

  const restart = (withIntro = false) => {
    skipIntro.current = !withIntro;
    resumeLevel();
    setPhase('loading');
    setRunId((n) => n + 1);
  };

  // After the end of chapter 1 we also offer "Next" — into chapter 2.
  const nextLevel = levelId < LEVEL_COUNT && complete ? () => go({ name: 'game', levelId: levelId + 1 }) : null;

  return (
    <div className="screen game-screen" data-testid="game-screen" data-phase={phase}>
      <GameCanvas levelId={levelId} runId={runId} />
      {phase !== 'loading' && phase !== 'complete' && <Hud hud={hud} onPause={togglePause} />}
      <TouchControls visible={touch && phase === 'play'} />
      <Toasts items={phase === 'play' || phase === 'paused' ? toasts : []} />

      {phase === 'loading' && <div className="loading">Загрузка…</div>}
      {phase === 'intro' && (
        <StoryIntro
          level={level}
          showChapterIntro={level.chapter === 2 && !save.chapterIntrosSeen.includes(2)}
          onStart={() => {
            if (level.chapter === 2) progress.markChapterIntroSeen(2);
            startPlay();
          }}
        />
      )}
      {phase === 'tutorial' && (
        <Tutorial
          touch={touch}
          onDone={() => {
            progress.markTutorialSeen();
            setPhase('play');
            bus.emit(EV.LEVEL_START);
          }}
        />
      )}
      {phase === 'question' && question && (
        <QuestionCard
          key={question.question.id}
          stationId={question.stationId}
          npc={question.npc}
          question={question.question}
          index={question.index}
          total={question.total}
          onSolved={() => {
            setQuestion(null);
            setPhase('play');
            bus.emit(EV.QUESTION_SOLVED, { stationId: question.stationId, questionId: question.question.id });
          }}
          onClose={() => {
            setQuestion(null);
            setPhase('play');
            bus.emit(EV.QUESTION_CLOSED);
          }}
        />
      )}
      {phase === 'find' && findQ && (
        <FindCard
          question={findQ.question}
          onAccept={() => {
            setFindQ(null);
            setPhase('play');
            bus.emit(EV.FIND_ACCEPT, { stationId: findQ.stationId });
          }}
        />
      )}
      {phase === 'paused' && (
        <PauseMenu onResume={togglePause} onRestart={() => restart(false)} onLevels={() => go({ name: 'levels' })} />
      )}
      {phase === 'complete' && complete && (
        <LevelComplete
          level={level}
          stars={complete.e.stars}
          totalStars={complete.e.totalStars}
          result={complete.result}
          onNext={nextLevel}
          onReplay={() => restart(false)}
          onLevels={() => go({ name: 'levels' })}
          onCollection={() => go({ name: 'collection' })}
        />
      )}
      {portrait && (
        <div className="rotate-hint" role="status">
          <span className="rotate-icon">📱↻</span> Поверни iPad боком — так удобнее играть
        </div>
      )}
    </div>
  );
}
