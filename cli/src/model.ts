import { openai } from "@ai-sdk/openai";

export function defaultModel() {
  return openai("gpt-5.4-mini");
}
