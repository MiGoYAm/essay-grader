import { describe, expect, it } from "vitest";

import { deriveCoherenceLevel, scoreCoherence } from "./coherence.js";

describe("deriveCoherenceLevel", () => {
  it("maps 0-2 disturbances to full coherence", () => {
    expect(deriveCoherenceLevel(0, true, true)).toBe("pelna");
    expect(deriveCoherenceLevel(2, true, true)).toBe("pelna");
  });

  it("maps 3-5 disturbances to partial coherence", () => {
    expect(deriveCoherenceLevel(3, true, true)).toBe("czesciowa");
    expect(deriveCoherenceLevel(5, true, true)).toBe("czesciowa");
  });

  it("maps 6-8 disturbances or one major section mismatch to inadequate coherence", () => {
    expect(deriveCoherenceLevel(6, true, true)).toBe("nieodpowiednia");
    expect(deriveCoherenceLevel(8, true, true)).toBe("nieodpowiednia");
    expect(deriveCoherenceLevel(1, false, true)).toBe("nieodpowiednia");
    expect(deriveCoherenceLevel(1, true, false)).toBe("nieodpowiednia");
  });

  it("maps 9+ disturbances or combined section failure to no coherence", () => {
    expect(deriveCoherenceLevel(9, true, true)).toBe("brak");
    expect(deriveCoherenceLevel(1, false, false)).toBe("brak");
  });
});

describe("scoreCoherence", () => {
  it("maps coherence levels to CKE points", () => {
    expect(scoreCoherence("pelna")).toBe(3);
    expect(scoreCoherence("czesciowa")).toBe(2);
    expect(scoreCoherence("nieodpowiednia")).toBe(1);
    expect(scoreCoherence("brak")).toBe(0);
  });
});
