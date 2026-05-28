import { Output } from "ai";
import { z } from "zod";

import { essayFragment, essayPrompt, runAnalyzer } from "./analyzer.js";

export type RangeClass = "szeroki" | "zadowalajacy" | "waski";

export type ErrorWithReasoning = {
  error: string;
  reasoning: string;
};

export type LanguageResult = {
  rangeClass: RangeClass;
  languageErrors: ErrorWithReasoning[];
  bucket: string;
  points4a: number;
};

type LanguageModelOutput = {
  range_class: RangeClass;
  language_errors: ErrorWithReasoning[];
};

export async function analyzeLanguage(
  essayText: string,
): Promise<LanguageResult> {
  const output = await runAnalyzer<LanguageModelOutput>({
    output: Output.object({
      schema: languageSchema(essayText),
    }),
    system: systemPrompt(),
    prompt: userPrompt(essayText),
  });

  return {
    rangeClass: output.range_class,
    languageErrors: output.language_errors,
    bucket: languageBucketLabel(output.language_errors.length),
    points4a: scoreLanguage(output.range_class, output.language_errors.length),
  };
}

function languageSchema(essayText: string) {
  return z.object({
    range_class: z.enum(["szeroki", "zadowalajacy", "waski"]),
    language_errors: z.array(
      z.object({
        error: essayFragment(essayText, "error"),
        reasoning: z.string(),
      }),
    ),
  });
}

export function scoreLanguage(rangeClass: RangeClass, errorCount: number): number {
  const matrix: Record<RangeClass, number[]> = {
    szeroki: [5, 4, 3, 2, 1, 0, 0, 0],
    zadowalajacy: [4, 3, 2, 1, 0, 0, 0, 0],
    waski: [3, 2, 1, 0, 0, 0, 0, 0],
  } as const;

  return matrix[rangeClass][languageBucketIndex(errorCount)] ?? 0;
}

export function languageBucketLabel(errorCount: number): string {
  switch (languageBucketIndex(errorCount)) {
    case 0:
      return "<=5";
    case 1:
      return "6-8";
    case 2:
      return "9-11";
    case 3:
      return "12-14";
    case 4:
      return "15-17";
    case 5:
      return "18-21";
    case 6:
      return "22-25";
    default:
      return ">=26";
  }
}

export function languageBucketIndex(errorCount: number): number {
  if (errorCount <= 5) return 0;
  if (errorCount <= 8) return 1;
  if (errorCount <= 11) return 2;
  if (errorCount <= 14) return 3;
  if (errorCount <= 17) return 4;
  if (errorCount <= 21) return 5;
  if (errorCount <= 25) return 6;
  return 7;
}

function systemPrompt(): string {
  return `Oceniasz wypracowanie maturalne z języka polskiego wyłącznie w kryterium 4a CKE: zakres i poprawność środków językowych.

Zasady:
- range_class określa zakres środków językowych: szeroki, zadowalajacy albo waski.
- language_errors to lista wyłącznie jednoznacznych błędów gramatyczno-składniowych w pracy.
- Każdy wpis w language_errors ma zawierać:
  - error: dokładny cytat błędnego słowa, zwrotu lub zdania z tekstu,
  - reasoning: krótkie wyjaśnienie po polsku, dlaczego cytat zawiera błąd gramatyczno-składniowy.
- Nie opisuj błędu w polu error. Pole error musi być cytatem z pracy.
- Uwzględniaj tylko błędy, w których da się wskazać niepoprawną formę gramatyczną, np. błędną zgodność podmiotu z orzeczeniem, błędną zgodność rodzaju, liczby lub przypadku, albo niepoprawną konstrukcję składniową.
- Nie licz błędów ortograficznych ani interpunkcyjnych do language_errors.
- Nie licz błędów leksykalnych, znaczeniowych, frazeologicznych, słowotwórczych ani stylistycznych do language_errors.
- Nie uznawaj za błąd językowy samej nieprecyzyjności, uproszczenia, niezręczności, powtórzenia, słabszego stylu, nieadekwatnego słowa ani indywidualnej preferencji stylistycznej.
- Nie dodawaj fragmentu do language_errors, jeśli proponowana poprawa dotyczy przecinka, ortografii, trafniejszego słowa, naturalniejszego brzmienia albo lepszego stylu.
- Jeśli fragment jest poprawny językowo, ale można by go napisać lepiej, nie dodawaj go do language_errors.
- Ten sam błąd językowy powtórzony w wypracowaniu licz tylko raz.
- Oceniając range_class, uwzględnij zróżnicowanie składni, zróżnicowanie leksyki, precyzję słownictwa i terminologii oraz poprawność użytych środków językowych.`;
}

function userPrompt(essayText: string): string {
  return essayPrompt("Przeanalizuj to wypracowanie i zwróć wynik", essayText);
}
