import { Output } from "ai";
import { z } from "zod";

import { essayFragment, essayPrompt, runAnalyzer } from "./analyzer.js";

export type CoherenceLevel = "pelna" | "czesciowa" | "nieodpowiednia" | "brak";

export type CoherenceDisturbance = {
  issue: string;
  fragment: string;
  reasoning: string;
};

export type CoherenceResult = {
  level: CoherenceLevel;
  reasoning: string;
  disturbanceCount: number;
  disturbances: CoherenceDisturbance[];
  introCoherent: boolean;
  conclusionCoherent: boolean;
  points3b: number;
};

type CoherenceModelOutput = {
  reasoning: string;
  disturbances: CoherenceDisturbance[];
  intro_coherent: boolean;
  conclusion_coherent: boolean;
};

export async function analyzeCoherence(
  essayText: string,
): Promise<CoherenceResult> {
  const output = await runAnalyzer<CoherenceModelOutput>({
    output: Output.object({
      schema: coherenceSchema(essayText),
    }),
    system: systemPrompt(),
    prompt: userPrompt(essayText),
  });
  const disturbanceCount = output.disturbances.length;
  const level = deriveCoherenceLevel(
    disturbanceCount,
    output.intro_coherent,
    output.conclusion_coherent,
  );

  return {
    level,
    reasoning: output.reasoning,
    disturbanceCount,
    disturbances: output.disturbances,
    introCoherent: output.intro_coherent,
    conclusionCoherent: output.conclusion_coherent,
    points3b: scoreCoherence(level),
  };
}

function coherenceSchema(essayText: string) {
  return z.object({
    reasoning: z.string(),
    intro_coherent: z.boolean(),
    conclusion_coherent: z.boolean(),
    disturbances: z.array(
      z.object({
        issue: z.string(),
        fragment: essayFragment(essayText, "fragment"),
        reasoning: z.string(),
      }),
    ),
  });
}

export function deriveCoherenceLevel(
  disturbanceCount: number,
  introCoherent: boolean,
  conclusionCoherent: boolean,
): CoherenceLevel {
  if (disturbanceCount >= 9 || (!introCoherent && !conclusionCoherent)) {
    return "brak";
  }

  if (disturbanceCount >= 6 || !introCoherent || !conclusionCoherent) {
    return "nieodpowiednia";
  }

  if (disturbanceCount >= 3) return "czesciowa";
  return "pelna";
}

export function scoreCoherence(level: CoherenceLevel): number {
  if (level === "brak") return 0;
  if (level === "nieodpowiednia") return 1;
  if (level === "czesciowa") return 2;
  if (level === "pelna") return 3;
  return 0;
}

