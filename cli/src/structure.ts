import { z } from "zod";

import { essayFragment, essayPrompt, runAnalyzer } from "./analyzer.js";

export type ContentOrganization =
  | "problemowa"
  | "czesciowo_problemowa"
  | "formalna"
  | "niezorganizowana";

export type StructureIssue = {
  issue: string;
  fragment: string;
  reasoning: string;
};

export type StructureResult = {
  contentOrganization: ContentOrganization;
  generalDivisionIssue: boolean;
  paragraphDivisionIssue: boolean;
  issues: StructureIssue[];
  reasoning: string;
  points3a: number;
};

type StructureModelOutput = Omit<StructureResult, "points3a">;

export async function analyzeStructure(
  essayText: string,
): Promise<StructureResult> {
  const output = await runAnalyzer<StructureModelOutput>({
    schema: structureSchema(essayText),
    system: systemPrompt(),
    prompt: userPrompt(essayText),
  });

  return {
    ...output,
    points3a: scoreStructure(
      output.contentOrganization,
      output.generalDivisionIssue,
      output.paragraphDivisionIssue,
    ),
  };
}

function structureSchema(essayText: string) {
  return z.object({
    contentOrganization: z.enum([
      "problemowa",
      "czesciowo_problemowa",
      "formalna",
      "niezorganizowana",
    ]),
    generalDivisionIssue: z.boolean(),
    paragraphDivisionIssue: z.boolean(),
    issues: z.array(
      z.object({
        issue: z.string(),
        fragment: essayFragment(essayText, "fragment"),
        reasoning: z.string(),
      }),
    ),
    reasoning: z.string(),
  });
}

export function scoreStructure(
  contentOrganization: ContentOrganization,
  generalDivisionIssue: boolean,
  paragraphDivisionIssue: boolean,
): number {
  if (
    contentOrganization === "formalna" ||
    contentOrganization === "niezorganizowana"
  ) {
    return 0;
  }

  const issueCount = Number(generalDivisionIssue) + Number(paragraphDivisionIssue);

  if (contentOrganization === "problemowa") {
    return Math.max(1, 3 - issueCount);
  }

  return Math.max(0, 2 - issueCount);
}

function systemPrompt(): string {
  return `Oceniasz wypracowanie maturalne z języka polskiego wyłącznie w kryterium 3a CKE: Struktura wypowiedzi.

Oceń dwa aspekty:
1. Uporządkowanie elementów treściowych:
   - "problemowa": w całości lub w przeważającej części zorganizowane problemowo; bloki rozwinięcia omawiają aspekty problemu, a nie tylko kolejne teksty.
   - "czesciowo_problemowa": podjęto próbę organizacji problemowej albo organizacja jest częściowo problemowa, częściowo formalna.
   - "formalna": w całości lub w przeważającej części zorganizowane wyłącznie formalnie, np. według kolejno omawianych tekstów.
   - "niezorganizowana": zbiór w znacznej mierze niezależnych elementów.
2. Podział wypowiedzi:
   - generalDivisionIssue: usterka w skali ogólnej, np. brak lub niefunkcjonalne proporcje wstępu, rozwinięcia, zakończenia.
   - paragraphDivisionIssue: usterka w strukturze akapitów, np. akapit nie jest zwartą myślowo całością albo powinien zostać podzielony.

Nie obniżaj oceny struktury za samo niezrealizowanie któregoś elementu tematu, np. brak odwołania do wymaganego tekstu; to należy do innych kryteriów.

Zwróć contentOrganization, generalDivisionIssue, paragraphDivisionIssue, issues i reasoning.`;
}

function userPrompt(essayText: string): string {
  return essayPrompt("Przeanalizuj strukturę tego wypracowania i zwróć wynik", essayText);
}
