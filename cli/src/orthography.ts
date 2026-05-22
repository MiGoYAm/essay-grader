import { generateText, Output } from "ai";
import { z } from "zod";

import { defaultModel } from "./model.js";
import { OpenAIChatLanguageModelOptions } from "@ai-sdk/openai";

export type ErrorWithReasoning = {
  error: string;
  correct: string;
};

export type OrthographyResult = {
  orthographyErrors: ErrorWithReasoning[];
  points4b: number;
};

export async function analyzeOrthography(
  essayText: string,
  opts: { specNeeds?: boolean } = {},
): Promise<OrthographyResult> {
  const { output } = await generateText({
    model: defaultModel(),
    output: Output.array({
      element: z
        .object({
          error: z.string(),
          correct: z.string(),
        })
        .superRefine(({ error }, ctx) => {
          if (!essayText.includes(error)) {
            ctx.addIssue({
              code: "custom",
              message: "'error' not found in the input essay",
              input: error,
            });
          }
        }),
    }),
    system: systemPrompt(),
    prompt: userPrompt(essayText),
    providerOptions: {
      openai: {
        reasoningEffort: "medium",
      } satisfies OpenAIChatLanguageModelOptions,
    },
  });

  const errorCount = output.length;

  return {
    orthographyErrors: output,
    points4b: points(errorCount, opts),
  };
}

function points(
  errorCount: number,
  opts: { specNeeds?: boolean } = {},
): number {
  if (opts.specNeeds) {
    if (errorCount <= 4) return 2;
    if (errorCount <= 8) return 1;
    return 0;
  } else {
    if (errorCount <= 1) return 2;
    if (errorCount <= 4) return 1;
    return 0;
  }
}

function systemPrompt(): string {
  return `Oceniasz wypracowanie maturalne z języka polskiego pod kątem poprawności ortograficznej.

Zasady:
- orthography_errors to lista błędów ortograficznych w pracy.
- Każdy wpis w orthography_errors ma zawierać:
  - error: dokładny cytat błędnie zapisanego słowa lub zwrotu z tekstu,
  - correct: poprawną formę tego słowa lub zwrotu.
- Nie opisuj błędu w polu error. Pole error musi być cytatem z pracy.
- Nie dodawaj wyjaśnień ani komentarzy.
- Uwzględniaj tylko błędy ortograficzne, nie interpunkcyjne, stylistyczne ani gramatyczne.
- Ten sam wyraz lub zwrot zapisany niepoprawnie ortograficznie, powtórzony w wypracowaniu, licz tylko raz.`;
}

function userPrompt(essayText: string): string {
  return `Przeanalizuj to wypracowanie i zwróć wynik:

${essayText}`;
}
