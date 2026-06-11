import { Output } from "ai";
import { z } from "zod";

import {
  assignUniqueFragmentPositions,
  essayFragment,
  essayPrompt,
  runAnalyzer,
} from "./analyzer.js";

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
  points4c: number;
};

type PunctuationModelError = PunctuationErrorRaw & {
  occurrence_index?: number;
};

export async function analyzePunctuation(
  essayText: string,
  opts: { specNeeds?: boolean } = {},
): Promise<PunctuationResult> {
  const output = await runAnalyzer<PunctuationModelError[]>({
    output: Output.array({
      element: punctuationSchema(essayText),
    }),
    system: systemPrompt(),
    prompt: userPrompt(essayText),
    reasoningEffort: "xhigh",
  });

  const punctuationErrors = positionPunctuationErrors(essayText, output);

  return {
    punctuationErrors,
    points4c: scorePunctuation(punctuationErrors.length, opts),
  };
}

function punctuationSchema(essayText: string) {
  return z.object({
    fragment: essayFragment(essayText, "fragment", { minLength: 2 }),
    suggestion: z.string().min(2),
    reasoning: z.string(),
    occurrence_index: z.number().int().min(1).optional(),
  });
}

export function positionPunctuationErrors(
  essayText: string,
  errors: PunctuationModelError[],
): PunctuationError[] {
  return assignUniqueFragmentPositions(
    essayText,
    errors.map((error) => ({
      ...error,
      occurrenceIndex: error.occurrence_index,
    })),
  ).map((error) => {
    const {
      occurrence_index: _occurrenceIndexRaw,
      occurrenceIndex: _occurrenceIndex,
      fragmentPosition,
      ...publicError
    } = error;

    return {
      ...publicError,
      position:
        fragmentPosition +
        punctuationChangeOffset(error.fragment, error.suggestion),
    };
  });
}

export function punctuationChangeOffset(
  fragment: string,
  suggestion: string,
): number {
  const minLen = Math.min(fragment.length, suggestion.length);
  for (let i = 0; i < minLen; i++) {
    if (fragment[i] !== suggestion[i]) return i;
  }

  return minLen;
}

export function scorePunctuation(
  errorCount: number,
  opts: { specNeeds?: boolean } = {},
): number {
  if (opts.specNeeds) {
    if (errorCount <= 15) return 2;
    if (errorCount <= 30) return 1;
    return 0;
  }

  if (errorCount <= 8) return 2;
  if (errorCount <= 16) return 1;
  return 0;
}

function systemPrompt(): string {
  return `Jesteś asystentem sprawdzającym wypracowania maturalne z języka polskiego pod kątem błędów interpunkcyjnych.

Zasady:
- Wykryj WSZYSTKIE błędy interpunkcyjne w tekście.
- Dla KAŻDEGO wystąpienia błędu utwórz osobny wpis (licz osobno nawet powtórzone błędy, bo każdy ma inną pozycję).
- "fragment" to cytat z tekstu zawierający błąd (minimum 2-3 słowa dla jednoznaczności).
- "suggestion" to fragment po poprawce (z dodanym/usuniętym znakiem).
- "reasoning" to krótkie wyjaśnienie po polsku, dlaczego to błąd interpunkcyjny.
- "occurrence_index" to opcjonalny numer wystąpienia tego samego fragmentu w tekście, liczony od 1. Dodaj go tylko wtedy, gdy identyczny fragment występuje w tekście więcej niż raz.

Przykłady:
- Brak przecinka: fragment="smartfonów które", suggestion="smartfonów, które"
- Brak przecinka: fragment="zatem musimy", suggestion="zatem, musimy"
- Zbędny przecinek: fragment="Kasia, która", suggestion="Kasia która"

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
  return essayPrompt(
    "Przeanalizuj to wypracowanie i znajdź wszystkie błędy interpunkcyjne",
    essayText,
  );
}
