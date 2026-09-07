import { describe, expect, it } from "vitest";
import {
  extractInboundTokens,
  parseJsonInbound,
  parseMultipartInbound,
  parseRawMime,
  selectReceiptParts,
  type InboundMessage,
} from "@/lib/inbound/parse";

const TOKEN_ADDRESS = "kvitto-ab12cd34ef@in.kvittera.se";

/** A JPEG-looking buffer (SOI marker + filler) large enough to pass the 12 KB "not a logo" threshold. */
function fakeJpeg(bytes = 20 * 1024): Buffer {
  const body = Buffer.alloc(bytes, 0x37);
  body[0] = 0xff;
  body[1] = 0xd8;
  body[2] = 0xff;
  body[3] = 0xe0;
  return body;
}

/** A tiny PNG-looking buffer (signature only) – the kind of thing an e-mail signature logo is. */
function tinyPng(bytes = 600): Buffer {
  const body = Buffer.alloc(bytes, 0x11);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(body);
  return body;
}

/** Builds a File the way the Web FormData parser would – over a fresh ArrayBuffer, not a Node Buffer view. */
function toFile(data: Buffer, name: string, type: string): File {
  return new File([new Uint8Array(data)], name, { type });
}

function message(overrides: Partial<InboundMessage> = {}): InboundMessage {
  return {
    recipients: [TOKEN_ADDRESS],
    from: "shop@example.com",
    subject: "Kvitto",
    text: null,
    html: null,
    attachments: [],
    ...overrides,
  };
}

describe("parseJsonInbound", () => {
  it("parses a Postmark inbound webhook payload with a base64 attachment", () => {
    const jpeg = fakeJpeg();
    const body = {
      FromName: "Anna Andersson",
      MessageStream: "inbound",
      From: '"Anna Andersson" <Anna@Example.com>',
      FromFull: { Email: "anna@example.com", Name: "Anna Andersson", MailboxHash: "" },
      To: `"Kvittera" <${TOKEN_ADDRESS}>`,
      ToFull: [{ Email: TOKEN_ADDRESS, Name: "", MailboxHash: "" }],
      Cc: "",
      CcFull: [],
      Bcc: "",
      BccFull: [],
      OriginalRecipient: TOKEN_ADDRESS,
      Subject: "Ditt kvitto från Elgiganten",
      MessageID: "73e6d360-66eb-11e1-8e72-a8904824019b",
      Date: "Thu, 5 Apr 2026 16:59:01 +0200",
      TextBody: "Tack för ditt köp!",
      HtmlBody: "<html><body><p>Tack för ditt köp!</p></body></html>",
      StrippedTextReply: "",
      Headers: [{ Name: "X-Spam-Status", Value: "No" }],
      Attachments: [
        {
          Name: "kvitto.jpg",
          Content: jpeg.toString("base64"),
          ContentType: "image/jpeg",
          ContentLength: jpeg.byteLength,
        },
      ],
    };

    const parsed = parseJsonInbound(body);

    expect(parsed.recipients).toEqual([TOKEN_ADDRESS]);
    expect(parsed.from).toBe("anna@example.com");
    expect(parsed.subject).toBe("Ditt kvitto från Elgiganten");
    expect(parsed.text).toBe("Tack för ditt köp!");
    expect(parsed.html).toContain("<p>Tack för ditt köp!</p>");
    expect(parsed.attachments).toHaveLength(1);
    expect(parsed.attachments[0].filename).toBe("kvitto.jpg");
    expect(parsed.attachments[0].mimeType).toBe("image/jpeg");
    expect(parsed.attachments[0].data.equals(jpeg)).toBe(true);
  });

  it("parses the generic JSON shape (arrays, envelope, lower-case keys)", () => {
    const png = tinyPng();
    const parsed = parseJsonInbound({
      to: [TOKEN_ADDRESS, "Someone Else <someone@else.example>"],
      cc: "cc@example.com",
      envelope: { to: ["forwarded-kvitto-zz99@relay.example.com"], from: "bounce@relay.example.com" },
      from: "Butiken AB <noreply@butiken.se>",
      subject: "Orderbekräftelse",
      text: "Hej!",
      html: "<p>Hej!</p>",
      attachments: [
        { filename: "logo.png", contentType: "Image/PNG", content: png.toString("base64") },
        { filename: "broken.pdf", contentType: "application/pdf" }, // no content → skipped
        "not-an-object",
      ],
    });

    expect(parsed.recipients).toEqual([TOKEN_ADDRESS, "someone@else.example", "cc@example.com", "forwarded-kvitto-zz99@relay.example.com"]);
    expect(parsed.from).toBe("noreply@butiken.se");
    expect(parsed.subject).toBe("Orderbekräftelse");
    expect(parsed.text).toBe("Hej!");
    expect(parsed.html).toBe("<p>Hej!</p>");
    expect(parsed.attachments).toHaveLength(1);
    expect(parsed.attachments[0]).toMatchObject({ filename: "logo.png", mimeType: "image/png" });
    expect(parsed.attachments[0].data.equals(png)).toBe(true);
  });

  it("accepts Mailgun-style JSON field names", () => {
    const parsed = parseJsonInbound({
      recipient: TOKEN_ADDRESS,
      sender: "shop@example.com",
      subject: "Kvitto",
      "body-plain": "Text",
      "body-html": "<b>Text</b>",
    });
    expect(parsed.recipients).toEqual([TOKEN_ADDRESS]);
    expect(parsed.from).toBe("shop@example.com");
    expect(parsed.text).toBe("Text");
    expect(parsed.html).toBe("<b>Text</b>");
  });

  it("falls back to safe defaults for an empty body", () => {
    const parsed = parseJsonInbound({});
    expect(parsed).toEqual({ recipients: [], from: "unknown@unknown", subject: null, text: null, html: null, attachments: [] });
  });

  it("deduplicates recipients and lower-cases addresses", () => {
    const parsed = parseJsonInbound({ To: TOKEN_ADDRESS.toUpperCase(), OriginalRecipient: TOKEN_ADDRESS, ToFull: [{ Email: TOKEN_ADDRESS }] });
    expect(parsed.recipients).toEqual([TOKEN_ADDRESS]);
  });
});

