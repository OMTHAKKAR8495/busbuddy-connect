import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const claimsSchema = z.object({
  pid: z.string().uuid(),
  sid: z.string().uuid(),
  exp: z.number().int().positive(),
  jti: z.string().regex(/^[a-f0-9]{32}$/),
}).strict();

export type PassTokenClaims = z.infer<typeof claimsSchema>;

function signingKey() {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error("QR token signing is not configured");
  return secret;
}

export function issueSignedPassToken(passId: string, studentId: string, now = Date.now()) {
  const claims = claimsSchema.parse({ pid: passId, sid: studentId, exp: Math.floor(now / 1000) + 30, jti: randomBytes(16).toString("hex") });
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", signingKey()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySignedPassToken(token: string, now = Date.now()): PassTokenClaims {
  if (token.length > 2048) throw new Error("Invalid token");
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) throw new Error("Invalid token");
  const expected = createHmac("sha256", signingKey()).update(payload).digest();
  let supplied: Buffer;
  try { supplied = Buffer.from(signature, "base64url"); } catch { throw new Error("Invalid token"); }
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new Error("Invalid token");
  let raw: unknown;
  try { raw = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); } catch { throw new Error("Invalid token"); }
  const claims = claimsSchema.parse(raw);
  if (claims.exp <= Math.floor(now / 1000)) throw new Error("Expired token");
  return claims;
}
