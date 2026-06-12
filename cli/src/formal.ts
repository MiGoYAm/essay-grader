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

type FormalModelIssue = Omit<FormalIssue, "fragment"> & {
  fragment: string | null;
};

type FormalModelOutput = Omit<FormalResult, "issues" | "points1"> & {
  issues: FormalModelIssue[];
};

export async function analyzeFormalRequirements(
  essayText: string,
  context: EssayTaskContext = {},
): Promise<FormalResult> {
  const output = await runAnalyzer<FormalModelOutput>({
    schema: formalSchema(essayText),
    system: systemPrompt(context),
    prompt: userPrompt(essayText),
  });

  const normalizedOutput = {
    ...output,
    issues: normalizeFormalIssues(output.issues),
  };

  return {
    ...normalizedOutput,
    points1: scoreFormalRequirements(normalizedOutput),
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
        fragment: essayFragment(essayText, "fragment").nullable(),
        reasoning: z.string(),
      }),
    ),
    reasoning: z.string(),
  });
}

function normalizeFormalIssues(issues: FormalModelIssue[]): FormalIssue[] {
  return issues.map(({ fragment, ...issue }) => {
    if (fragment === null) {
      return issue;
    }

    return { ...issue, fragment };
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
- issues: lista niespełnionych lub wątpliwych warunków; fragment ustaw na cytat z pracy albo null, jeśli nie da się wskazać cytatu,
- reasoning: krótkie uzasadnienie po polsku.`;
}

function userPrompt(essayText: string): string {
  return essayPrompt("Przeanalizuj formalne warunki polecenia i zwróć wynik", essayText);
}
