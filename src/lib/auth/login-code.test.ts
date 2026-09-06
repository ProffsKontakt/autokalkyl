import { describe, expect, it } from "vitest";
import {
  LOGIN_CODE_LENGTH,
  LOGIN_CODE_MESSAGES,
  LoginCodeError,
  formatLoginCode,
  generateLoginCode,
  hashLoginCode,
  isLoginCodeFailure,
  loginCodeHashesMatch,
  normalizeLoginCode,
} from "./login-code";

describe("generateLoginCode", () => {
  it("always produces exactly six digits, zero-padded", () => {
    for (let i = 0; i < 500; i++) {
      expect(generateLoginCode()).toMatch(new RegExp(`^\\d{${LOGIN_CODE_LENGTH}}$`));
    }
  });

  it("is not constant", () => {
    const seen = new Set(Array.from({ length: 50 }, () => generateLoginCode()));
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe("normalizeLoginCode", () => {
  it("accepts the code with or without separators", () => {
    expect(normalizeLoginCode("123456")).toBe("123456");
    expect(normalizeLoginCode("123 456")).toBe("123456");
    expect(normalizeLoginCode(" 123-456 ")).toBe("123456");
    expect(normalizeLoginCode("004 812")).toBe("004812");
  });

  it("rejects anything that is not six digits", () => {
    expect(normalizeLoginCode("12345")).toBeNull();
    expect(normalizeLoginCode("1234567")).toBeNull();
    expect(normalizeLoginCode("abcdef")).toBeNull();
    expect(normalizeLoginCode("")).toBeNull();
    expect(normalizeLoginCode(123456)).toBeNull();
    expect(normalizeLoginCode(undefined)).toBeNull();
  });
});

describe("hashLoginCode", () => {
  it("binds the code to the (normalised) address", () => {
    const a = hashLoginCode("anna@example.com", "123456");
    expect(hashLoginCode("  Anna@Example.com ", "123456")).toBe(a);
    expect(hashLoginCode("bob@example.com", "123456")).not.toBe(a);
    expect(hashLoginCode("anna@example.com", "123457")).not.toBe(a);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("loginCodeHashesMatch", () => {
  it("compares hex digests in constant time and rejects length mismatches", () => {
    const a = hashLoginCode("anna@example.com", "123456");
    expect(loginCodeHashesMatch(a, a)).toBe(true);
    expect(loginCodeHashesMatch(a, hashLoginCode("anna@example.com", "654321"))).toBe(false);
    expect(loginCodeHashesMatch(a, a.slice(0, 32))).toBe(false);
    expect(loginCodeHashesMatch("", "")).toBe(false);
  });
});

describe("formatLoginCode / failures", () => {
  it("groups the digits for the e-mail", () => {
    expect(formatLoginCode("123456")).toBe("123 456");
  });

  it("has a message for every failure reason", () => {
    for (const reason of ["invalid", "expired", "locked", "used"] as const) {
      expect(isLoginCodeFailure(reason)).toBe(true);
      expect(LOGIN_CODE_MESSAGES[reason]).toBeTruthy();
      expect(new LoginCodeError(reason).reason).toBe(reason);
    }
    expect(isLoginCodeFailure("credentials")).toBe(false);
    expect(isLoginCodeFailure(undefined)).toBe(false);
  });
});
