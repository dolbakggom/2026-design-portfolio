import assert from "node:assert/strict";
import { test } from "node:test";
import { highlightCode } from "../src/lib/code-highlighter.ts";

test("code highlighter applies language-aware token classes", () => {
  const typescript = highlightCode("const answer = Math.max(1, 2);", "typescript");
  const css = highlightCode(".card { color: #fff; }", "css");

  assert.match(typescript, /hljs-keyword/);
  assert.match(typescript, /hljs-variable|hljs-title|hljs-built_in/);
  assert.match(typescript, /hljs-number/);
  assert.match(css, /hljs-selector-class/);
  assert.match(css, /hljs-attribute/);
});

test("code highlighter escapes executable markup and safely falls back", () => {
  const html = highlightCode('<script>alert("unsafe")</script>', "html");
  const fallback = highlightCode("<script>", "unsupported-language");

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;/);
  assert.equal(fallback, "&lt;script&gt;");
});
