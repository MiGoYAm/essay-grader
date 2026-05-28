import { describe, expect, it } from "vitest";

import {
  languageBucketIndex,
  languageBucketLabel,
  scoreLanguage,
} from "./language.js";
import { scoreOrthography } from "./orthography.js";

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
    expect(scoreLanguage("szeroki", 0)).toBe(5);
    expect(scoreLanguage("szeroki", 12)).toBe(2);
    expect(scoreLanguage("zadowalajacy", 6)).toBe(3);
    expect(scoreLanguage("waski", 9)).toBe(1);
    expect(scoreLanguage("waski", 12)).toBe(0);
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
