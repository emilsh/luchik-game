import { useEffect, useRef, useState } from 'react';
import { input } from '../game/systems/InputController';

type Dir = 'left' | 'right' | null;

/** Насколько палец может уйти за край кнопок, прежде чем движение остановится. */
const SLOP = 48;

/**
 * Сенсорное управление. Левая и правая кнопки — одна зона: палец можно
 * переводить с одной на другую не отрывая. Каждый палец (pointerId)
 * учитывается отдельно, поэтому движение и прыжок работают одновременно.
 */
export function TouchControls({ visible }: { visible: boolean }) {
  const padRef = useRef<HTMLDivElement>(null);
  const movePointers = useRef(new Map<number, Dir>());
  const jumpPointers = useRef(new Set<number>());
  const [pressed, setPressed] = useState({ left: false, right: false, jump: false });

  const sync = () => {
    const dirs = [...movePointers.current.values()];
    const left = dirs.includes('left');
    const right = dirs.includes('right');
    if (left) input.press('touchLeft');
    else input.release('touchLeft');
    if (right) input.press('touchRight');
    else input.release('touchRight');
    setPressed({ left, right, jump: jumpPointers.current.size > 0 });
  };

  const dirAt = (x: number, y: number): Dir => {
    const pad = padRef.current;
    if (!pad) return null;
    const r = pad.getBoundingClientRect();
    if (x < r.left - SLOP || x > r.right + SLOP || y < r.top - SLOP * 2 || y > r.bottom + SLOP) return null;
    return x < r.left + r.width / 2 ? 'left' : 'right';
  };

  const releaseAll = () => {
    movePointers.current.clear();
    jumpPointers.current.forEach((id) => input.releaseJump(`touch:${id}`));
    jumpPointers.current.clear();
    sync();
  };

  useEffect(() => releaseAll, []);

  useEffect(() => {
    if (!visible) releaseAll();
  }, [visible]);

  const capture = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // Указатель мог уже исчезнуть — не страшно.
    }
  };

  const padDown = (e: React.PointerEvent) => {
    e.preventDefault();
    capture(e);
    movePointers.current.set(e.pointerId, dirAt(e.clientX, e.clientY));
    sync();
  };
  const padMove = (e: React.PointerEvent) => {
    if (!movePointers.current.has(e.pointerId)) return;
    const d = dirAt(e.clientX, e.clientY);
    if (movePointers.current.get(e.pointerId) !== d) {
      movePointers.current.set(e.pointerId, d);
      sync();
    }
  };
  const padUp = (e: React.PointerEvent) => {
    if (movePointers.current.delete(e.pointerId)) sync();
  };

  const jumpDown = (e: React.PointerEvent) => {
    e.preventDefault();
    capture(e);
    jumpPointers.current.add(e.pointerId);
    input.pressJump(`touch:${e.pointerId}`);
    sync();
  };
  const jumpUp = (e: React.PointerEvent) => {
    if (jumpPointers.current.delete(e.pointerId)) {
      input.releaseJump(`touch:${e.pointerId}`);
      sync();
    }
  };

  if (!visible) return null;

  return (
    <div className="touch-controls">
      <div
        ref={padRef}
        className="dpad"
        data-testid="dpad"
        onPointerDown={padDown}
        onPointerMove={padMove}
        onPointerUp={padUp}
        onPointerCancel={padUp}
        onLostPointerCapture={padUp}
      >
        <div className={`touch-btn ${pressed.left ? 'active' : ''}`} data-testid="btn-left" aria-label="Влево">
          <svg viewBox="0 0 40 40" aria-hidden>
            <path d="M26 8 L12 20 L26 32" />
          </svg>
        </div>
        <div className={`touch-btn ${pressed.right ? 'active' : ''}`} data-testid="btn-right" aria-label="Вправо">
          <svg viewBox="0 0 40 40" aria-hidden>
            <path d="M14 8 L28 20 L14 32" />
          </svg>
        </div>
      </div>
      <div
        className={`touch-btn jump-btn ${pressed.jump ? 'active' : ''}`}
        data-testid="btn-jump"
        aria-label="Прыжок"
        onPointerDown={jumpDown}
        onPointerUp={jumpUp}
        onPointerCancel={jumpUp}
        onLostPointerCapture={jumpUp}
      >
        <svg viewBox="0 0 40 40" aria-hidden>
          <path d="M8 26 L20 12 L32 26" />
        </svg>
      </div>
    </div>
  );
}
