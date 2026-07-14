import sanitizeHtml from "sanitize-html";

const sanitizeFragment = (html: string, allowedTags: string[]) =>
  sanitizeHtml(html, {
    allowedTags,
    allowedAttributes: {},
    allowedSchemes: [],
    allowProtocolRelative: false
  });

export const sanitizeProfileIntro = (html: string) =>
  sanitizeFragment(html, ["p", "br", "em", "strong"]);

export const sanitizeRichTextHtml = (html: string) =>
  sanitizeFragment(html, ["p", "br", "strong", "em", "s", "ul", "ol", "li", "blockquote", "code", "pre", "hr"]);
