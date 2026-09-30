import { randomInt } from "node:crypto";

export type Category =
  | "grande"
  | "poker"
  | "full"
  | "escalera"
  | "seis"
  | "cinco"
  | "cuatro"
  | "tres"
  | "tontos"
  | "balas";

const NUMBER_CATEGORY: Record<number, Category> = {
  1: "balas",
  2: "tontos",
  3: "tres",
  4: "cuatro",
  5: "cinco",
  6: "seis",
};

/** Roll five six-sided dice using a cryptographically secure RNG. */
export function rollDice(count = 5): number[] {
  return Array.from({ length: count }, () => randomInt(1, 7));
}

function counts(dice: number[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const d of dice) m.set(d, (m.get(d) ?? 0) + 1);
  return m;
}

function isStraight(dice: number[]): boolean {
  const s = [...new Set(dice)].sort((a, b) => a - b).join("");
  // 1-2-3-4-5, 2-3-4-5-6, and the traditional 3-4-5-6-1 escalera.
  return s === "12345" || s === "23456" || s === "13456";
}

export interface CategoryScore {
  category: Category;
  points: number;
}

/**
 * Score every category for a throw. `servida` means the combination came on the
 * first throw of a turn, which in cacho adds 5 points to special plays
 * (a servida grande wins the game outright).
 */
export function scoreAll(dice: number[], servida = true): CategoryScore[] {
  const c = counts(dice);
  const values = [...c.values()].sort((a, b) => b - a);
  const bonus = servida ? 5 : 0;
  const out: CategoryScore[] = [];

  if (values[0] === 5) out.push({ category: "grande", points: 50 });
  if (values[0] >= 4) out.push({ category: "poker", points: 40 + bonus });
  if (values[0] === 3 && values[1] === 2) out.push({ category: "full", points: 30 + bonus });
  if (isStraight(dice)) out.push({ category: "escalera", points: 20 + bonus });

  for (let n = 1; n <= 6; n++) {
    out.push({ category: NUMBER_CATEGORY[n], points: n * (c.get(n) ?? 0) });
  }
  return out.sort((a, b) => b.points - a.points);
}

export interface RollResult {
  dice: number[];
  best: CategoryScore;
  options: CategoryScore[];
  grandeServida: boolean;
}

export function throwCacho(): RollResult {
  const dice = rollDice();
  const options = scoreAll(dice, true);
  return {
    dice,
    best: options[0],
    options,
    grandeServida: options[0].category === "grande",
  };
}
