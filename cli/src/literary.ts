import { Output } from "ai";
import { z } from "zod";

import { essayFragment, essayPrompt, runAnalyzer } from "./analyzer.js";
import type { EssayTaskContext } from "./requirements.js";

export type WorkUseLevel =
  | "two_full"
  | "one_full_one_partial"
  | "two_partial_or_one_full"
  | "one_partial"
  | "none";

export type ArgumentationLevel =
  | "bogata"
  | "zadowalajaca"
  | "trafna"
  | "powierzchowna";

export type ContextUseLevel =
  | "two_functional"
  | "one_functional"
  | "partial"
  | "none";

export type FactualError = {
  error: string;
  fragment: string;
  reasoning: string;
};

export type LiteraryResult = {
  workUseLevel: WorkUseLevel;
  argumentationLevel: ArgumentationLevel;
  contextUseLevel: ContextUseLevel;
  erudition: boolean;
  factualErrors: FactualError[];
  reasoning: string;
  basePoints2: number;
  points2: number;
};

type LiteraryModelOutput = Omit<LiteraryResult, "basePoints2" | "points2">;

export async function analyzeLiteraryCompetence(
  essayText: string,
  context: EssayTaskContext = {},
): Promise<LiteraryResult> {
  const output = await runAnalyzer<LiteraryModelOutput>({
    output: Output.object({
      schema: literarySchema(essayText),
    }),
    system: systemPrompt(context),
    prompt: userPrompt(essayText),
    reasoningEffort: "xhigh",
  });
  const basePoints2 = scoreLiteraryBase(
    output.workUseLevel,
    output.argumentationLevel,
    output.contextUseLevel,
    output.erudition,
  );

  return {
    ...output,
    basePoints2,
    points2: scoreLiteraryCompetence(basePoints2, output.factualErrors.length),
  };
}

function literarySchema(essayText: string) {
  return z.object({
    workUseLevel: z.enum([
      "two_full",
      "one_full_one_partial",
      "two_partial_or_one_full",
      "one_partial",
      "none",
    ]),
    argumentationLevel: z.enum([
      "bogata",
      "zadowalajaca",
      "trafna",
      "powierzchowna",
    ]),
    contextUseLevel: z.enum([
      "two_functional",
      "one_functional",
      "partial",
      "none",
    ]),
    erudition: z.boolean(),
    factualErrors: z.array(
      z.object({
        error: z.string(),
        fragment: essayFragment(essayText, "fragment"),
        reasoning: z.string(),
      }),
    ),
    reasoning: z.string(),
  });
}

export function scoreLiteraryBase(
  workUseLevel: WorkUseLevel,
  argumentationLevel: ArgumentationLevel,
  contextUseLevel: ContextUseLevel,
  erudition = false,
): number {
  if (workUseLevel === "none") return 0;

  if (workUseLevel === "two_full") {
    if (contextUseLevel === "two_functional" && argumentationLevel === "bogata" && erudition) return 16;
    if (hasFunctionalContext(contextUseLevel) && atLeast(argumentationLevel, "zadowalajaca")) return 15;
    if (contextUseLevel === "partial" && atLeast(argumentationLevel, "zadowalajaca")) return 14;
    return 13;
  }

  if (workUseLevel === "one_full_one_partial") {
    if (contextUseLevel === "two_functional" && argumentationLevel === "bogata" && erudition) return 12;
    if (hasFunctionalContext(contextUseLevel) && atLeast(argumentationLevel, "zadowalajaca")) return 11;
    if (contextUseLevel === "partial") return 10;
    return 9;
  }

  if (workUseLevel === "two_partial_or_one_full") {
    if (contextUseLevel === "two_functional" && atLeast(argumentationLevel, "trafna") && erudition) return 8;
    if (hasFunctionalContext(contextUseLevel) && atLeast(argumentationLevel, "zadowalajaca")) return 7;
    if (contextUseLevel === "partial") return 6;
    return 5;
  }

  if (contextUseLevel === "two_functional" && atLeast(argumentationLevel, "trafna")) return 4;
  if (hasFunctionalContext(contextUseLevel) && atLeast(argumentationLevel, "zadowalajaca")) return 3;
  if (contextUseLevel === "partial") return 2;
  return 1;
}

export function scoreLiteraryCompetence(
  basePoints: number,
  factualErrorCount: number,
): number {
  return Math.max(0, basePoints - factualErrorCount);
}

function hasFunctionalContext(contextUseLevel: ContextUseLevel): boolean {
  return contextUseLevel === "two_functional" || contextUseLevel === "one_functional";
}

function atLeast(actual: ArgumentationLevel, expected: ArgumentationLevel): boolean {
  const rank: Record<ArgumentationLevel, number> = {
    powierzchowna: 0,
    trafna: 1,
    zadowalajaca: 2,
    bogata: 3,
  };

  return rank[actual] >= rank[expected];
}

function systemPrompt(context: EssayTaskContext): string {
  return `Oceniasz wypracowanie maturalne z języka polskiego wyłącznie w kryterium 2 CKE: Kompetencje literackie i kulturowe (KLiK).

Kontekst zadania:
- Temat/polecenie: ${context.topic ?? "nie podano; oceniaj funkcjonalność względem rozpoznawalnego problemu pracy"}
- Lektury obowiązkowe wskazane/dopuszczone: ${context.requiredReadings?.join(", ") || "nie podano; rozpoznaj lekturę obowiązkową, jeśli jest jednoznaczna"}

Oceń:
1. Funkcjonalność wykorzystania dwóch utworów: lektury obowiązkowej oraz innego utworu literackiego.
   - "two_full": dwa utwory wykorzystane w pełni funkcjonalnie.
   - "one_full_one_partial": jeden utwór w pełni funkcjonalnie, drugi częściowo funkcjonalnie.
   - "two_partial_or_one_full": dwa utwory częściowo funkcjonalnie ALBO tylko jeden utwór w pełni funkcjonalnie, a drugi niefunkcjonalnie.
   - "one_partial": tylko jeden utwór częściowo funkcjonalnie.
   - "none": żaden utwór nie został wykorzystany przynajmniej częściowo funkcjonalnie.
2. Poziom argumentacji: bogata, zadowalajaca, trafna albo powierzchowna.
3. Wykorzystanie kontekstów:
   - "two_functional": dwa konteksty wykorzystane funkcjonalnie.
   - "one_functional": co najmniej jeden kontekst wykorzystany funkcjonalnie.
   - "partial": kontekst/konteksty wykorzystane częściowo funkcjonalnie.
   - "none": brak funkcjonalnie wykorzystanych kontekstów.
4. Erudycję: czy praca funkcjonalnie wykorzystuje wiedzę przedmiotową.
5. Błędy rzeczowe. Każdy dokładnie ten sam błąd licz raz. Nie licz błędów ortograficznych jako rzeczowych, jeśli zapis nadal pozwala rozpoznać autora/bohatera.

Ważne zasady CKE:
- Samo streszczenie utworu bez wniosku lub refleksji nie jest wykorzystaniem funkcjonalnym.
- Do oceny wybierz dwa utwory wykorzystane najfunkcjonalniej, z których jeden musi być lekturą obowiązkową; pozostałe mogą być kontekstem literackim.
- W ocenie argumentacji nie uwzględniaj fragmentów zawierających błędy rzeczowe.

Zwróć workUseLevel, argumentationLevel, contextUseLevel, erudition, factualErrors i reasoning.`;
}

function userPrompt(essayText: string): string {
  return essayPrompt("Przeanalizuj kompetencje literackie i kulturowe i zwróć wynik", essayText);
}
