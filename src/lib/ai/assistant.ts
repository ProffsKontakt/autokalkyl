import type Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { brand } from "@/lib/brand";
import { AI_BETAS, AI_MODEL, AiRefusalError, getAnthropic } from "./client";
import { CONSUMER_RIGHTS_SV } from "./knowledge";
import { searchReceiptsForAssistant, getReceiptForAssistant } from "@/lib/receipts/assistant-context";

type BetaMessageParam = Anthropic.Beta.BetaMessageParam;
type BetaContentBlock = Anthropic.Beta.BetaContentBlock;

/** Events streamed to the client as NDJSON. */
export type AssistantEvent =
  | { type: "status"; text: string }
  | { type: "text"; text: string }
  | { type: "tool"; name: string; label: string }
  | { type: "sources"; items: { title: string; url: string }[] }
  | { type: "done"; conversationId: string; messageId: string }
  | { type: "error"; message: string };

export interface AssistantAttachment {
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  /** base64 without data: prefix */
  data: string;
}

export interface RunAssistantOptions {
  userId: string;
  accountType: "PRIVATE" | "BUSINESS";
  conversationId: string;
  receiptId?: string | null;
  userText: string;
  attachments?: AssistantAttachment[];
  emit: (event: AssistantEvent) => void;
  signal?: AbortSignal;
}

const MAX_ITERATIONS = 14;

const searchReceiptsTool = {
  name: "search_receipts",
  description:
    "Söker bland användarens sparade kvitton. Använd detta för att hitta vilket kvitto användaren syftar på (t.ex. 'min tv', 'kylskåpet', 'solcellerna'). Sök på butik, produkt, varumärke, modell eller kategori. Returnerar en lista med kvitto-id, titel, butik, datum, belopp och produkter.",
  input_schema: {
    type: "object" as const,
    properties: {
      query: { type: "string", description: "Fritextsökning, t.ex. 'tv', 'Samsung', 'Elgiganten'. Tom sträng ger de senaste kvittona." },
      from_date: { type: "string", description: "Tidigaste köpdatum YYYY-MM-DD (valfritt)" },
      to_date: { type: "string", description: "Senaste köpdatum YYYY-MM-DD (valfritt)" },
      limit: { type: "integer", description: "Max antal träffar, standard 8" },
    },
    required: ["query"],
    additionalProperties: false,
  },
  strict: true,
};

const getReceiptTool = {
  name: "get_receipt",
  description:
    "Hämtar all information om ett specifikt kvitto: butik, datum, belopp, alla produktrader med artikelnummer/modell/serienummer, garantiinformation och fullständig kvittotext. Använd alltid detta innan du söker på webben efter garantivillkor eller bruksanvisning, så att du har rätt artikelnummer/modell.",
  input_schema: {
    type: "object" as const,
    properties: {
      receipt_id: { type: "string", description: "Kvittots id från search_receipts eller från sammanhanget" },
    },
    required: ["receipt_id"],
    additionalProperties: false,
  },
  strict: true,
};

function systemPrompt(accountType: "PRIVATE" | "BUSINESS", receiptContext: string | null): string {
  return `Du är ${brand.name}s kvittoassistent. Du hjälper svenska ${accountType === "BUSINESS" ? "företag" : "privatpersoner"} att hålla koll på sina kvitton och veta vilka rättigheter köpet ger.

Vad du kan göra:
1. Hitta rätt kvitto. När användaren nämner en produkt ("min tv", "kylen", "solcellsanläggningen") – använd search_receipts och sedan get_receipt för detaljer. Fråga bara om det finns flera rimliga träffar.
2. Garanti och reklamation. Utgå från kvittot (butik, datum, produkt, ev. garantitext). Sök på webben efter tillverkarens/butikens garantivillkor för exakt den produkten (använd artikelnummer/modell från kvittot). Läs villkoren med web_fetch och svara konkret: hur länge gäller garantin, vad omfattas, hur man reklamerar, vem man kontaktar. Skilj tydligt på garanti (frivillig) och reklamationsrätt (lag).
3. Bruksanvisning och felsökning. Leta upp den officiella bruksanvisningen/supportsidan för modellen (artikelnummer/modellbeteckning) och hjälp användaren steg för steg. Om användaren skickar en bild på ett felmeddelande: läs av det, koppla till rätt produkt och sök upp lösningen för just den modellen.
4. Stora köp (solceller, värmepump, köksrenovering): läs de allmänna villkoren noggrant, sammanfatta garantitider (produkt-, effekt-, installationsgaranti), serviceåtaganden och tidsfrister.

Arbetssätt:
- Svara på svenska, vardagligt och tydligt, som en kunnig vän. Korta stycken, punktlistor när det passar. Ingen markdown-rubrik-cirkus.
- Var konkret: datum, belopp, artikelnummer, telefonnummer, länkar.
- Ange källor med länk när du hämtat något från webben. Hitta inte på villkor – har du inte hittat dem, säg det och ge de lagstadgade rättigheterna istället.
- Räkna ut datum själv: t.ex. "köpt 2024-03-10, 3 års reklamationsrätt → till 2027-03-10".
- Dagens datum: ${new Date().toISOString().slice(0, 10)}.

${CONSUMER_RIGHTS_SV}
${receiptContext ? `\n\nAnvändaren tittar just nu på detta kvitto (använd det som utgångspunkt utan att söka först):\n${receiptContext}` : ""}`;
}

