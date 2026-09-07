import { customAlphabet } from "nanoid";

// No ambiguous characters (0/o, 1/l/i): the token ends up in an e-mail address people read aloud and type.
const generate = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 10);

/** New unique local-part for a user's inbound receipt address, e.g. "kvitto-a1b2c3d4e5". */
export function newInboundToken(): string {
  return `kvitto-${generate()}`;
}
