import { analyzeCoherence, type CoherenceResult } from './coherence.js';
import { analyzeFormalRequirements, type FormalResult } from './formal.js';
import { analyzeLanguage, type LanguageResult } from './language.js';
import { analyzeLiteraryCompetence, type LiteraryResult } from './literary.js';
import { analyzeOrthography, type OrthographyResult } from './orthography.js';
import { analyzePunctuation, type PunctuationResult } from './punctuation.js';
import {
  countEssayWords,
  type EssayTaskContext,
  shouldScoreCompositionAndLanguage,
} from './requirements.js';
import { analyzeStyle, type StyleResult } from './style.js';
import { analyzeStructure, type StructureResult } from './structure.js';

export type AnalyzeEssayOptions = {
  specNeeds?: boolean;
  taskContext?: EssayTaskContext;
};

export type EssayAnalysisResult = {
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

export async function analyzeEssay(
  essayText: string,
  opts: AnalyzeEssayOptions = {},
): Promise<EssayAnalysisResult> {
  const wordCount = countEssayWords(essayText);
  const [
    formal,
    literary,
    structure,
    language,
    orthography,
    punctuation,
    style,
    coherence,
  ] = await Promise.all([
    analyzeFormalRequirements(essayText, opts.taskContext),
    analyzeLiteraryCompetence(essayText, opts.taskContext),
    analyzeStructure(essayText),
    analyzeLanguage(essayText),
    analyzeOrthography(essayText, { specNeeds: opts.specNeeds }),
    analyzePunctuation(essayText, { specNeeds: opts.specNeeds }),
    analyzeStyle(essayText),
    analyzeCoherence(essayText),
  ]);

  return applyEssayRequirements({
    formal,
    literary,
    structure,
    language,
    orthography,
    punctuation,
    style,
    coherence,
  }, wordCount);
}

type RawEssayAnalysis = Omit<
  EssayAnalysisResult,
  "wordCount" | "compositionAndLanguageScored" | "totalScore" | "totalPartialScore"
>;

export function applyEssayRequirements(
  analysis: RawEssayAnalysis,
  wordCount: number,
): EssayAnalysisResult {
  const adjustedForFormal = analysis.formal.points1 === 0
    ? zeroAfterFormalFailure(analysis)
    : analysis;
  const adjustedForLiterary = adjustedForFormal.literary.points2 === 0
    ? zeroCompositionAndLanguagePoints(adjustedForFormal)
    : adjustedForFormal;
  const eligible = shouldScoreCompositionAndLanguage(wordCount);
  const adjusted = eligible
    ? adjustedForLiterary
    : zeroCompositionAndLanguagePoints(adjustedForLiterary);
  const totalScore = scoreTotal(adjusted);

  return {
    ...adjusted,
    wordCount,
    compositionAndLanguageScored: eligible,
    totalScore,
    totalPartialScore: totalScore,
  };
}

function zeroAfterFormalFailure(analysis: RawEssayAnalysis): RawEssayAnalysis {
  return {
    ...zeroCompositionAndLanguagePoints(analysis),
    literary: { ...analysis.literary, basePoints2: 0, points2: 0 },
  };
}

function zeroCompositionAndLanguagePoints(
  analysis: RawEssayAnalysis,
): RawEssayAnalysis {
  return {
    ...analysis,
    structure: { ...analysis.structure, points3a: 0 },
    language: { ...analysis.language, points4a: 0 },
    orthography: { ...analysis.orthography, points4b: 0 },
    punctuation: { ...analysis.punctuation, points4c: 0 },
    style: { ...analysis.style, points3c: 0 },
    coherence: { ...analysis.coherence, points3b: 0 },
  };
}

function scoreTotal(analysis: RawEssayAnalysis): number {
  return (
    analysis.formal.points1 +
    analysis.literary.points2 +
    analysis.structure.points3a +
    analysis.coherence.points3b +
    analysis.style.points3c +
    analysis.language.points4a +
    analysis.orthography.points4b +
    analysis.punctuation.points4c
  );
}