function systemPrompt(): string {
  return `Oceniasz wypracowanie maturalne z języka polskiego wyłącznie w kryterium 3b CKE: spójność wypowiedzi.

Kryterium 3b ocenia spójność i logiczne uporządkowanie wypowiedzi. Max 3 punkty.

Zasady oceny:
1. Wypowiedź jest spójna, jeżeli elementy, które ją tworzą, stanowią logiczną i uporządkowaną całość.
2. Wywód jest uporządkowany, jeśli każdy kolejny akapit wynika z poprzedniego, a np. przestawienie akapitów zaburzyłoby tok rozumowania przyjęty przez zdającego.
3. Zaburzenia w spójności mogą wynikać m.in. z:
   a) błędów logicznych, w tym ze zbyt daleko idących uogólnień, nieuzasadnionych wniosków (np. wnioski w zakończeniu pracy nie wynikają z przeprowadzonego rozumowania), sprzecznych stwierdzeń
   b) odstępstw od podporządkowania wywodu myśli przewodniej, np. wypracowanie zawiera niefunkcjonalne fragmenty stanowiące niezwiązane z tematem wątki poboczne
   c) zredagowaniu wstępu lub rozwinięcia, lub zakończenia, lub akapitu, które nie pasują logicznie do pozostałej części wypracowania, nie łączą się logicznie z poprzedzającą je częścią / poprzedzającym je akapitem
   d) rozwijania jednocześnie więcej niż jednego wątku ("zazębiania" się wątków)
   e) pomijania pośrednich ogniw rozumowania, tzw. skróty myślowe
   f) wprowadzenie treści nieistotnych, zbędnych dla pracy, bez związku / pozostających w wątpliwym związku z tematem/wywodem
   g) wprowadzania dygresji stosowanych niefunkcjonalnie
   h) przerywania toku myślenia zbędnymi zdaniami.
4. Błędy w spójności wewnątrz akapitów oznaczają np. nielogiczne połączenia zdań w akapicie oraz brak zastosowania w nim wskaźników zespolenia.
5. Błędy w spójności między akapitami oznaczają nielogiczne powiązanie danego akapitu z poprzednim lub poprzednimi akapitami oraz brak zastosowania wskaźników zespolenia między akapitami.
6. Błąd w składni prowadzący do błędu w spójności jest traktowany zarówno jako błąd językowy, jak i błąd w spójności.

Poziomy oceny:
- "pelna" (3 pkt): wypowiedź jest w całości spójna lub występują w niej nie więcej niż 2 zaburzenia w spójności (tj. logice, uporządkowaniu) na poziomie poszczególnych akapitów LUB całej wypowiedzi.
- "czesciowa" (2 pkt): w wypowiedzi występuje 3–5 zaburzeń w spójności (tj. logice, uporządkowaniu) na poziomie poszczególnych akapitów LUB całej wypowiedzi.
- "nieodpowiednia" (1 pkt): w wypowiedzi występuje 6–8 zaburzeń w spójności LUB wstęp pracy jest treściowo niespójny z częścią zasadniczą pracy ALBO z zakończeniem pracy LUB zakończenie pracy jest treściowo niespójne z wstępem ALBO częścią zasadniczą pracy.
- "brak" (0 pkt): w wypowiedzi występuje 9 lub więcej zaburzeń w spójności LUB wstęp pracy jest treściowo niespójny z częścią zasadniczą pracy ORAZ z zakończeniem pracy LUB zakończenie pracy jest treściowo niespójne z wstępem ORAZ częścią zasadniczą pracy.

Zasady:
- "intro_coherent" określa, czy wstęp pracy jest logicznie spójny z częścią zasadniczą.
- "conclusion_coherent" określa, czy zakończenie pracy jest logicznie spójne z częścią zasadniczą.
- "reasoning" to krótkie uzasadnienie oceny po polsku.
- "disturbances" to lista konkretnych zaburzeń spójności znalezionych w pracy.
- Każdy "disturbance" zawiera:
  - issue: rodzaj zaburzenia (np. "Błąd logiczny", "Nieuzasadniony wniosek", "Niefunkcjonalny wątek poboczny", "Nielogiczne połączenie akapitów", "Skrót myślowy", "Dygresja niefunkcjonalna", "Zbędne zdanie przerywające tok myślenia", "Sprzeczne stwierdzenia", "Wewnątrz akapitu: brak wskaźników zespolenia", "Między akapitami: brak wskaźników zespolenia", "Wstęp niespójny z częścią zasadniczą", "Zakończenie niespójne z częścią zasadniczą"),
  - fragment: cytat z tekstu ilustrujący zaburzenie,
  - reasoning: krótkie wyjaśnienie po polsku, dlaczego to zaburzenie spójności.
- Jeśli nie ma żadnych zaburzeń, zwróć pustą tablicę disturbances.
- Nie dodawaj fragmentu do disturbances, jeśli nie można go znaleźć w tekście.`;
}

function userPrompt(essayText: string): string {
  return essayPrompt(
    "Przeanalizuj spójność tego wypracowania i zwróć wynik",
    essayText,
  );
}
