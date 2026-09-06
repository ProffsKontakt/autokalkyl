import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A tiny, safe markdown renderer for assistant answers.
 *
 * Supports paragraphs, **bold**, `code`, "- " bullet lists, "1. " numbered lists,
 * [text](https://url) links and bare https URLs. Everything else is rendered as plain text –
 * no raw HTML is ever interpreted, and only http(s) links become anchors.
 */

type ListBlock = { kind: "ul"; items: string[][] } | { kind: "ol"; items: string[][]; start: number };
type Block = { kind: "p"; lines: string[] } | { kind: "h"; text: string } | ListBlock;

const BULLET = /^\s*[-*•]\s+(.+)$/;
const ORDERED = /^\s*(\d{1,3})[.)]\s+(.+)$/;
const HEADING = /^\s*#{1,6}\s+(.+)$/;
const INDENTED = /^\s{2,}\S/;
const HTTP = /^https?:\/\//i;
const TRAILING_PUNCT = /[.,;:!?'"»)\]]+$/;

export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: ListBlock | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ kind: "p", lines: paragraph });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "h", text: heading[1] });
      continue;
    }
    const bullet = BULLET.exec(line);
    if (bullet) {
      flushParagraph();
      if (!list || list.kind !== "ul") {
        flushList();
        list = { kind: "ul", items: [] };
      }
      list.items.push([bullet[1]]);
      continue;
    }
    const ordered = ORDERED.exec(line);
    if (ordered) {
      flushParagraph();
      if (!list || list.kind !== "ol") {
        flushList();
        list = { kind: "ol", items: [], start: Number(ordered[1]) || 1 };
      }
      list.items.push([ordered[2]]);
      continue;
    }
    if (list && INDENTED.test(raw)) {
      // Indented continuation line belongs to the previous list item.
      list.items[list.items.length - 1].push(line);
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

function inlinePattern(): RegExp {
  // bold | code | markdown link | bare URL
  return /(\*\*[^*\n]+?\*\*)|(`[^`\n]+`)|(\[[^\]\n]+\]\(https?:\/\/[^\s)]+\))|(https?:\/\/[^\s<>()]+)/g;
}

function prettyUrl(url: string): string {
  const stripped = url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  return stripped.length > 60 ? `${stripped.slice(0, 57)}…` : stripped;
}

function ExternalAnchor({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-words font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800 hover:decoration-brand-500"
    >
      {children}
    </a>
  );
}

export function renderInline(text: string, keyPrefix = "i"): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = inlinePattern();
  let last = 0;
  let index = 0;
  for (let match = pattern.exec(text); match !== null; match = pattern.exec(text)) {
    const token = match[0];
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${index++}`;
    if (match[1]) {
      nodes.push(
        <strong key={key} className="font-semibold text-ink-900">
          {renderInline(token.slice(2, -2), key)}
        </strong>,
      );
    } else if (match[2]) {
      nodes.push(
        <code key={key} className="rounded-md bg-ink-100 px-1.5 py-0.5 font-mono text-[13px] text-ink-800">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (match[3]) {
      const close = token.indexOf("](");
      const label = token.slice(1, close);
      const href = token.slice(close + 2, -1);
      nodes.push(
        HTTP.test(href) ? (
          <ExternalAnchor key={key} href={href}>
            {label}
          </ExternalAnchor>
        ) : (
          label
        ),
      );
    } else {
      const trail = TRAILING_PUNCT.exec(token)?.[0] ?? "";
      const href = trail ? token.slice(0, -trail.length) : token;
      nodes.push(
        <ExternalAnchor key={key} href={href}>
          {prettyUrl(href)}
        </ExternalAnchor>,
      );
      if (trail) nodes.push(trail);
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderLines(lines: string[], keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    if (i > 0) out.push(<br key={`${keyPrefix}-br-${i}`} />);
    out.push(...renderInline(line, `${keyPrefix}-${i}`));
  });
  return out;
}

export function MarkdownLite({ text, className }: { text: string; className?: string }) {
  const blocks = parseBlocks(text);
  return (
    <div className={cn("space-y-2.5 text-[15px] leading-relaxed text-ink-800", className)}>
      {blocks.map((block, i) => {
        const key = `b-${i}`;
        switch (block.kind) {
          case "h":
            return (
              <p key={key} className="font-semibold text-ink-900">
                {renderInline(block.text, key)}
              </p>
            );
          case "ul":
            return (
              <ul key={key} className="list-disc space-y-1 pl-5 marker:text-ink-400">
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`}>{renderLines(item, `${key}-${j}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} start={block.start} className="list-decimal space-y-1 pl-5 marker:font-medium marker:text-ink-500">
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`}>{renderLines(item, `${key}-${j}`)}</li>
                ))}
              </ol>
            );
          default:
            return <p key={key}>{renderLines(block.lines, key)}</p>;
        }
      })}
    </div>
  );
}
