/**
 * Share code generation using nanoid.
 *
 * Generates cryptographically secure, URL-friendly share codes.
 * These codes are used for public calculation URLs.
 */

import { nanoid } from 'nanoid'

/**
 * Generate a secure, URL-friendly share code.
 * Uses 21 characters (126 bits of entropy) - unguessable.
 *
 * Example: "V1StGXR8_Z5jdHi6B-myT"
 *
 * At 1000 share codes per second, it would take ~10^15 years
 * to have a 1% probability of a collision.
 */
export function generateShareCode(): string {
  return nanoid()
}

/**
 * Generate a shorter code for display purposes.
 * 12 characters (72 bits) - still secure for share links.
 *
 * Example: "V1StGXR8_Z5j"
 *
 * Use this when the full 21-character code is too long for display,
 * but still need reasonable security.
 */
export function generateShortShareCode(): string {
  return nanoid(12)
}
