import { Output } from "ai";
import { z } from "zod";

import { essayFragment, essayPrompt, runAnalyzer } from "./analyzer.js";

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
  const output = await runAnalyzer<ErrorWithReasoning[]>({
    output: Output.array({
      element: z.object({
        error: essayFragment(essayText, "error"),
        correct: z.string(),
      }),
    }),
    system: systemPrompt(),
    prompt: userPrompt(essayText),
  });

  const errorCount = output.length;

  return {
    orthographyErrors: output,
    points4b: scoreOrthography(errorCount, opts),
  };
}

export function scoreOrthography(
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
- Zwróć tablicę błędów ortograficznych w pracy.
- Każdy wpis ma zawierać:
  - error: dokładny cytat błędnie zapisanego słowa lub zwrotu z tekstu,
  - correct: poprawną formę tego słowa lub zwrotu.
- Nie opisuj błędu w polu error. Pole error musi być cytatem z pracy.
- Nie dodawaj wyjaśnień ani komentarzy.
- Uwzględniaj tylko błędy ortograficzne, nie interpunkcyjne, stylistyczne ani gramatyczne.
- Ten sam wyraz lub zwrot zapisany niepoprawnie ortograficznie, powtórzony w wypracowaniu, licz tylko raz.`;
}

function userPrompt(essayText: string): string {
  return essayPrompt("Przeanalizuj to wypracowanie i zwróć wynik", essayText);
}
