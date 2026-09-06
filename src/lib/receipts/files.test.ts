import { createHash } from "node:crypto";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { ALLOWED_TYPES, MAX_FILE_BYTES, UPLOAD_TYPES, htmlToText, kindForMime, prepareFile, sha256 } from "@/lib/receipts/files";

async function makePng(width: number, height: number): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: { r: 28, g: 111, b: 97 } } })
    .png()
    .toBuffer();
}

describe("htmlToText", () => {
  it("strips scripts, styles and tags while keeping line structure", () => {
    const html = `
      <html><head><style>p { color: red }</style><script>alert("x")</script></head>
      <body>
        <h1>Elgiganten</h1>
        <p>Tack för ditt köp!</p>
        <table><tr><td>Samsung TV</td><td>4 990 kr</td></tr><tr><td>Summa</td><td>4 990 kr</td></tr></table>
        <div>Rad ett<br/>Rad två</div>
      </body></html>`;
    const text = htmlToText(html);
    expect(text).not.toContain("alert");
    expect(text).not.toContain("color: red");
    expect(text).not.toMatch(/<[^>]+>/);
    // Lines are kept, runs of spaces collapsed; a stray space may remain at a line edge, which the extractor does not care about.
    expect(text.split("\n").map((line) => line.trim())).toEqual(["Elgiganten", "Tack för ditt köp!", "Samsung TV 4 990 kr", "Summa 4 990 kr", "Rad ett", "Rad två"]);
  });

  it("decodes common HTML entities and collapses whitespace", () => {
    expect(htmlToText("Fisk&nbsp;&amp;&nbsp;skaldjur &lt;3 &quot;bra&quot; &#39;ok&#39; &apos;ja&apos;")).toBe("Fisk & skaldjur <3 \"bra\" 'ok' 'ja'");
    expect(htmlToText("  a \t\t b   \n\n\n c ").split("\n").map((line) => line.trim())).toEqual(["a b", "c"]);
  });

  it("returns an empty string for empty input", () => {
    expect(htmlToText("")).toBe("");
    expect(htmlToText("<div></div>")).toBe("");
  });
});

describe("kindForMime", () => {
  it("classifies supported types", () => {
    expect(kindForMime("image/jpeg")).toBe("IMAGE");
    expect(kindForMime("image/png")).toBe("IMAGE");
    expect(kindForMime("image/heic")).toBe("IMAGE");
    expect(kindForMime("application/pdf")).toBe("PDF");
    expect(kindForMime("text/html")).toBe("EMAIL_HTML");
    expect(kindForMime("text/plain")).toBe("EMAIL_TEXT");
  });

  it("ignores case and parameters", () => {
    expect(kindForMime("IMAGE/PNG")).toBe("IMAGE");
    expect(kindForMime("text/html; charset=utf-8")).toBe("EMAIL_HTML");
    expect(kindForMime(" application/pdf ")).toBe("PDF");
  });

  it("rejects everything else", () => {
    expect(kindForMime("image/svg+xml")).toBeNull();
    expect(kindForMime("text/calendar")).toBeNull();
    expect(kindForMime("application/octet-stream")).toBeNull();
    expect(kindForMime("")).toBeNull();
  });

  it("agrees with the exported allow-lists", () => {
    for (const type of UPLOAD_TYPES) expect(kindForMime(type)).not.toBeNull();
    for (const type of ALLOWED_TYPES) expect(kindForMime(type)).not.toBeNull();
    expect(UPLOAD_TYPES).not.toContain("text/html");
    expect(ALLOWED_TYPES).toContain("text/html");
  });
});

