import { generateObject } from "ai";
import { z } from "zod";

import { defaultModel } from "./model.js";

export type ErrorWithReasoning = {
  error: string;
  reasoning: string;
};

export type OrthographyResult = {
  orthographyErrors: ErrorWithReasoning[];
  points4b: number;
};

const orthographySchema = z.object({
  orthography_errors: z.array(
    z.object({
      error: z.string(),
      reasoning: z.string(),
    }),
  ),
});

export async function analyzeOrthography(
  essayText: string,
  opts: { specNeeds?: boolean } = {},
): Promise<OrthographyResult> {
  const { object } = await generateObject({
    model: defaultModel(),
    schema: orthographySchema,
    system: systemPrompt(),
    prompt: userPrompt(essayText),
  });

  const errorCount = object.orthography_errors.length;

  return {
    orthographyErrors: object.orthography_errors,
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
  return `Oceniasz wypracowanie maturalne z jezyka polskiego pod kątem poprawnosci ortograficznej.

Zasady:
- orthography_errors to lista bledow ortograficznych w pracy.
- Kazdy wpis w orthography_errors ma miec error jako dokladny cytat z tekstu oraz reasoning jako krotkie wyjasnienie bledu po polsku.
- Ten sam wyraz zapisany niepoprawnie ortograficznie, powtorzony w wypracowaniu, pomiń ten błąd.`;
}

function userPrompt(essayText: string): string {
  return `Przeanalizuj to wypracowanie i zwroc wynik:

${essayText}`;
}
