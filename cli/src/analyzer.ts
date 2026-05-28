import type { OpenAIChatLanguageModelOptions } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";

import { defaultModel } from "./model.js";

type ReasoningEffort = NonNullable<
  OpenAIChatLanguageModelOptions["reasoningEffort"]
>;

type AnalyzerOutput = NonNullable<Parameters<typeof generateText>[0]["output"]>;

type RunAnalyzerArgs = {
  output: AnalyzerOutput;
  system: string;
  prompt: string;
  reasoningEffort?: ReasoningEffort;
};

export async function runAnalyzer<T>({
  output,
  system,
  prompt,
  reasoningEffort = "medium",
}: RunAnalyzerArgs): Promise<T> {
  const result = await generateText({
    model: defaultModel(),
    output,
    system,
    prompt,
    providerOptions: {
      openai: {
        reasoningEffort,
      } satisfies OpenAIChatLanguageModelOptions,
    },
  });

  return result.output as T;
}

export function essayPrompt(instruction: string, essayText: string): string {
  return `${instruction}:

${essayText}`;
}

export function essayFragment(
  essayText: string,
  fieldName: string,
  opts: { minLength?: number } = {},
) {
  const schema = z.string().min(opts.minLength ?? 1);

  return schema.superRefine((fragment, ctx) => {
    if (!essayText.includes(fragment)) {
      ctx.addIssue({
        code: "custom",
        message: `'${fieldName}' not found in the input essay`,
        input: fragment,
      });
    }
  });
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

  return items.map((item) => {
    const positions = findFragmentPositions(essayText, item.fragment);

    if (positions.length === 0) {
      throw new Error(`Fragment not found in essay: ${item.fragment}`);
    }

    const used = usedByFragment.get(item.fragment) ?? new Set<number>();
    const occurrenceIndex =
      item.occurrenceIndex !== undefined
        ? item.occurrenceIndex - 1
        : positions.findIndex((_, index) => !used.has(index));

    if (occurrenceIndex < 0 || occurrenceIndex >= positions.length) {
      const nextOccurrence = item.occurrenceIndex ?? used.size + 1;
      throw new Error(
        `Cannot locate occurrence ${nextOccurrence} of fragment: ${item.fragment}`,
      );
    }

    if (used.has(occurrenceIndex)) {
      throw new Error(
        `Duplicate locator for occurrence ${occurrenceIndex + 1} of fragment: ${item.fragment}`,
      );
    }

    used.add(occurrenceIndex);
    usedByFragment.set(item.fragment, used);

    return {
      ...item,
      fragmentPosition: positions[occurrenceIndex]!,
    };
  });
}
