import { Output } from "ai";
import { z } from "zod";

import { essayFragment, essayPrompt, runAnalyzer } from "./analyzer.js";
import type { EssayTaskContext } from "./requirements.js";

export type FormalIssue = {
  criterion: string;
  fragment?: string;
  reasoning: string;
};

export type FormalResult = {
  noCardinalError: boolean;
  requiredReadingReferenced: boolean;
  addressesProblem: boolean;
  argumentative: boolean;
  planOrBulletForm: boolean;
  issues: FormalIssue[];
  reasoning: string;
  points1: number;
};

type FormalModelOutput = Omit<FormalResult, "points1">;

export async function analyzeFormalRequirements(
  essayText: string,
  context: EssayTaskContext = {},
): Promise<FormalResult> {
  const output = await runAnalyzer<FormalModelOutput>({
    output: Output.object({
      schema: formalSchema(essayText),
    }),
    system: systemPrompt(context),
    prompt: userPrompt(essayText),
  });

  return {
    ...output,
    points1: scoreFormalRequirements(output),
  };
}

function formalSchema(essayText: string) {
  return z.object({
    noCardinalError: z.boolean(),
    requiredReadingReferenced: z.boolean(),
    addressesProblem: z.boolean(),
    argumentative: z.boolean(),
    planOrBulletForm: z.boolean(),
    issues: z.array(
      z.object({
        criterion: z.string(),
        fragment: essayFragment(essayText, "fragment").optional(),
        reasoning: z.string(),
      }),
    ),
    reasoning: z.string(),
  });
}

export function scoreFormalRequirements(
  input: Pick<
    FormalResult,
    | "noCardinalError"
    | "requiredReadingReferenced"
    | "addressesProblem"
    | "argumentative"
    | "planOrBulletForm"
  >,
): number {
  if (input.planOrBulletForm) return 0;
  if (!input.noCardinalError) return 0;
  if (!input.requiredReadingReferenced) return 0;
  if (!input.addressesProblem) return 0;
  if (!input.argumentative) return 0;
  return 1;
}

function systemPrompt(context: EssayTaskContext): string {
  return `Oceniasz wypracowanie maturalne z języka polskiego wyłącznie w kryterium 1 CKE: Spełnienie formalnych warunków polecenia (SFWP).

Kontekst zadania:
- Temat/polecenie: ${context.topic ?? "nie podano; oceń, czy praca ma rozpoznawalny problem i stanowisko"}
- Lektury obowiązkowe wskazane/dopuszczone: ${context.requiredReadings?.join(", ") || "nie podano; rozpoznaj odwołanie do znanej lektury obowiązkowej, jeśli jest jednoznaczne"}

Przyznaj 1 pkt tylko wtedy, gdy WSZYSTKIE warunki są spełnione:
- nie występuje błąd kardynalny, czyli całkowicie nieuprawniona interpretacja lektury obowiązkowej świadcząca o nieznajomości głównych wątków lub losów głównych bohaterów,
- zdający odwołał się do lektury obowiązkowej; co najmniej jedno zdanie o tej lekturze ma charakter analityczny, nie wyłącznie informacyjny,
- wypracowanie przynajmniej częściowo dotyczy problemu wskazanego w poleceniu: obejmuje co najmniej jeden aspekt zagadnienia oraz opinię albo uzasadnienie,
- wypracowanie przynajmniej częściowo jest wypowiedzią argumentacyjną, czyli zawiera co najmniej jeden akapit argumentacyjny,
- wypowiedź nie jest napisana w formie planu ani w punktach.

Zwróć:
- noCardinalError, requiredReadingReferenced, addressesProblem, argumentative, planOrBulletForm,
- issues: lista niespełnionych lub wątpliwych warunków; fragment podawaj tylko wtedy, gdy da się wskazać cytat z pracy,
- reasoning: krótkie uzasadnienie po polsku.`;
}

function userPrompt(essayText: string): string {
  return essayPrompt("Przeanalizuj formalne warunki polecenia i zwróć wynik", essayText);
}
