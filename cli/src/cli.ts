#!/usr/bin/env node
import 'dotenv/config';

import { analyzeEssay } from './analyze.js';
import { renderTable } from './table.js';
import { readEssay, validateEnv } from './utils.js';

type CliOptions = {
  specNeeds: boolean;
  topic?: string;
  requiredReadings: string[];
};

async function main(argv: string[]): Promise<void> {
  const parsed = parseArgs(argv);

  if (!parsed) {
    usageAndExit(1);
  }

  validateEnv();
  const essayText = await readEssay(parsed.filePath);
  const analysis = await analyzeEssay(
    essayText,
    {
      specNeeds: parsed.opts.specNeeds,
      taskContext: {
        topic: parsed.opts.topic,
        requiredReadings: parsed.opts.requiredReadings,
      },
    },
  );

  console.log(renderTable(analysis));
}

function parseArgs(argv: string[]): { filePath: string; opts: CliOptions } | null {
  const opts: CliOptions = { specNeeds: false, requiredReadings: [] };
  const args: string[] = [];

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]!;
    if (arg === '--spec-needs' || arg === '-s') {
      opts.specNeeds = true;
    } else if (arg === '--topic') {
      const topic = argv[++index];
      if (!topic) return null;
      opts.topic = topic;
    } else if (arg === '--required-reading') {
      const reading = argv[++index];
      if (!reading) return null;
      opts.requiredReadings.push(reading);
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
  console.log('Uzycie: mature [--spec-needs] [--topic "..."] [--required-reading "..."] path/to/wypracowanie.txt');
  console.log('Opcje: --spec-needs, -s (progi CKE dla dysleksji/dysortografii/dysgrafii)');
  console.log('Opcje: --topic temat, --required-reading lektura (mozna powtarzac)');
  console.log('Wymagane: OPENAI_API_KEY');
  process.exit(code);
}

main(process.argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Blad: ${message}`);
  process.exit(1);
});
