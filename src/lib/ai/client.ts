import Anthropic from "@anthropic-ai/sdk";

/** Default model for extraction and the assistant. Override with ANTHROPIC_MODEL. */
export const AI_MODEL = process.env.ANTHROPIC_MODEL?.trim() || "claude-opus-5";

/** Beta flag for server-side refusal fallbacks (`fallbacks: "default"`). */
export const AI_BETAS = ["server-side-fallback-2026-07-01"] as const;

let client: Anthropic | null = null;

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function getAnthropic(): Anthropic {
  if (!isAiConfigured()) {
    throw new AiNotConfiguredError();
  }
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxRetries: 2,
      timeout: 5 * 60 * 1000,
    });
  }
  return client;
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI är inte konfigurerat (ANTHROPIC_API_KEY saknas).");
    this.name = "AiNotConfiguredError";
  }
}

export class AiRefusalError extends Error {
  constructor(message = "AI-modellen avböjde att behandla innehållet.") {
    super(message);
    this.name = "AiRefusalError";
  }
}

/** Maps SDK/API errors to a short Swedish message safe to show users. */
export function describeAiError(error: unknown): string {
  if (error instanceof AiNotConfiguredError) return error.message;
  if (error instanceof AiRefusalError) return error.message;
  if (error instanceof Anthropic.AuthenticationError) return "AI-nyckeln är ogiltig (ANTHROPIC_API_KEY).";
  if (error instanceof Anthropic.RateLimitError) return "AI-tjänsten är tillfälligt överbelastad. Försök igen om en stund.";
  if (error instanceof Anthropic.BadRequestError) return "AI-tjänsten kunde inte behandla begäran.";
  if (error instanceof Anthropic.APIConnectionError) return "Kunde inte nå AI-tjänsten. Kontrollera nätverket.";
  if (error instanceof Anthropic.APIError) return `AI-fel (${error.status ?? "okänt"}).`;
  if (error instanceof Error) return error.message;
  return "Okänt fel.";
}