function textOf(content: BetaContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

function sourcesOf(content: BetaContentBlock[]): { title: string; url: string }[] {
  const seen = new Set<string>();
  const out: { title: string; url: string }[] = [];
  for (const block of content) {
    if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
      for (const r of block.content) {
        if (r.type === "web_search_result" && !seen.has(r.url)) {
          seen.add(r.url);
          out.push({ title: r.title, url: r.url });
        }
      }
    }
    if (block.type === "text" && block.citations) {
      for (const c of block.citations) {
        if (c.type === "web_search_result_location" && !seen.has(c.url)) {
          seen.add(c.url);
          out.push({ title: c.title ?? c.url, url: c.url });
        }
      }
    }
  }
  return out;
}

async function runTool(userId: string, accountType: "PRIVATE" | "BUSINESS", name: string, input: unknown): Promise<string> {
  const args = (input ?? {}) as Record<string, unknown>;
  if (name === "search_receipts") {
    const results = await searchReceiptsForAssistant(userId, {
      query: String(args.query ?? ""),
      fromDate: typeof args.from_date === "string" ? args.from_date : undefined,
      toDate: typeof args.to_date === "string" ? args.to_date : undefined,
      limit: typeof args.limit === "number" ? args.limit : 8,
    });
    return JSON.stringify(results, null, 1);
  }
  if (name === "get_receipt") {
    const receipt = await getReceiptForAssistant(userId, String(args.receipt_id ?? ""), accountType);
    if (!receipt) return "Inget kvitto med det id:t hittades för användaren.";
    return receipt;
  }
  return `Okänt verktyg: ${name}`;
}

/**
 * Runs one assistant turn: persists the user message, streams the answer, persists the assistant message.
 * The conversation must belong to the user.
 */
