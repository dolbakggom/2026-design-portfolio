import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeAttributes } from '@tiptap/core';
import { sanitizeRichTextHtml } from '../src/lib/content-sanitizer.ts';

test('editor attribute merging cannot inherit executable attributes from JSON prototype keys', () => {
  const input = JSON.parse('{"__proto__":{"onerror":"unsafe","src":"invalid://canary"},"class":"safe"}');
  const result = mergeAttributes(input);
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.equal(result.onerror, undefined);
  assert.equal(result.src, undefined);
  assert.equal(result.class, 'safe');
  assert.equal(({} as Record<string, unknown>).onerror, undefined);
});

test('portfolio rich text excludes SVG animation and foreign HTML while retaining code', () => {
  const input = '<svg><set attributeName="href" to="javascript:alert(1)"/><foreignObject><img src="x" onerror="alert(1)"></foreignObject></svg><p>Safe <code>token</code></p>';
  assert.equal(sanitizeRichTextHtml(input), '<p>Safe <code>token</code></p>');
});
