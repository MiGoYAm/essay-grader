import { describe, expect, it } from "vitest";

import {
  positionPunctuationErrors,
  punctuationChangeOffset,
} from "./punctuation.js";

describe("positionPunctuationErrors", () => {
  it("returns the changed character position for a unique fragment", () => {
    const [error] = positionPunctuationErrors("Ala ma kota ktory spi.", [
      {
        fragment: "kota ktory",
        suggestion: "kota, ktory",
        reasoning: "Brak przecinka przed zdaniem podrzednym.",
      },
    ]);

    expect(error?.position).toBe(11);
  });

  it("does not reuse the first occurrence for repeated fragments", () => {
    const errors = positionPunctuationErrors("Kto czyta ten wie. Kto czyta ten mysli.", [
      {
        fragment: "czyta ten",
        suggestion: "czyta, ten",
        reasoning: "Brak przecinka.",
      },
      {
        fragment: "czyta ten",
        suggestion: "czyta, ten",
        reasoning: "Brak przecinka.",
      },
    ]);

    expect(errors.map((error) => error.position)).toEqual([9, 28]);
  });

  it("uses an explicit occurrence index when provided", () => {
    const [error] = positionPunctuationErrors("Raz dwa trzy. Raz dwa cztery.", [
      {
        fragment: "Raz dwa",
        suggestion: "Raz, dwa",
        reasoning: "Brak przecinka.",
        occurrence_index: 2,
      },
    ]);

    expect(error?.position).toBe(17);
  });

  it("skips unmatched fragments instead of returning -1", () => {
    const errors = positionPunctuationErrors("Ala ma kota.", [
        {
          fragment: "nie ma",
          suggestion: "nie, ma",
          reasoning: "Brak przecinka.",
        },
      ]);

    expect(errors).toEqual([]);
  });
});

describe("punctuationChangeOffset", () => {
  it("returns the first differing offset", () => {
    expect(punctuationChangeOffset("kota ktory", "kota, ktory")).toBe(4);
  });
});
