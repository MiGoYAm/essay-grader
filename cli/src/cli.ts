#!/usr/bin/env node
import 'dotenv/config';

import { analyzeLanguage } from './language.js';
import { analyzeOrthography } from './orthography.js';
import { renderTable } from './table.js';
import { readEssay, validateEnv } from './utils.js';

type CliOptions = {
  specNeeds: boolean;
};

async function main(argv: string[]): Promise<void> {
  const parsed = parseArgs(argv);

  if (!parsed) {
    usageAndExit(1);
  }

  validateEnv();
  const essayText = await readEssay(parsed.filePath);
  const [language, orthography] = await Promise.all([
    analyzeLanguage(essayText),
    analyzeOrthography(essayText, { specNeeds: parsed.opts.specNeeds }),
  ]);

  console.log(renderTable(language, orthography));
}

function parseArgs(argv: string[]): { filePath: string; opts: CliOptions } | null {
  const opts: CliOptions = { specNeeds: false };
  const args: string[] = [];

  for (const arg of argv) {
    if (arg === '--spec-needs' || arg === '-s') {
      opts.specNeeds = true;
    } else if (arg.startsWith('-')) {
      return null;
    } else {
      args.push(arg);
    }
  }

  if (args.length !== 1) {
    return null;
  }

  return { filePath: args[0]!, opts };
}

function usageAndExit(code: number): never {
  console.log('Uzycie: mature [--spec-needs] path/to/wypracowanie.txt');
  console.log('Opcje: --spec-needs, -s (progi CKE dla dysleksji/dysortografii/dysgrafii)');
  console.log('Wymagane: OPENAI_API_KEY');
  process.exit(code);
}

main(process.argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Blad: ${message}`);
  process.exit(1);
});
