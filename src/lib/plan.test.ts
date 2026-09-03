import { describe, expect, it } from "vitest";
import { buildFocusPlan, countWorkBlocks, totalElapsedSeconds, totalWorkSeconds } from "./plan";

const M = 60;

describe("buildFocusPlan", () => {
  const cases: Array<[number, number[]]> = [
    [30, [30]],
    [40, [30, 10]],
    [60, [30, 30]],
    [75, [30, 30, 15]],
    [90, [30, 30, 30]],
    [120, [30, 30, 30, 30]],
  ];

  it.each(cases)("goal of %i min produces the right work blocks", (minutes, expected) => {
    const blocks = buildFocusPlan(minutes * M);
    const work = blocks.filter((b) => b.type === "WORK").map((b) => b.seconds / M);
    expect(work).toEqual(expected);
  });

  it.each(cases)("total work equals the goal for %i min", (minutes) => {
    const blocks = buildFocusPlan(minutes * M);
    expect(totalWorkSeconds(blocks)).toBe(minutes * M);
  });

  it("never ends with a break", () => {
    for (const [minutes] of cases) {
      const blocks = buildFocusPlan(minutes * M);
      expect(blocks[blocks.length - 1]?.type).toBe("WORK");
    }
  });

  it("alternates work and break", () => {
    const blocks = buildFocusPlan(90 * M);
    expect(blocks.map((b) => b.type)).toEqual(["WORK", "BREAK", "WORK", "BREAK", "WORK"]);
    expect(totalElapsedSeconds(blocks)).toBe(90 * M + 10 * M);
    expect(countWorkBlocks(blocks)).toBe(3);
  });

  it("last block matches the remaining time", () => {
    const blocks = buildFocusPlan(40 * M);
    expect(blocks[blocks.length - 1]).toEqual({ type: "WORK", seconds: 10 * M });
  });

  it("returns nothing for a zero or negative goal", () => {
    expect(buildFocusPlan(0)).toEqual([]);
    expect(buildFocusPlan(-100)).toEqual([]);
  });

  it("honours custom focus and break durations", () => {
    const blocks = buildFocusPlan(50 * M, 20 * M, 3 * M);
    expect(blocks.map((b) => [b.type, b.seconds / M])).toEqual([
      ["WORK", 20],
      ["BREAK", 3],
      ["WORK", 20],
      ["BREAK", 3],
      ["WORK", 10],
    ]);
    expect(totalWorkSeconds(blocks)).toBe(50 * M);
  });
});
