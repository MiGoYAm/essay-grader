export const MIN_WORDS_FOR_COMPOSITION_AND_LANGUAGE = 300;

export type EssayTaskContext = {
  topic?: string;
  requiredReadings?: string[];
};

export function countEssayWords(essayText: string): number {
  return essayText.trim().match(/\S+/gu)?.length ?? 0;
}

export function shouldScoreCompositionAndLanguage(wordCount: number): boolean {
  return wordCount >= MIN_WORDS_FOR_COMPOSITION_AND_LANGUAGE;
}
