import { describe, expect, it } from "vitest";
import { displayNameFor } from "./users";

describe("displayNameFor", () => {
  it("prefers the name from the identity provider", () => {
    expect(displayNameFor("  Anna   Andersson ", "x@example.com")).toBe("Anna Andersson");
  });

  it("derives a readable name from the address when none is given", () => {
    expect(displayNameFor(null, "anna.andersson@gmail.com")).toBe("Anna Andersson");
    expect(displayNameFor(undefined, "julian@proffskontakt.se")).toBe("Julian");
    expect(displayNameFor("", "erik_svensson-82@example.com")).toBe("Erik Svensson");
    expect(displayNameFor("", "anna+kvitton@example.com")).toBe("Anna");
  });

  it("never returns an empty string", () => {
    expect(displayNameFor("", "12345@example.com")).toBe("12345");
    expect(displayNameFor("", "@example.com")).toBe("Användare");
  });

  it("caps the length", () => {
    expect(displayNameFor("a".repeat(300), "x@example.com")).toHaveLength(100);
  });
});
