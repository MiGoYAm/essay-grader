import { describe, expect, it } from "vitest";

import { applyEssayRequirements } from "./analyze.js";
import type { CoherenceResult } from "./coherence.js";
import { scoreFormalRequirements, type FormalResult } from "./formal.js";
import {
  languageBucketIndex,
  languageBucketLabel,
  type LanguageResult,
  scoreLanguage,
} from "./language.js";
import {
  scoreLiteraryBase,
  scoreLiteraryCompetence,
  type LiteraryResult,
} from "./literary.js";
import { type OrthographyResult, scoreOrthography } from "./orthography.js";
import { type PunctuationResult, scorePunctuation } from "./punctuation.js";
import {
  countEssayWords,
  MIN_WORDS_FOR_COMPOSITION_AND_LANGUAGE,
  shouldScoreCompositionAndLanguage,
} from "./requirements.js";
import type { StyleResult } from "./style.js";
import { scoreStructure, type StructureResult } from "./structure.js";

describe("formal requirements scoring", () => {
  it("requires all SFWP conditions and rejects plan form", () => {
    expect(scoreFormalRequirements({
      noCardinalError: true,
      requiredReadingReferenced: true,
      addressesProblem: true,
      argumentative: true,
      planOrBulletForm: false,
    })).toBe(1);

    expect(scoreFormalRequirements({
      noCardinalError: true,
      requiredReadingReferenced: false,
      addressesProblem: true,
      argumentative: true,
      planOrBulletForm: false,
    })).toBe(0);

    expect(scoreFormalRequirements({
      noCardinalError: true,
      requiredReadingReferenced: true,
      addressesProblem: true,
      argumentative: true,
      planOrBulletForm: true,
    })).toBe(0);
  });
});

describe("literary competence scoring", () => {
  it("maps CKE KLiK bands from work use and context use", () => {
    expect(scoreLiteraryBase("two_full", "bogata", "two_functional", true)).toBe(16);
    expect(scoreLiteraryBase("two_full", "zadowalajaca", "one_functional")).toBe(15);
    expect(scoreLiteraryBase("one_full_one_partial", "bogata", "two_functional", true)).toBe(12);
    expect(scoreLiteraryBase("two_partial_or_one_full", "trafna", "partial")).toBe(6);
    expect(scoreLiteraryBase("one_partial", "powierzchowna", "none")).toBe(1);
    expect(scoreLiteraryBase("none", "powierzchowna", "none")).toBe(0);
  });

  it("does not award top KLiK bands without required argumentation and erudition", () => {
    expect(scoreLiteraryBase("two_full", "bogata", "two_functional", false)).toBe(15);
    expect(scoreLiteraryBase("two_full", "powierzchowna", "two_functional", true)).toBe(13);
    expect(scoreLiteraryBase("two_partial_or_one_full", "trafna", "two_functional", false)).toBe(5);
  });

  it("subtracts factual errors without going below zero", () => {
    expect(scoreLiteraryCompetence(16, 2)).toBe(14);
    expect(scoreLiteraryCompetence(1, 3)).toBe(0);
  });
});

describe("structure scoring", () => {
  it("scores problem organization with division issues", () => {
    expect(scoreStructure("problemowa", false, false)).toBe(3);
    expect(scoreStructure("problemowa", true, false)).toBe(2);
    expect(scoreStructure("problemowa", true, true)).toBe(1);
  });

  it("scores partial problem organization and zeroes formal organization", () => {
    expect(scoreStructure("czesciowo_problemowa", false, false)).toBe(2);
    expect(scoreStructure("czesciowo_problemowa", true, false)).toBe(1);
    expect(scoreStructure("czesciowo_problemowa", true, true)).toBe(0);
    expect(scoreStructure("formalna", false, false)).toBe(0);
    expect(scoreStructure("niezorganizowana", false, false)).toBe(0);
  });
});

describe("language scoring", () => {
  it("maps error counts to CKE buckets", () => {
    expect(languageBucketIndex(5)).toBe(0);
    expect(languageBucketIndex(6)).toBe(1);
    expect(languageBucketIndex(8)).toBe(1);
    expect(languageBucketIndex(9)).toBe(2);
    expect(languageBucketIndex(26)).toBe(7);

    expect(languageBucketLabel(5)).toBe("<=5");
    expect(languageBucketLabel(26)).toBe(">=26");
  });

  it("scores range class and bucket combinations", () => {
    expect(scoreLanguage("szeroki", 0)).toBe(7);
    expect(scoreLanguage("szeroki", 12)).toBe(4);
    expect(scoreLanguage("zadowalajacy", 6)).toBe(5);
    expect(scoreLanguage("waski", 9)).toBe(3);
    expect(scoreLanguage("waski", 18)).toBe(0);
  });
});

describe("orthography scoring", () => {
  it("uses standard CKE thresholds by default", () => {
    expect(scoreOrthography(1)).toBe(2);
    expect(scoreOrthography(2)).toBe(1);
    expect(scoreOrthography(4)).toBe(1);
    expect(scoreOrthography(5)).toBe(0);
  });

  it("uses adjusted thresholds for special needs", () => {
    expect(scoreOrthography(4, { specNeeds: true })).toBe(2);
    expect(scoreOrthography(5, { specNeeds: true })).toBe(1);
    expect(scoreOrthography(8, { specNeeds: true })).toBe(1);
    expect(scoreOrthography(9, { specNeeds: true })).toBe(0);
  });
});

