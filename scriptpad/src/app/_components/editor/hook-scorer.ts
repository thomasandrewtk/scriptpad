/**
 * Heuristic hook strength scorer.
 * Analyzes hook text and returns a score (0-100) with breakdown.
 */

export interface HookScore {
  total: number; // 0-100
  level: "weak" | "medium" | "strong";
  breakdown: {
    questionFormat: number;
    hasStatistic: number;
    addressesYou: number;
    powerWords: number;
    length: number;
    urgency: number;
  };
  suggestions: string[];
}

const POWER_WORDS = [
  "secret",
  "shocking",
  "proven",
  "instantly",
  "guaranteed",
  "free",
  "discover",
  "revealed",
  "ultimate",
  "hack",
  "mistake",
  "warning",
  "never",
  "always",
  "stop",
  "truth",
  "actually",
  "finally",
  "imagine",
  "exactly",
  "simple",
  "easy",
  "fast",
  "powerful",
  "insane",
  "crazy",
  "unbelievable",
  "mind-blowing",
  "game-changer",
  "life-changing",
  "nobody",
  "everybody",
  "worst",
  "best",
  "most",
  "only",
  "first",
  "last",
  "biggest",
  "deadly",
];

const URGENCY_WORDS = [
  "now",
  "today",
  "before",
  "hurry",
  "immediately",
  "urgent",
  "don't wait",
  "right now",
  "this week",
  "limited",
  "running out",
  "last chance",
];

export function scoreHook(text: string): HookScore {
  if (!text || text.trim().length === 0) {
    return {
      total: 0,
      level: "weak",
      breakdown: {
        questionFormat: 0,
        hasStatistic: 0,
        addressesYou: 0,
        powerWords: 0,
        length: 0,
        urgency: 0,
      },
      suggestions: ["Write your hook to see scoring"],
    };
  }

  const lower = text.toLowerCase().trim();
  const words = lower.split(/\s+/).filter((w) => w.length > 0);
  const suggestions: string[] = [];

  // 1. Question format (0-20)
  const isQuestion = text.trim().endsWith("?");
  const questionFormat = isQuestion ? 20 : 0;
  if (!isQuestion) {
    suggestions.push("Try phrasing as a question to increase engagement");
  }

  // 2. Statistics / numbers (0-15)
  const hasNumber = /\d/.test(text);
  const hasPercent = /%/.test(text) || /percent/i.test(text);
  const hasStatistic = hasNumber ? (hasPercent ? 15 : 10) : 0;
  if (!hasNumber) {
    suggestions.push("Add a specific number or statistic for credibility");
  }

  // 3. Addresses "you" directly (0-15)
  const youCount = words.filter(
    (w) => w === "you" || w === "your" || w === "you're" || w === "yours",
  ).length;
  const addressesYou = youCount > 0 ? Math.min(youCount * 8, 15) : 0;
  if (youCount === 0) {
    suggestions.push('Address the viewer directly with "you" or "your"');
  }

  // 4. Power words (0-20)
  const foundPowerWords = POWER_WORDS.filter(
    (pw) => lower.includes(pw),
  );
  const powerWords = Math.min(foundPowerWords.length * 7, 20);
  if (foundPowerWords.length === 0) {
    suggestions.push(
      "Use power words like \"secret\", \"proven\", \"mistake\", \"exactly\"",
    );
  }

  // 5. Length (0-15) — ideal hook is 8-20 words
  let lengthScore: number;
  if (words.length >= 8 && words.length <= 20) {
    lengthScore = 15;
  } else if (words.length >= 5 && words.length <= 25) {
    lengthScore = 10;
  } else if (words.length >= 3) {
    lengthScore = 5;
  } else {
    lengthScore = 0;
    suggestions.push("Your hook is too short — aim for 8-20 words");
  }
  if (words.length > 25) {
    suggestions.push("Your hook is too long — trim to under 20 words for impact");
  }

  // 6. Urgency (0-15)
  const foundUrgency = URGENCY_WORDS.filter((uw) => lower.includes(uw));
  const urgencyScore = Math.min(foundUrgency.length * 8, 15);

  // Total
  const total = Math.min(
    questionFormat + hasStatistic + addressesYou + powerWords + lengthScore + urgencyScore,
    100,
  );

  const level: HookScore["level"] =
    total >= 60 ? "strong" : total >= 35 ? "medium" : "weak";

  if (suggestions.length === 0) {
    suggestions.push("Great hook! Strong engagement potential");
  }

  return {
    total,
    level,
    breakdown: {
      questionFormat,
      hasStatistic,
      addressesYou,
      powerWords: powerWords,
      length: lengthScore,
      urgency: urgencyScore,
    },
    suggestions,
  };
}

/** Color for each hook score level */
export const HOOK_SCORE_COLORS: Record<HookScore["level"], string> = {
  weak: "#EF4444",
  medium: "#F59E0B",
  strong: "#10B981",
};
