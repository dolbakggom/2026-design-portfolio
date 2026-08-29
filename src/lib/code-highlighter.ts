import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import plaintext from "highlight.js/lib/languages/plaintext";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";

const languageAliases: Record<string, string> = {
  plaintext: "plaintext",
  html: "xml",
  css: "css",
  javascript: "javascript",
  typescript: "typescript",
  json: "json",
  bash: "bash"
};

hljs.registerLanguage("plaintext", plaintext);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);

export const highlightCode = (code: string, language: string) => {
  const grammar = languageAliases[language] ?? "plaintext";
  return hljs.highlight(code, { language: grammar, ignoreIllegals: true }).value;
};
