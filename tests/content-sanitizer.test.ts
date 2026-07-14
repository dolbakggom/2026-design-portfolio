import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeProfileIntro, sanitizeRichTextHtml } from "../src/lib/content-sanitizer.ts";

test("profile intro keeps its supported emphasis markup and removes executable content", () => {
  const dirty = '<p style="color:red" onclick="alert(1)">Hello <em>quiet</em> <strong>bold</strong><br><script>alert(1)</script></p>';

  assert.equal(sanitizeProfileIntro(dirty), "<p>Hello <em>quiet</em> <strong>bold</strong><br /></p>");
});

test("work rich text keeps Tiptap text structures without attributes or embedded media", () => {
  const dirty = [
    '<p class="pasted" onmouseover="alert(1)">Intro <strong>strong</strong></p>',
    "<ul><li>One</li><li><em>Two</em></li></ul>",
    "<blockquote>Quote</blockquote>",
    '<img src="javascript:alert(1)"><iframe src="https://example.com"></iframe>',
    "<style>body{display:none}</style><script>alert(1)</script>"
  ].join("");

  assert.equal(
    sanitizeRichTextHtml(dirty),
    "<p>Intro <strong>strong</strong></p><ul><li>One</li><li><em>Two</em></li></ul><blockquote>Quote</blockquote>"
  );
});