describe("parseMultipartInbound", () => {
  it("parses a SendGrid Inbound Parse form with a File attachment", async () => {
    const jpeg = fakeJpeg();
    const form = new FormData();
    form.set("headers", "Received: from mail.example.com");
    form.set("to", `Kvittera <${TOKEN_ADDRESS}>`);
    form.set("from", "Elgiganten <noreply@elgiganten.se>");
    form.set("subject", "Ditt kvitto");
    form.set("text", "Tack för ditt köp!");
    form.set("html", "<p>Tack för ditt köp!</p>");
    form.set("envelope", JSON.stringify({ to: [TOKEN_ADDRESS, "kopia@example.com"], from: "noreply@elgiganten.se" }));
    form.set("attachments", "1");
    form.set("attachment-info", JSON.stringify({ attachment1: { filename: "kvitto.jpg", type: "image/jpeg" } }));
    form.set("attachment1", toFile(jpeg, "kvitto.jpg", "image/jpeg"));

    const parsed = await parseMultipartInbound(form);

    expect(parsed.recipients).toEqual([TOKEN_ADDRESS, "kopia@example.com"]);
    expect(parsed.from).toBe("noreply@elgiganten.se");
    expect(parsed.subject).toBe("Ditt kvitto");
    expect(parsed.text).toBe("Tack för ditt köp!");
    expect(parsed.html).toBe("<p>Tack för ditt köp!</p>");
    expect(parsed.attachments).toHaveLength(1);
    expect(parsed.attachments[0].filename).toBe("kvitto.jpg");
    expect(parsed.attachments[0].mimeType).toBe("image/jpeg");
    expect(parsed.attachments[0].data.equals(jpeg)).toBe(true);
  });

  it("parses Mailgun route field names", async () => {
    const pdf = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\n%%EOF");
    const form = new FormData();
    form.set("recipient", TOKEN_ADDRESS);
    form.set("sender", "bounce@butiken.se");
    form.set("from", "Butiken <kvitto@butiken.se>");
    form.set("subject", "Faktura 1234");
    form.set("body-plain", "Se bifogad faktura.");
    form.set("body-html", "<p>Se bifogad faktura.</p>");
    form.set("stripped-text", "Se bifogad faktura.");
    form.set("attachment-count", "1");
    form.set("attachment-1", toFile(pdf, "faktura.pdf", "application/pdf"));

    const parsed = await parseMultipartInbound(form);

    expect(parsed.recipients).toEqual([TOKEN_ADDRESS]);
    expect(parsed.from).toBe("kvitto@butiken.se");
    expect(parsed.subject).toBe("Faktura 1234");
    expect(parsed.text).toBe("Se bifogad faktura.");
    expect(parsed.html).toBe("<p>Se bifogad faktura.</p>");
    expect(parsed.attachments).toHaveLength(1);
    expect(parsed.attachments[0]).toMatchObject({ filename: "faktura.pdf", mimeType: "application/pdf" });
    expect(parsed.attachments[0].data.equals(pdf)).toBe(true);
  });

  it("ignores empty file fields and tolerates a broken envelope", async () => {
    const form = new FormData();
    form.set("to", TOKEN_ADDRESS);
    form.set("from", "shop@example.com");
    form.set("envelope", "{not json");
    form.set("attachment1", new File([], "", { type: "application/octet-stream" }));

    const parsed = await parseMultipartInbound(form);
    expect(parsed.recipients).toEqual([TOKEN_ADDRESS]);
    expect(parsed.attachments).toEqual([]);
    expect(parsed.subject).toBeNull();
  });

  it("parses the raw MIME message when SendGrid runs in raw mode", async () => {
    const raw = [
      `From: Butiken <kvitto@butiken.se>`,
      `To: ${TOKEN_ADDRESS}`,
      `Subject: Raw kvitto`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      `Hej från raw-läget!`,
      ``,
    ].join("\r\n");
    const form = new FormData();
    form.set("to", "alias@forward.example.com");
    form.set("email", raw);

    const parsed = await parseMultipartInbound(form);
    expect(parsed.recipients).toEqual(expect.arrayContaining(["alias@forward.example.com", TOKEN_ADDRESS]));
    expect(parsed.from).toBe("kvitto@butiken.se");
    expect(parsed.subject).toBe("Raw kvitto");
    expect(parsed.text).toContain("Hej från raw-läget!");
  });
});