describe("sha256", () => {
  it("returns the hex digest", () => {
    const buf = Buffer.from("kvitto");
    expect(sha256(buf)).toBe(createHash("sha256").update(buf).digest("hex"));
    expect(sha256(buf)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("prepareFile", () => {
  it("re-encodes a large PNG as a JPEG capped at 2200 px with a 480 px thumbnail", async () => {
    const png = await makePng(2400, 1600);
    const prepared = await prepareFile({ data: png, mimeType: "image/png", originalName: "kvitto.png" });

    expect(prepared.kind).toBe("IMAGE");
    expect(prepared.mimeType).toBe("image/jpeg");
    expect(prepared.originalName).toBe("kvitto.png");
    expect(prepared.width).toBe(2200);
    expect(prepared.height).toBe(1467);
    expect(prepared.byteSize).toBe(prepared.data.byteLength);
    expect(prepared.sha256).toBe(sha256(prepared.data));
    // JPEG SOI marker
    expect(prepared.data[0]).toBe(0xff);
    expect(prepared.data[1]).toBe(0xd8);

    const meta = await sharp(prepared.data).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.width).toBe(2200);
    expect(meta.height).toBe(1467);

    expect(prepared.thumbnail).not.toBeNull();
    const thumb = await sharp(prepared.thumbnail!).metadata();
    expect(thumb.format).toBe("jpeg");
    expect(thumb.width).toBe(480);
    expect(thumb.height).toBe(320);
    expect(prepared.thumbnail!.byteLength).toBeLessThan(prepared.data.byteLength);
  });

  it("does not enlarge small images", async () => {
    const png = await makePng(120, 90);
    const prepared = await prepareFile({ data: png, mimeType: "image/png" });
    expect(prepared.width).toBe(120);
    expect(prepared.height).toBe(90);
    expect(prepared.originalName).toBeNull();
    const thumb = await sharp(prepared.thumbnail!).metadata();
    expect(thumb.width).toBe(120);
    expect(thumb.height).toBe(90);
  });

  it("applies the EXIF orientation so phone photos come out upright", async () => {
    const landscape = await sharp({ create: { width: 300, height: 200, channels: 3, background: "#ffffff" } })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const prepared = await prepareFile({ data: landscape, mimeType: "image/jpeg" });
    expect(prepared.width).toBe(200);
    expect(prepared.height).toBe(300);
    const meta = await sharp(prepared.data).metadata();
    expect(meta.orientation ?? 1).toBe(1);
  });

  it("stores PDFs untouched", async () => {
    const pdf = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n");
    const prepared = await prepareFile({ data: pdf, mimeType: "application/pdf", originalName: "faktura.pdf" });
    expect(prepared).toMatchObject({ kind: "PDF", mimeType: "application/pdf", thumbnail: null, width: null, height: null, byteSize: pdf.byteLength, originalName: "faktura.pdf" });
    expect(prepared.data.equals(pdf)).toBe(true);
    expect(prepared.sha256).toBe(sha256(pdf));
  });

  it("normalises e-mail bodies to their canonical mime types", async () => {
    const html = Buffer.from("<p>Kvitto</p>", "utf8");
    const preparedHtml = await prepareFile({ data: html, mimeType: "text/html; charset=utf-8" });
    expect(preparedHtml.kind).toBe("EMAIL_HTML");
    expect(preparedHtml.mimeType).toBe("text/html");

    const text = Buffer.from("Kvitto 199 kr", "utf8");
    const preparedText = await prepareFile({ data: text, mimeType: "TEXT/PLAIN" });
    expect(preparedText.kind).toBe("EMAIL_TEXT");
    expect(preparedText.mimeType).toBe("text/plain");
    expect(preparedText.data.equals(text)).toBe(true);
  });

  it("rejects unsupported, empty and oversized files with Swedish messages", async () => {
    await expect(prepareFile({ data: Buffer.from("x"), mimeType: "image/svg+xml" })).rejects.toThrow(/stöds inte/);
    await expect(prepareFile({ data: Buffer.alloc(0), mimeType: "image/png" })).rejects.toThrow(/tom/);
    await expect(prepareFile({ data: Buffer.alloc(MAX_FILE_BYTES + 1), mimeType: "application/pdf" })).rejects.toThrow(/för stor/);
  });

  it("rejects image data that cannot be decoded", async () => {
    await expect(prepareFile({ data: Buffer.from("definitivt inte en bild"), mimeType: "image/jpeg" })).rejects.toThrow();
  });
});
