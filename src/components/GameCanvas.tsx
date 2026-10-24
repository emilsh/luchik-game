import { useEffect, useRef } from 'react';
import { mountGame, startLevel, unmountGame } from '../game/gameHost';

/** Container for the Phaser canvas. The game itself lives in gameHost and is reused. */
export function GameCanvas({ levelId, runId }: { levelId: number; runId: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    mountGame(ref.current);
    return () => unmountGame();
  }, []);

  useEffect(() => {
    void startLevel(levelId);
  }, [levelId, runId]);

  return <div ref={ref} className="game-canvas" data-testid="game-canvas" />;
}
