import { generateObject } from "ai";
import { z } from "zod";

import { defaultModel } from "./model.js";

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

const languageSchema = z.object({
  range_class: z.enum(["szeroki", "zadowalajacy", "waski"]),
  language_errors: z.array(
    z.object({
      error: z.string(),
      reasoning: z.string(),
    }),
  ),
});

export async function analyzeLanguage(
  essayText: string,
): Promise<LanguageResult> {
  const { object } = await generateObject({
    model: defaultModel(),
    schema: languageSchema,
    system: systemPrompt(),
    prompt: userPrompt(essayText),
  });

  return {
    rangeClass: object.range_class,
    languageErrors: object.language_errors,
    bucket: bucketLabel(object.language_errors.length),
    points4a: points(object.range_class, object.language_errors.length),
  };
}

function points(rangeClass: RangeClass, errorCount: number): number {
  const matrix: Record<RangeClass, number[]> = {
    szeroki: [5, 4, 3, 2, 1, 0, 0, 0],
    zadowalajacy: [4, 3, 2, 1, 0, 0, 0, 0],
    waski: [3, 2, 1, 0, 0, 0, 0, 0],
  } as const;

  return matrix[rangeClass][bucketIndex(errorCount)] ?? 0;
}

function bucketLabel(errorCount: number): string {
  switch (bucketIndex(errorCount)) {
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

function bucketIndex(errorCount: number): number {
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
  return `Oceniasz wypracowanie maturalne z jezyka polskiego wylacznie w kryterium 4a CKE: Zakres i poprawnosc srodkow jezykowych.

Zasady:
- language_errors to lista bledow jezykowych (fleksyjnych, skladniowych, leksykalnych, frazeologicznych, slowotworczych, stylistycznych).
- Kazdy wpis w language_errors ma miec error jako dokladny cytat z tekstu oraz reasoning jako krotkie wyjasnienie bledu po polsku.
- Nie licz bledow ortograficznych ani interpunkcyjnych do language_errors.
- Uwzglednij wyjasnienia CKE:
  1) Nie kazde nieprecyzyjne sformulowanie to blad jezykowy.
  2) Indywidualne preferencje stylistyczne nie moga wplywac na ocene.
  3) Zroznicowana skladnia: poprawnie uzyte co najmniej 4 rozne struktury skladniowe.
  4) Zroznicowana leksyka: synonimy, bogata frazeologia, precyzyjne slownictwo/terminologia.
  5) Nieuzasadnione powtorzenia nie obnizaja klasy zakresu, ale licza sie do bledow jezykowych.`;
}

function userPrompt(essayText: string): string {
  return `Przeanalizuj to wypracowanie i zwroc wynik:

${essayText}`;
}