export async function runAssistant(options: RunAssistantOptions): Promise<void> {
  const { userId, accountType, conversationId, userText, attachments = [], emit, signal } = options;
  const client = getAnthropic();

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 60, select: { role: true, text: true, content: true } } },
  });
  if (!conversation) throw new Error("Konversationen hittades inte.");
  conversation.messages.reverse();

  const receiptId = options.receiptId ?? conversation.receiptId ?? null;
  const receiptContext = receiptId ? await getReceiptForAssistant(userId, receiptId, accountType) : null;

  // Build user content (text + optional images)
  const userContent: Anthropic.Beta.BetaContentBlockParam[] = [];
  for (const a of attachments.slice(0, 3)) {
    userContent.push({ type: "image", source: { type: "base64", media_type: a.mimeType, data: a.data } });
  }
  userContent.push({ type: "text", text: userText });

  // Persist the user turn without the image bytes (they would bloat the row and every later request).
  const storedUserContent = userContent.map((block) =>
    block.type === "image" ? { type: "image", omitted: true } : block,
  );
  const userMessage = await prisma.chatMessage.create({
    data: {
      conversationId,
      role: "USER",
      text: userText,
      content: storedUserContent as unknown as Prisma.InputJsonValue,
    },
  });

  // Replay earlier turns as plain text. The stored `content` keeps the full blocks (tool use, citations)
  // for display, but tool_use blocks need matching tool_result blocks to be replayable and images would
  // bloat every later request – so history is text-only. Attached images are noted so the model knows.
  const history: BetaMessageParam[] = conversation.messages.map((m) => {
    const blocks = Array.isArray(m.content) ? (m.content as unknown as Array<{ type?: string }>) : [];
    const hadImages = blocks.some((b) => b?.type === "image" || b?.type === "image_omitted");
    const text = m.text.trim() || "(tomt meddelande)";
    return {
      role: m.role === "USER" ? "user" : "assistant",
      content: [{ type: "text", text: hadImages ? `[Användaren bifogade en bild]\n${text}` : text }],
    };
  });
  const messages: BetaMessageParam[] = [...history, { role: "user", content: userContent }];

  const collectedContent: BetaContentBlock[] = [];
  let finalText = "";

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    if (signal?.aborted) break;

    const stream = client.beta.messages.stream(
      {
        model: AI_MODEL,
        max_tokens: 16000,
        betas: [...AI_BETAS],
        fallbacks: "default",
        thinking: { type: "adaptive" },
        output_config: { effort: "medium" },
        system: [{ type: "text", text: systemPrompt(accountType, receiptContext), cache_control: { type: "ephemeral" } }],
        tools: [
          searchReceiptsTool,
          getReceiptTool,
          { type: "web_search_20260209", name: "web_search", max_uses: 8, user_location: { type: "approximate", country: "SE", timezone: "Europe/Stockholm" } },
          { type: "web_fetch_20260209", name: "web_fetch", max_uses: 6, max_content_tokens: 60000 },
        ],
        messages,
      },
      { signal },
    );

    stream.on("text", (delta) => {
      finalText += delta;
      emit({ type: "text", text: delta });
    });
    stream.on("contentBlock", (block) => {
      if (block.type === "server_tool_use") {
        const label = block.name === "web_search" ? "Söker på webben…" : block.name === "web_fetch" ? "Läser webbsida…" : block.name;
        emit({ type: "tool", name: block.name, label });
      } else if (block.type === "tool_use") {
        const label = block.name === "search_receipts" ? "Söker bland dina kvitton…" : "Hämtar kvitto…";
        emit({ type: "tool", name: block.name, label });
      }
    });

    const message = await stream.finalMessage();
    collectedContent.push(...message.content);

    if (message.stop_reason === "refusal") {
      throw new AiRefusalError("Assistenten kunde inte svara på den här frågan.");
    }

    if (message.stop_reason === "pause_turn") {
      // Server-side tool loop hit its limit – resume by re-sending the assistant turn.
      messages.push({ role: "assistant", content: message.content as unknown as Anthropic.Beta.BetaContentBlockParam[] });
      continue;
    }

    if (message.stop_reason === "tool_use") {
      const toolUses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
      messages.push({ role: "assistant", content: message.content as unknown as Anthropic.Beta.BetaContentBlockParam[] });
      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const tu of toolUses) {
        try {
          const result = await runTool(userId, accountType, tu.name, tu.input);
          results.push({ type: "tool_result", tool_use_id: tu.id, content: result });
        } catch (error) {
          results.push({ type: "tool_result", tool_use_id: tu.id, content: `Fel: ${String(error)}`, is_error: true });
        }
      }
      messages.push({ role: "user", content: results });
      continue;
    }

    // end_turn, max_tokens, stop_sequence → done
    break;
  }

  const text = finalText.trim() || textOf(collectedContent) || "Jag kunde tyvärr inte ta fram ett svar. Försök gärna igen.";
  const sources = sourcesOf(collectedContent);
  if (sources.length) emit({ type: "sources", items: sources });

  // Store text + sources for display; thinking/tool blocks are not needed for replay (history is text-only).
  const storedAssistantContent: Array<Record<string, unknown>> = [{ type: "text", text }];
  if (sources.length) storedAssistantContent.push({ type: "sources", items: sources });
  const assistantMessage = await prisma.chatMessage.create({
    data: {
      conversationId,
      role: "ASSISTANT",
      text,
      content: storedAssistantContent as unknown as Prisma.InputJsonValue,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      updatedAt: new Date(),
      title: conversation.title ?? userText.slice(0, 80),
    },
  });

  emit({ type: "done", conversationId, messageId: assistantMessage.id });
  void userMessage;
}
