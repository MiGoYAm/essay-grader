import type { LanguageResult } from "./language.js";
import type { OrthographyResult } from "./orthography.js";
import type { PunctuationResult } from "./punctuation.js";

export function renderTable(
  language: LanguageResult,
  orthography: OrthographyResult,
  punctuation: PunctuationResult,
): string {
  const rows4a = [
    ["Kryterium", "4a Zakres i poprawnosc srodkow jezykowych"],
    ["Zakres", language.rangeClass],
    ["Bledy jezykowe", language.languageErrors.length.toString()],
    ["Przedzial CKE", language.bucket],
    ["Punkty 4a", language.points4a.toString()],
  ];

  const rows4b = [
    ["Kryterium", "4b Poprawnosc ortograficzna"],
    ["Bledy ortograficzne", orthography.orthographyErrors.length.toString()],
    ["Punkty 4b", orthography.points4b.toString()],
  ];

  const rowsPunct = [
    ["Kryterium", "Interpunkcja (informacyjnie)"],
    ["Bledy interpunkcyjne", punctuation.punctuationErrors.length.toString()],
  ];

  const totalRows = [
    ["Suma czesciowa", "4a + 4b"],
    ["Punkty", (language.points4a + orthography.points4b).toString()],
  ];

  return [
    drawTable(rows4a),
    "",
    "Bledy jezykowe (4a):",
    renderErrors(language.languageErrors),
    "",
    drawTable(rows4b),
    "",
    "Bledy ortograficzne (4b):",
    renderErrors(orthography.orthographyErrors),
    "",
    drawTable(rowsPunct),
    "",
    "Bledy interpunkcyjne:",
    renderPunctuationErrors(punctuation.punctuationErrors),
    "",
    drawTable(totalRows),
  ].join("\n");
}

function renderErrors(
  errors: { error: string; correct?: string; reasoning?: string }[],
): string {
  if (errors.length === 0) {
    return "Brak.";
  }

  return errors
    .map(
      (error, index) =>
        `${index + 1}. "${error.error}" - ${error.correct ?? error.reasoning}`,
    )
    .join("\n");
}

function renderPunctuationErrors(
  errors: {
    fragment: string;
    suggestion: string;
    reasoning: string;
    position: number;
  }[],
): string {
  if (errors.length === 0) {
    return "Brak.";
  }

  return errors
    .map((error, index) => {
      return `${index + 1}. Pozycja ${error.position}: "${error.fragment}" → "${error.suggestion}" — ${error.reasoning}`;
    })
    .join("\n");
}

function drawTable(rows: string[][]): string {
  const col1Width = Math.max(...rows.map((row) => row[0]?.length ?? 0));
  const col2Width = Math.max(...rows.map((row) => row[1]?.length ?? 0));
  const border = `+-${"-".repeat(col1Width)}-+-${"-".repeat(col2Width)}-+`;
  const body = rows
    .map(([c1, c2]) => `| ${c1.padEnd(col1Width)} | ${c2.padEnd(col2Width)} |`)
    .join("\n");

  return [border, body, border].join("\n");
}
