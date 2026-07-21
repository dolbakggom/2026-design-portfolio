type TextCopy = { node: Text; text: string };

export const createHomeTypewriter = () => {
  const timers: number[] = [];
  const textCopies = new Map<HTMLElement, TextCopy[]>();
  let runCounter = 0;

  const typeText = (target: HTMLElement, value: string, speed = 58, done?: () => void) => {
    target.textContent = "";
    const chars = value.split("");
    chars.forEach((char, index) => {
      const timer = window.setTimeout(() => {
        target.textContent += char;
        if (index === chars.length - 1) done?.();
      }, speed * index);
      timers.push(timer);
    });
  };

  const prepareElement = (element: HTMLElement | null) => {
    if (!element || textCopies.has(element)) return;

    const copies: TextCopy[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => node.textContent?.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT
    });

    let node = walker.nextNode();
    while (node) {
      const textNode = node as Text;
      copies.push({ node: textNode, text: textNode.textContent ?? "" });
      node = walker.nextNode();
    }

    textCopies.set(element, copies);
    copies.forEach(({ node: textNode }) => {
      textNode.textContent = "";
    });
    element.dataset.typed = "false";
  };

  const fillElement = (element: HTMLElement | null) => {
    if (!element) return;
    const copies = textCopies.get(element);
    if (!copies) return;

    copies.forEach(({ node: textNode, text }) => {
      textNode.textContent = text;
    });
    element.dataset.typeRun = String(++runCounter);
    element.dataset.typed = "true";
  };

  const typeElement = (element: HTMLElement | null, speed = 24) => {
    if (!element || element.dataset.typed === "true") return;

    const copies = textCopies.get(element);
    if (!copies) return;

    if (speed <= 0) {
      fillElement(element);
      return;
    }

    element.dataset.typed = "true";
    const runId = String(++runCounter);
    element.dataset.typeRun = runId;
    let cursor = 0;
    copies.forEach(({ node: textNode, text }) => {
      textNode.textContent = "";
      text.split("").forEach((_, charIndex) => {
        const timer = window.setTimeout(() => {
          if (element.dataset.typeRun !== runId) return;
          textNode.textContent = text.slice(0, charIndex + 1);
        }, cursor * speed);
        timers.push(timer);
        cursor += 1;
      });
    });
  };

  const cleanup = () => {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers.length = 0;
    textCopies.clear();
  };

  return { cleanup, fillElement, prepareElement, typeElement, typeText };
};
