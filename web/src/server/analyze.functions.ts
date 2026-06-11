import { createServerFn } from '@tanstack/react-start';

type AnalyzeInput = {
  text: string;
  specNeeds: boolean;
};

export const analyzeEssayServer = createServerFn({ method: 'POST' })
  .inputValidator((input: AnalyzeInput) => {
    if (!input || typeof input !== 'object') {
      throw new Error('Nieprawidlowe dane formularza.');
    }

    const text = typeof input.text === 'string' ? input.text.trim() : '';
    const specNeeds = Boolean(input.specNeeds);

    if (!text) {
      throw new Error('Wklej lub wczytaj tresc wypracowania.');
    }

    return { text, specNeeds };
  })
  .handler(async ({ data }) => {
    const [{ config }, { analyzeEssay }] = await Promise.all([
      import('dotenv'),
      import('mature-ts/analyze'),
    ]);

    config();

    return analyzeEssay(data.text, { specNeeds: data.specNeeds });
  });
