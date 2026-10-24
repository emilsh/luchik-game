import type { RobotCmd } from '../../types/game';

// Running a robot program on a track. Used both to check
// the answer (QuestionManager) and to animate the task card.

export interface RunStep {
  cmd: RobotCmd;
  from: number;
  to: number;
  ok: boolean;
}

export interface RunResult {
  steps: RunStep[];
  success: boolean;
  /** Why it failed: fell into a pit, went past the edge, or did not reach the goal. */
  failure: 'pit' | 'edge' | 'short' | null;
}

export const CMD_ICON: Record<RobotCmd, string> = { forward: '➡️', jump: '⤴️' };
export const CMD_LABEL: Record<RobotCmd, string> = { forward: 'Вперёд', jump: 'Прыжок' };

export function runProgram(track: string, program: RobotCmd[]): RunResult {
  let pos = track.indexOf('R');
  const steps: RunStep[] = [];
  for (const cmd of program) {
    const to = pos + (cmd === 'jump' ? 2 : 1);
    const cell = track[to];
    if (cell === undefined) {
      steps.push({ cmd, from: pos, to, ok: false });
      return { steps, success: false, failure: 'edge' };
    }
    if (cell === '_') {
      steps.push({ cmd, from: pos, to, ok: false });
      return { steps, success: false, failure: 'pit' };
    }
    steps.push({ cmd, from: pos, to, ok: true });
    pos = to;
  }
  const success = track[pos] === 'G';
  return { steps, success, failure: success ? null : 'short' };
}

export const encodeProgram = (p: RobotCmd[]): string => p.join(',');
export const decodeProgram = (s: string): RobotCmd[] =>
  s ? (s.split(',').filter((c) => c === 'forward' || c === 'jump') as RobotCmd[]) : [];
