import type { OpenAIChatLanguageModelOptions } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

import { defaultModel } from "./model.js";

type ReasoningEffort = NonNullable<
  OpenAIChatLanguageModelOptions["reasoningEffort"]
>;

type RunAnalyzerArgs = {
  output?: "object" | "array";
  schema: z.ZodType;
  system: string;
  prompt: string;
  reasoningEffort?: ReasoningEffort;
};

function capReasoningEffort(reasoningEffort: ReasoningEffort): ReasoningEffort {
  return reasoningEffort === "medium" ||
    reasoningEffort === "high" ||
    reasoningEffort === "xhigh"
    ? "low"
    : reasoningEffort;
}

export async function runAnalyzer<T>({
  output = "object",
  schema,
  system,
  prompt,
  reasoningEffort = "low",
}: RunAnalyzerArgs): Promise<T> {
  const result = await generateObject({
    model: defaultModel(),
    output,
    schema,
    system,
    prompt,
    providerOptions: {
      openai: {
        reasoningEffort: capReasoningEffort(reasoningEffort),
      } satisfies OpenAIChatLanguageModelOptions,
    },
  });

  return result.object as T;
}

export function essayPrompt(instruction: string, essayText: string): string {
  return `${instruction}:

${essayText}`;
}

export function essayFragment(
  _essayText: string,
  _fieldName: string,
  opts: { minLength?: number } = {},
) {
  return z.string().min(opts.minLength ?? 1);
}

export function findFragmentPositions(
  essayText: string,
  fragment: string,
): number[] {
  const positions: number[] = [];
  let searchFrom = 0;

  while (searchFrom <= essayText.length) {
    const position = essayText.indexOf(fragment, searchFrom);
    if (position === -1) break;

    positions.push(position);
    searchFrom = position + Math.max(fragment.length, 1);
  }

  return positions;
}

export function assignUniqueFragmentPositions<
  T extends { fragment: string; occurrenceIndex?: number },
>(
  essayText: string,
  items: T[],
): Array<T & { fragmentPosition: number }> {
  const usedByFragment = new Map<string, Set<number>>();
  const locatedItems: Array<T & { fragmentPosition: number }> = [];

  for (const item of items) {
    const positions = findFragmentPositions(essayText, item.fragment);

    if (positions.length === 0) {
      continue;
    }

    const used = usedByFragment.get(item.fragment) ?? new Set<number>();
    const occurrenceIndex =
      item.occurrenceIndex !== undefined
        ? item.occurrenceIndex - 1
        : positions.findIndex((_, index) => !used.has(index));

    if (occurrenceIndex < 0 || occurrenceIndex >= positions.length) {
      continue;
    }

    if (used.has(occurrenceIndex)) {
      continue;
    }

    used.add(occurrenceIndex);
    usedByFragment.set(item.fragment, used);

    locatedItems.push({
      ...item,
      fragmentPosition: positions[occurrenceIndex]!,
    });
  }

  return locatedItems;
}
