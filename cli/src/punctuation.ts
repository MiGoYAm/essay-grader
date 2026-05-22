import { generateText, Output } from "ai";
import { z } from "zod";

import { defaultModel } from "./model.js";
import { OpenAIChatLanguageModelOptions } from "@ai-sdk/openai";

export type PunctuationErrorRaw = {
  fragment: string;
  suggestion: string;
  reasoning: string;
};

export type PunctuationError = PunctuationErrorRaw & {
  position: number;
};

export type PunctuationResult = {
  punctuationErrors: PunctuationError[];
};

export async function analyzePunctuation(
  essayText: string,
): Promise<PunctuationResult> {
  const { output } = await generateText({
    model: defaultModel(),
    output: Output.array({
      element: punctuationSchema(essayText),
    }),
    system: systemPrompt(),
    prompt: userPrompt(essayText),
    providerOptions: {
      openai: {
        reasoningEffort: "xhigh",
      } satisfies OpenAIChatLanguageModelOptions,
    },
  });

  const punctuationErrors = output.map((error) => ({
    ...error,
    position: calculatePosition(essayText, error),
  }));

  return { punctuationErrors };
}

function punctuationSchema(essayText: string) {
  return z
    .object({
      fragment: z.string().min(2),
      suggestion: z.string().min(2),
      reasoning: z.string(),
    })
    .superRefine(({ fragment }, ctx) => {
      if (!essayText.includes(fragment)) {
        ctx.addIssue({
          code: "custom",
          message: "'fragment' not found in the input essay",
        });
      }
    });
}

function calculatePosition(
  essayText: string,
  error: PunctuationErrorRaw,
): number {
  const idx = essayText.indexOf(error.fragment);
  if (idx === -1) return -1;

  const minLen = Math.min(error.fragment.length, error.suggestion.length);
  for (let i = 0; i < minLen; i++) {
    if (error.fragment[i] !== error.suggestion[i]) return idx + i;
  }

  return idx + minLen;
}

function systemPrompt(): string {
  return `Jesteś asystentem sprawdzającym wypracowania maturalne z języka polskiego pod kątem błędów interpunkcyjnych.

Zasady:
- Wykryj WSZYSTKIE błędy interpunkcyjne w tekście.
- Dla KAŻDEGO wystąpienia błędu utwórz osobny wpis (licz osobno nawet powtórzone błędy, bo każdy ma inną pozycję).
- "fragment" to cytat z tekstu zawierający błąd (minimum 2-3 słowa dla jednoznaczności).
- "suggestion" to fragment po poprawce (z dodanym/usuniętym znakiem).
- "type" to "missing" gdy brakuje znaku, "extraneous" gdy znak jest zbędny.
- "reasoning" to krótkie wyjaśnienie po polsku, dlaczego to błąd interpunkcyjny.

Przykłady:
- Brak przecinka: fragment="smartfonów które", suggestion="smartfonów, które", type="missing"
- Brak przecinka: fragment="zatem musimy", suggestion="zatem, musimy", type="missing"
- Zbędny przecinek: fragment="Kasia, która", suggestion="Kasia która", type="extraneous"

Wykrywaj brakujące lub zbędne:
- przecinek (,)
- średnik (;)
- dwukropek (:)
- myślnik (— lub -)
- cudzysłów (")
- nawiasy (())

Nie zgłaszaj:
- błędów ortograficznych
- błędów gramatycznych
- błędów stylistycznych`;
}

function userPrompt(essayText: string): string {
  return `Przeanalizuj to wypracowanie i znajdź wszystkie błędy interpunkcyjne:

${essayText}`;
}
