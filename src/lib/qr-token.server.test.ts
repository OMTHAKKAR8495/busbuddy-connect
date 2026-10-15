import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { issueSignedPassToken, verifySignedPassToken } from "./qr-token.server.ts";

const passId = "40000000-0000-4000-8000-000000000001";
const studentId = "10000000-0000-4000-8000-000000000001";
const now = 1_800_000_000_000;

beforeEach(() => { process.env.QR_SIGNING_SECRET = "a-test-signing-secret-with-at-least-32-bytes"; });

describe("signed QR pass tokens", () => {
  it("signs a short-lived token and verifies its claims", () => {
    const token = issueSignedPassToken(passId, studentId, now);
    const claims = verifySignedPassToken(token, now);
    assert.equal(claims.pid, passId);
    assert.equal(claims.sid, studentId);
    assert.equal(claims.exp, now / 1000 + 30);
    assert.match(claims.jti, /^[a-f0-9]{32}$/);
  });

  it("rejects expired tokens", () => {
    const token = issueSignedPassToken(passId, studentId, now);
    assert.throws(() => verifySignedPassToken(token, now + 31_000), /Expired token/);
  });

  it("rejects tampered payloads and signatures", () => {
    const token = issueSignedPassToken(passId, studentId, now);
    const [payload, signature] = token.split(".");
    assert.throws(() => verifySignedPassToken(`${payload.slice(0, -1)}A.${signature}`, now));
    assert.throws(() => verifySignedPassToken(`${payload}.${"A".repeat(signature.length)}`, now));
  });
});
