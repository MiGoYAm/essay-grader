import type { CoherenceResult } from "./coherence.js";
import type { FormalResult } from "./formal.js";
import type { LanguageResult } from "./language.js";
import type { LiteraryResult } from "./literary.js";
import type { OrthographyResult } from "./orthography.js";
import type { PunctuationResult } from "./punctuation.js";
import type { StyleResult } from "./style.js";
import type { StructureResult } from "./structure.js";

type TableAnalysis = {
  formal: FormalResult;
  literary: LiteraryResult;
  structure: StructureResult;
  language: LanguageResult;
  orthography: OrthographyResult;
  punctuation: PunctuationResult;
  style: StyleResult;
  coherence: CoherenceResult;
  wordCount: number;
  compositionAndLanguageScored: boolean;
  totalScore: number;
  totalPartialScore: number;
};

export function renderTable(
  analysis: TableAnalysis,
): string {
  const {
    formal,
    literary,
    structure,
    language,
    orthography,
    punctuation,
    style,
    coherence,
    wordCount,
    compositionAndLanguageScored,
    totalScore,
  } = analysis;
  const rowsEligibility = [
    ["Wymog", "Minimum 300 wyrazow"],
    ["Liczba wyrazow", wordCount.toString()],
    ["Kompozycja i jezyk", compositionAndLanguageScored ? "oceniane" : "0 pkt (<300 wyrazow)"],
  ];

  const rows1 = [
    ["Kryterium", "1 SFWP"],
    ["Brak bledu kardynalnego", formal.noCardinalError ? "tak" : "nie"],
    ["Lektura obowiazkowa", formal.requiredReadingReferenced ? "tak" : "nie"],
    ["Dotyczy problemu", formal.addressesProblem ? "tak" : "nie"],
    ["Argumentacyjna", formal.argumentative ? "tak" : "nie"],
    ["Plan/punkty", formal.planOrBulletForm ? "tak" : "nie"],
    ["Punkty 1", formal.points1.toString()],
  ];

  const rows2 = [
    ["Kryterium", "2 Kompetencje literackie i kulturowe"],
    ["Utwory", literary.workUseLevel],
    ["Argumentacja", literary.argumentationLevel],
    ["Konteksty", literary.contextUseLevel],
    ["Bledy rzeczowe", literary.factualErrors.length.toString()],
    ["Punkty bazowe", literary.basePoints2.toString()],
    ["Punkty 2", literary.points2.toString()],
  ];

  const rows3a = [
    ["Kryterium", "3a Struktura wypowiedzi"],
    ["Organizacja", structure.contentOrganization],
    ["Usterka ogolna", structure.generalDivisionIssue ? "tak" : "nie"],
    ["Usterka akapitow", structure.paragraphDivisionIssue ? "tak" : "nie"],
    ["Punkty 3a", structure.points3a.toString()],
  ];

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

  const rows3b = [
    ["Kryterium", "3b Spojnosc wypowiedzi"],
    ["Poziom", coherence.level],
    ["Zaburzenia", coherence.disturbanceCount.toString()],
    ["Wstep spójny", coherence.introCoherent ? "tak" : "nie"],
    ["Zakonczenie spojne", coherence.conclusionCoherent ? "tak" : "nie"],
    ["Punkty 3b", coherence.points3b.toString()],
  ];

  const rows3c = [
    ["Kryterium", "3c Styl wypowiedzi"],
    ["Ocena", style.styleClass === "stosowny" ? "stosowny" : "niestosowny"],
    ["Punkty 3c", style.points3c.toString()],
  ];

  const rowsPunct = [
    ["Kryterium", "4c Poprawnosc interpunkcyjna"],
    ["Bledy interpunkcyjne", punctuation.punctuationErrors.length.toString()],
    ["Punkty 4c", punctuation.points4c.toString()],
  ];

  const totalRows = [
    ["Suma", "1 + 2 + 3a + 3b + 3c + 4a + 4b + 4c"],
    ["Punkty", `${totalScore}/35`],
  ];

  return [
    drawTable(rowsEligibility),
    "",
    drawTable(rows1),
    "",
    `SFWP: ${formal.reasoning}`,
    renderFormalIssues(formal.issues),
    "",
    drawTable(rows2),
    "",
    `KLiK: ${literary.reasoning}`,
    renderFactualErrors(literary.factualErrors),
    "",
    drawTable(rows3a),
    "",
    `Struktura (3a): ${structure.reasoning}`,
    renderStructureIssues(structure.issues),
    "",
    drawTable(rows3b),
    "",
    `Zaburzenia spojnosci (3b): ${coherence.reasoning}`,
    renderCoherenceDisturbances(coherence.disturbances),
    "",
    drawTable(rows3c),
    "",
    "Problemy stylistyczne (3c):",
    renderStyleIssues(style.issues),
    "",
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

function renderFormalIssues(issues: { criterion: string; fragment?: string; reasoning: string }[]): string {
  if (issues.length === 0) {
    return "Brak.";
  }

  return issues
    .map((item, index) => {
      const fragment = item.fragment ? ` "${item.fragment}" -` : "";
      return `${index + 1}. ${item.criterion}:${fragment} ${item.reasoning}`;
    })
    .join("\n");
}

function renderFactualErrors(errors: { error: string; fragment: string; reasoning: string }[]): string {
  if (errors.length === 0) {
    return "Brak bledow rzeczowych.";
  }

  return errors
    .map(
      (error, index) =>
        `${index + 1}. ${error.error}: "${error.fragment}" - ${error.reasoning}`,
    )
    .join("\n");
}

function renderStructureIssues(
  issues: { issue: string; fragment: string; reasoning: string }[],
): string {
  if (issues.length === 0) {
    return "Brak.";
  }

  return issues
    .map(
      (item, index) =>
        `${index + 1}. ${item.issue}: "${item.fragment}" - ${item.reasoning}`,
    )
    .join("\n");
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

function renderCoherenceDisturbances(
  disturbances: { issue: string; fragment: string; reasoning: string }[],
): string {
  if (disturbances.length === 0) {
    return "Brak.";
  }

  return disturbances
    .map(
      (item, index) =>
        `${index + 1}. ${item.issue}: "${item.fragment}" — ${item.reasoning}`,
    )
    .join("\n");
}

function renderStyleIssues(
  issues: { issue: string; fragment: string; reasoning: string }[],
): string {
  if (issues.length === 0) {
    return "Brak.";
  }

  return issues
    .map(
      (item, index) =>
        `${index + 1}. ${item.issue}: "${item.fragment}" — ${item.reasoning}`,
    )
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
