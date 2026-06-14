import type { Dispatch, RefObject, SetStateAction } from 'react';
import { applyMarkdown, type MarkdownAction } from '../lib/markdownEditor';

const BUTTONS: { action: MarkdownAction; label: string; title: string; className?: string }[] = [
  { action: 'heading', label: 'H', title: 'Heading' },
  { action: 'bold', label: 'B', title: 'Bold', className: 'font-bold' },
  { action: 'italic', label: 'I', title: 'Italic', className: 'italic' },
  { action: 'quote', label: '"', title: 'Quote' },
  { action: 'code', label: '<>', title: 'Code' },
  { action: 'link', label: '🔗', title: 'Link' },
  { action: 'ul', label: '•', title: 'Bulleted list' },
  { action: 'ol', label: '1.', title: 'Numbered list' },
  { action: 'task', label: '☑', title: 'Task list' },
];

export default function MarkdownToolbar({
  textareaRef,
  setValue,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  setValue: Dispatch<SetStateAction<string>>;
}) {
  function apply(action: MarkdownAction) {
    const el = textareaRef.current;
    if (!el) return;
    const result = applyMarkdown(el.value, el.selectionStart, el.selectionEnd, action);
    setValue(result.text);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  }

  return (
    <div className="flex gap-1 rounded-t-md border border-b-0 border-slate-300 bg-slate-50 px-2 py-1">
      {BUTTONS.map(({ action, label, title, className }) => (
        <button
          key={action}
          type="button"
          title={title}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => apply(action)}
          className={`rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-200 ${className ?? ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
