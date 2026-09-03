import type { PlanBlock } from "@/types";

export const DEFAULT_FOCUS_SECONDS = 30 * 60;
export const DEFAULT_BREAK_SECONDS = 5 * 60;
export const MAX_GOAL_SECONDS = 12 * 60 * 60;
export const MIN_GOAL_SECONDS = 60;

/**
 * Builds a focus plan from a total amount of WORK time.
 * Breaks are inserted between work blocks and never counted in the goal,
 * and no break is appended after the last work block.
 */
export function buildFocusPlan(
  totalWorkSeconds: number,
  focusSeconds: number = DEFAULT_FOCUS_SECONDS,
  breakSeconds: number = DEFAULT_BREAK_SECONDS,
): PlanBlock[] {
  const goal = Math.floor(totalWorkSeconds);
  if (!Number.isFinite(goal) || goal <= 0) return [];

  const chunk = Math.max(60, Math.floor(focusSeconds));
  const pause = Math.max(0, Math.floor(breakSeconds));

  const blocks: PlanBlock[] = [];
  let remaining = goal;

  while (remaining > 0) {
    if (blocks.length > 0 && pause > 0) blocks.push({ type: "BREAK", seconds: pause });
    const work = Math.min(chunk, remaining);
    blocks.push({ type: "WORK", seconds: work });
    remaining -= work;
  }

  return blocks;
}

export function totalWorkSeconds(blocks: PlanBlock[]): number {
  return blocks.filter((b) => b.type === "WORK").reduce((sum, b) => sum + b.seconds, 0);
}

export function totalElapsedSeconds(blocks: PlanBlock[]): number {
  return blocks.reduce((sum, b) => sum + b.seconds, 0);
}

export function countWorkBlocks(blocks: PlanBlock[]): number {
  return blocks.filter((b) => b.type === "WORK").length;
}
