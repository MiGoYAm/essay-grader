import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

export function validateEnv(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Brak OPENAI_API_KEY w srodowisku');
  }
}

export async function readEssay(filePath: string): Promise<string> {
  if (extname(filePath).toLowerCase() !== '.txt') {
    throw new Error('Podaj plik .txt');
  }

  let content: string;

  try {
    content = await readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Nie mozna odczytac pliku: ${String(error)}`);
  }

  if (content.trim().length === 0) {
    throw new Error('Plik jest pusty');
  }

  return content;
}