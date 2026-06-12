import { z } from "zod";

import { essayFragment, essayPrompt, runAnalyzer } from "./analyzer.js";

export type StyleClass = "stosowny" | "niestosowny";

export type StyleIssue = {
  issue: string;
  fragment: string;
  reasoning: string;
};

export type StyleResult = {
  styleClass: StyleClass;
  issues: StyleIssue[];
  points3c: number;
};

type StyleModelOutput = {
  style_class: StyleClass;
  issues: StyleIssue[];
};

export async function analyzeStyle(
  essayText: string,
): Promise<StyleResult> {
  const output = await runAnalyzer<StyleModelOutput>({
    schema: styleSchema(essayText),
    system: systemPrompt(),
    prompt: userPrompt(essayText),
  });

  return {
    styleClass: output.style_class,
    issues: output.issues,
    points3c: points(output.style_class),
  };
}

function styleSchema(essayText: string) {
  return z.object({
    style_class: z.enum(["stosowny", "niestosowny"]),
    issues: z.array(
      z.object({
        issue: z.string(),
        fragment: essayFragment(essayText, "fragment"),
        reasoning: z.string(),
      }),
    ),
  });
}

function points(styleClass: StyleClass): number {
  return styleClass === "stosowny" ? 1 : 0;
}

function systemPrompt(): string {
  return `Oceniasz wypracowanie maturalne z języka polskiego wyłącznie w kryterium 3c CKE: styl wypowiedzi.

Kryterium 3c ocenia stosowność stylu wypowiedzi. Max 1 punkt.

Zasady oceny:
1. Styl wypowiedzi – co do zasady – powinien być: jasny, prosty (nie: zawiły, pretensjonalny), zwięzły, jednolity. Dodatkowo może być żywy, obrazowy.
2. Wypracowanie powinno być napisane stylem stosownym do sytuacji komunikacyjnej, jaką jest egzamin maturalny, co oznacza, że nie należy redagować go, stosując słownictwo charakterystyczne dla stylu potocznego w odmianie mówionej.
3. Styl uznaje się za stosowny w przeważającej części, jeżeli jest stosowany w orientacyjnie 2/3 pracy.
4. Styl jest niestosowny do sytuacji komunikacyjnej, jeżeli orientacyjnie ok. 2/3 wypracowania zredagowane jest przy użyciu struktur językowych charakterystycznych dla stylu potocznego w odmianie mówionej.
5. Styl wypracowania jest jednorodny, jeśli zdający konsekwentnie posługuje się jednym, wybranym stylem, odpowiednim dla treści i formy wypowiedzi, lub miesza różne style w wypowiedzi, ale jest to uzasadnione i celowe.
6. Indywidualne upodobania stylistyczne egzaminatora nie mogą wpływać na ocenę stylu pracy zdającego.

Poziomy oceny:
- "stosowny" (1 pkt): styl w całości lub w przeważającej części stosowny, tj. adekwatny do odmiany pisanej języka oraz do sytuacji komunikacyjnej (jednorodny albo funkcjonalnie niejednorodny).
- "niestosowny" (0 pkt): wypracowanie nie spełnia warunków określonych w kategorii "stosowny".

Zasady:
- "issues" to lista konkretnych problemów stylistycznych znalezionych w pracy, np. "Kolokwializm", "Pretensjonalne sformułowanie", "Styl zawiły", "Powtórzenie", "Niejednolitość stylu", "Słownictwo typowe dla odmiany mówionej".
- Każdy "issue" zawiera:
  - issue: nazwa problemu,
  - fragment: cytat z tekstu ilustrujący problem,
  - reasoning: krótkie wyjaśnienie po polsku, dlaczego to problem stylistyczny.
- Jeśli styl jest w pełni stosowny i nie ma żadnych problemów, zwróć pustą tablicę issues.
- Jeśli styl jest niestosowny, lista issues powinna zawierać przykłady ilustrujące problemy stylistyczne.`;
}

function userPrompt(essayText: string): string {
  return essayPrompt("Przeanalizuj styl tego wypracowania i zwróć wynik", essayText);
}