describe("parseRawMime", () => {
  function wrap76(base64: string): string {
    return base64.match(/.{1,76}/g)?.join("\r\n") ?? "";
  }

  it("parses a multipart/mixed RFC 822 message with a text part and a base64 attachment", async () => {
    const jpeg = fakeJpeg();
    const boundary = "kvittera-boundary-42";
    const raw = [
      `Return-Path: <bounce@elgiganten.se>`,
      `Delivered-To: ${TOKEN_ADDRESS}`,
      `X-Original-To: alias-kvitto-forward@forward.example.com`,
      `From: "Elgiganten" <NoReply@Elgiganten.se>`,
      `To: Kvittera <${TOKEN_ADDRESS}>`,
      `Cc: kopia@example.com`,
      `Subject: =?UTF-8?Q?Ditt_kvitto_fr=C3=A5n_Elgiganten?=`,
      `Date: Thu, 5 Apr 2026 16:59:01 +0200`,
      `Message-ID: <abc123@elgiganten.se>`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=utf-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      `Tack för ditt köp! Kvittot hittar du som bilaga.`,
      ``,
      `--${boundary}`,
      `Content-Type: image/jpeg; name="kvitto.jpg"`,
      `Content-Disposition: attachment; filename="kvitto.jpg"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      wrap76(jpeg.toString("base64")),
      `--${boundary}--`,
      ``,
    ].join("\r\n");

    const parsed = await parseRawMime(Buffer.from(raw, "utf8"));

    expect(parsed.from).toBe("noreply@elgiganten.se");
    expect(parsed.subject).toBe("Ditt kvitto från Elgiganten");
    expect(parsed.text).toContain("Tack för ditt köp! Kvittot hittar du som bilaga.");
    expect(parsed.html).toBeNull();
    expect(parsed.recipients).toEqual(expect.arrayContaining([TOKEN_ADDRESS, "kopia@example.com", "alias-kvitto-forward@forward.example.com"]));
    expect(parsed.attachments).toHaveLength(1);
    expect(parsed.attachments[0].filename).toBe("kvitto.jpg");
    expect(parsed.attachments[0].mimeType).toBe("image/jpeg");
    expect(parsed.attachments[0].data.byteLength).toBe(jpeg.byteLength);
    expect(parsed.attachments[0].data.equals(jpeg)).toBe(true);
  });

  it("accepts a string message and returns HTML when present", async () => {
    const raw = [
      `From: shop@example.com`,
      `To: ${TOKEN_ADDRESS}`,
      `Subject: HTML-kvitto`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      `<html><body><table><tr><td>Summa</td><td>199 kr</td></tr></table></body></html>`,
      ``,
    ].join("\r\n");

    const parsed = await parseRawMime(raw);
    expect(parsed.recipients).toEqual([TOKEN_ADDRESS]);
    expect(parsed.subject).toBe("HTML-kvitto");
    expect(parsed.html).toContain("<td>Summa</td>");
    expect(parsed.attachments).toEqual([]);
  });
});

describe("extractInboundTokens", () => {
  const DOMAIN = "in.kvittera.se";

  it("strips plus-addressing suffixes", () => {
    expect(extractInboundTokens(["kvitto-ab12cd34ef+elgiganten@in.kvittera.se"], DOMAIN)).toEqual(["kvitto-ab12cd34ef"]);
  });

  it("prefers addresses on the configured inbound domain but keeps forwarded ones", () => {
    const tokens = extractInboundTokens(["kvitto-offdomain@forward.example.com", "kvitto-ondomain@in.kvittera.se"], DOMAIN);
    expect(tokens).toEqual(["kvitto-ondomain", "kvitto-offdomain"]);
  });

  it("ignores local parts that are not inbound tokens", () => {
    expect(extractInboundTokens(["anna@in.kvittera.se", "hej@kvittera.se", "support+kvitto-x@kvittera.se"], DOMAIN)).toEqual([]);
  });

  it("is case-insensitive and de-duplicates", () => {
    expect(extractInboundTokens(["KVITTO-ABC@IN.KVITTERA.SE", "kvitto-abc@in.kvittera.se", "kvitto-abc+tag@other.example"], DOMAIN)).toEqual(["kvitto-abc"]);
  });

  it("skips malformed addresses and works without a configured domain", () => {
    expect(extractInboundTokens(["not-an-address", "", "@nohost", "kvitto-only@"], DOMAIN)).toEqual([]);
    expect(extractInboundTokens(["kvitto-b@b.example", "kvitto-a@a.example"], null)).toEqual(["kvitto-b", "kvitto-a"]);
  });
});

describe("selectReceiptParts", () => {
  it("skips small images (logos, signatures) but keeps real photos", () => {
    const photo = fakeJpeg();
    const { files, extraText } = selectReceiptParts(
      message({
        text: "  Tack för ditt köp!  ",
        attachments: [
          { filename: "logo.png", mimeType: "image/png", data: tinyPng() },
          { filename: "kvitto.jpg", mimeType: "image/jpeg; name=kvitto.jpg", data: photo },
        ],
      }),
    );
    expect(files).toHaveLength(1);
    expect(files[0].mimeType).toBe("image/jpeg");
    expect(files[0].originalName).toBe("kvitto.jpg");
    expect(files[0].data.equals(photo)).toBe(true);
    expect(extraText).toBe("Tack för ditt köp!");
  });

  it("keeps PDFs regardless of size and recognises them by file name", () => {
    const pdf = Buffer.from("%PDF-1.4 minimal");
    const { files } = selectReceiptParts(
      message({
        attachments: [
          { filename: "faktura.PDF", mimeType: "application/octet-stream", data: pdf },
          { filename: null, mimeType: "application/pdf", data: pdf },
        ],
      }),
    );
    expect(files).toHaveLength(2);
    expect(files.every((f) => f.mimeType === "application/pdf")).toBe(true);
  });

  it("ignores unsupported attachment types and falls back to the HTML body", () => {
    const html = "<html><body><p>Din order</p></body></html>";
    const { files } = selectReceiptParts(
      message({
        html,
        text: "Din order",
        attachments: [
          { filename: "invite.ics", mimeType: "text/calendar", data: Buffer.alloc(30 * 1024, 1) },
          { filename: "logo.svg", mimeType: "image/svg+xml", data: Buffer.alloc(30 * 1024, 1) },
        ],
      }),
    );
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ mimeType: "text/html", originalName: "kvitto.html" });
    expect(files[0].data.toString("utf8")).toBe(html);
  });

  it("falls back to the plain-text body when there is no HTML", () => {
    const { files, extraText } = selectReceiptParts(message({ text: "Kvitto 199 kr\n", html: "   " }));
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ mimeType: "text/plain", originalName: "kvitto.txt" });
    expect(files[0].data.toString("utf8")).toBe("Kvitto 199 kr\n");
    expect(extraText).toBe("Kvitto 199 kr");
  });

  it("returns nothing for an empty e-mail", () => {
    expect(selectReceiptParts(message({ text: "  ", html: "" }))).toEqual({ files: [], extraText: null });
  });

  it("caps the number of files at 8 and truncates the extra text", () => {
    const attachments = Array.from({ length: 10 }, (_, i) => ({ filename: `sida-${i + 1}.jpg`, mimeType: "image/jpeg", data: fakeJpeg() }));
    const { files, extraText } = selectReceiptParts(message({ attachments, text: "x".repeat(25_000) }));
    expect(files).toHaveLength(8);
    expect(files[7].originalName).toBe("sida-8.jpg");
    expect(extraText).toHaveLength(20_000);
  });
});
