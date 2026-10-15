import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { escapeHtml, sanitizeSearch } from "./security-input.ts";

describe("security input helpers", () => {
  it("escapes HTML metacharacters", () => {
    assert.equal(escapeHtml(`<img src=x onerror='alert(1)'>&`), "&lt;img src=x onerror=&#39;alert(1)&#39;&gt;&amp;");
  });

  it("escapes SQL LIKE wildcards after validating length", () => {
    assert.equal(sanitizeSearch("A_%\\B"), "A\\_\\%\\\\B");
    assert.throws(() => sanitizeSearch("a".repeat(121)));
  });

  it("validates server payload types and lengths with zod", () => {
    const schema = z.object({ token: z.string().min(10).max(2048), busId: z.string().uuid() });
    assert.equal(schema.safeParse({ token: "short", busId: "nope" }).success, false);
    assert.equal(schema.safeParse({ token: "valid-token-contents", busId: "30000000-0000-4000-8000-000000000001" }).success, true);
  });
});