describe("punctuation scoring", () => {
  it("uses standard CKE thresholds", () => {
    expect(scorePunctuation(8)).toBe(2);
    expect(scorePunctuation(9)).toBe(1);
    expect(scorePunctuation(16)).toBe(1);
    expect(scorePunctuation(17)).toBe(0);
  });

  it("uses adjusted thresholds for special needs", () => {
    expect(scorePunctuation(15, { specNeeds: true })).toBe(2);
    expect(scorePunctuation(16, { specNeeds: true })).toBe(1);
    expect(scorePunctuation(30, { specNeeds: true })).toBe(1);
    expect(scorePunctuation(31, { specNeeds: true })).toBe(0);
  });
});

describe("essay requirements", () => {
  it("counts every whitespace-separated token as a CKE word, including numbers", () => {
    expect(countEssayWords("Rok 1984 to powiesc.\n\nTytul tez sie liczy.")).toBe(8);
  });

  it("requires at least 300 words before composition and language are scored", () => {
    expect(shouldScoreCompositionAndLanguage(MIN_WORDS_FOR_COMPOSITION_AND_LANGUAGE - 1)).toBe(false);
    expect(shouldScoreCompositionAndLanguage(MIN_WORDS_FOR_COMPOSITION_AND_LANGUAGE)).toBe(true);
  });

  it("zeros composition and language points below 300 words", () => {
    const result = applyEssayRequirements(analysisFixture(), 299);

    expect(result.compositionAndLanguageScored).toBe(false);
    expect(result.formal.points1).toBe(1);
    expect(result.literary.points2).toBe(16);
    expect(result.structure.points3a).toBe(0);
    expect(result.coherence.points3b).toBe(0);
    expect(result.style.points3c).toBe(0);
    expect(result.language.points4a).toBe(0);
    expect(result.orthography.points4b).toBe(0);
    expect(result.punctuation.points4c).toBe(0);
    expect(result.totalScore).toBe(17);
  });

  it("keeps composition and language points at 300 words", () => {
    const result = applyEssayRequirements(analysisFixture(), 300);

    expect(result.compositionAndLanguageScored).toBe(true);
    expect(result.totalScore).toBe(35);
    expect(result.totalPartialScore).toBe(35);
  });

  it("zeros every criterion after failed formal requirements", () => {
    const fixture = analysisFixture();
    fixture.formal = { ...fixture.formal, requiredReadingReferenced: false, points1: 0 };
    const result = applyEssayRequirements(fixture, 300);

    expect(result.formal.points1).toBe(0);
    expect(result.literary.points2).toBe(0);
    expect(result.structure.points3a).toBe(0);
    expect(result.totalScore).toBe(0);
  });

  it("keeps SFWP but zeros composition and language when KLiK is zero", () => {
    const fixture = analysisFixture();
    fixture.literary = { ...fixture.literary, basePoints2: 0, points2: 0 };
    const result = applyEssayRequirements(fixture, 300);

    expect(result.formal.points1).toBe(1);
    expect(result.literary.points2).toBe(0);
    expect(result.structure.points3a).toBe(0);
    expect(result.language.points4a).toBe(0);
    expect(result.totalScore).toBe(1);
  });
});

function analysisFixture(): {
  formal: FormalResult;
  literary: LiteraryResult;
  structure: StructureResult;
  language: LanguageResult;
  orthography: OrthographyResult;
  punctuation: PunctuationResult;
  style: StyleResult;
  coherence: CoherenceResult;
} {
  return {
    formal: {
      noCardinalError: true,
      requiredReadingReferenced: true,
      addressesProblem: true,
      argumentative: true,
      planOrBulletForm: false,
      issues: [],
      reasoning: "Spełnia.",
      points1: 1,
    },
    literary: {
      workUseLevel: "two_full",
      argumentationLevel: "bogata",
      contextUseLevel: "two_functional",
      erudition: true,
      factualErrors: [],
      reasoning: "Pełna realizacja.",
      basePoints2: 16,
      points2: 16,
    },
    structure: {
      contentOrganization: "problemowa",
      generalDivisionIssue: false,
      paragraphDivisionIssue: false,
      issues: [],
      reasoning: "Funkcjonalna struktura.",
      points3a: 3,
    },
    language: {
      rangeClass: "szeroki",
      languageErrors: [],
      bucket: "<=5",
      points4a: 7,
    },
    orthography: {
      orthographyErrors: [],
      points4b: 2,
    },
    punctuation: {
      punctuationErrors: [],
      points4c: 2,
    },
    style: {
      styleClass: "stosowny",
      issues: [],
      points3c: 1,
    },
    coherence: {
      level: "pelna",
      reasoning: "Spójne.",
      disturbanceCount: 0,
      disturbances: [],
      introCoherent: true,
      conclusionCoherent: true,
      points3b: 3,
    },
  };
}
