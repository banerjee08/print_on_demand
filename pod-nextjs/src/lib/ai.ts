/**
 * Smart AI Router
 *
 * Priority order:
 * 1. Groq (if GROQ_API_KEY is set) — fast cloud LLM, free tier
 * 2. Ollama (local fallback) — requires Ollama running at OLLAMA_BASE_URL
 *
 * All API routes should import from here instead of ollama/groq directly.
 */

import { groq, GroqService } from "./groq";
import { ollama, OllamaService } from "./ollama";

type AIService = {
  analyzePrompt: GroqService["analyzePrompt"];
  generateSlogans: GroqService["generateSlogans"];
  generateMarketing: GroqService["generateMarketing"];
};

function getAIService(): AIService {
  const hasGroq =
    typeof process.env.GROQ_API_KEY === "string" &&
    process.env.GROQ_API_KEY.trim().length > 0;

  if (hasGroq) {
    return groq;
  }

  // Ollama fallback
  return {
    analyzePrompt: ollama.analyzePrompt.bind(ollama),
    generateSlogans: ollama.generateSlogans.bind(ollama),
    generateMarketing: ollama.generateMarketing.bind(ollama),
  };
}

export const ai = getAIService();
