export interface EditResult {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

export type MarkdownAction =
  | 'bold'
  | 'italic'
  | 'code'
  | 'link'
  | 'heading'
  | 'quote'
  | 'ul'
  | 'ol'
  | 'task';

function wrapInline(value: string, start: number, end: number, marker: string, placeholder: string): EditResult {
  const before = value.slice(0, start);
  const after = value.slice(end);
  const selected = value.slice(start, end) || placeholder;
  const text = `${before}${marker}${selected}${marker}${after}`;
  return {
    text,
    selectionStart: before.length + marker.length,
    selectionEnd: before.length + marker.length + selected.length,
  };
}

function applyCode(value: string, start: number, end: number): EditResult {
  const selected = value.slice(start, end);
  if (selected.includes('\n')) {
    const before = value.slice(0, start);
    const after = value.slice(end);
    const text = `${before}\`\`\`\n${selected}\n\`\`\`${after}`;
    return {
      text,
      selectionStart: before.length + 4,
      selectionEnd: before.length + 4 + selected.length,
    };
  }
  return wrapInline(value, start, end, '`', 'code');
}

function applyLink(value: string, start: number, end: number): EditResult {
  const before = value.slice(0, start);
  const after = value.slice(end);
  const selected = value.slice(start, end);
  if (selected) {
    const text = `${before}[${selected}](url)${after}`;
    const urlStart = before.length + selected.length + 3;
    return { text, selectionStart: urlStart, selectionEnd: urlStart + 3 };
  }
  const text = `${before}[text](url)${after}`;
  return { text, selectionStart: before.length + 1, selectionEnd: before.length + 5 };
}

function lineRange(value: string, start: number, end: number): { lineStart: number; lineEnd: number } {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  let lineEnd = value.indexOf('\n', Math.max(end - 1, lineStart));
  if (lineEnd === -1) lineEnd = value.length;
  return { lineStart, lineEnd };
}

function togglePrefix(value: string, start: number, end: number, prefix: string): EditResult {
  const { lineStart, lineEnd } = lineRange(value, start, end);
  const lines = value.slice(lineStart, lineEnd).split('\n');
  const allPrefixed = lines.every((l) => l.startsWith(prefix));
  const newLines = allPrefixed ? lines.map((l) => l.slice(prefix.length)) : lines.map((l) => `${prefix}${l}`);
  const newBlock = newLines.join('\n');
  const text = value.slice(0, lineStart) + newBlock + value.slice(lineEnd);
  return { text, selectionStart: lineStart, selectionEnd: lineStart + newBlock.length };
}

function applyOrderedList(value: string, start: number, end: number): EditResult {
  const { lineStart, lineEnd } = lineRange(value, start, end);
  const lines = value.slice(lineStart, lineEnd).split('\n');
  const isNumbered = /^\d+\.\s/.test(lines[0]);
  const newLines = isNumbered
    ? lines.map((l) => l.replace(/^\d+\.\s/, ''))
    : lines.map((l, i) => `${i + 1}. ${l}`);
  const newBlock = newLines.join('\n');
  const text = value.slice(0, lineStart) + newBlock + value.slice(lineEnd);
  return { text, selectionStart: lineStart, selectionEnd: lineStart + newBlock.length };
}

export function applyMarkdown(value: string, start: number, end: number, action: MarkdownAction): EditResult {
  switch (action) {
    case 'bold':
      return wrapInline(value, start, end, '**', 'bold text');
    case 'italic':
      return wrapInline(value, start, end, '_', 'italic text');
    case 'code':
      return applyCode(value, start, end);
    case 'link':
      return applyLink(value, start, end);
    case 'heading':
      return togglePrefix(value, start, end, '# ');
    case 'quote':
      return togglePrefix(value, start, end, '> ');
    case 'ul':
      return togglePrefix(value, start, end, '- ');
    case 'task':
      return togglePrefix(value, start, end, '- [ ] ');
    case 'ol':
      return applyOrderedList(value, start, end);
  }
}
